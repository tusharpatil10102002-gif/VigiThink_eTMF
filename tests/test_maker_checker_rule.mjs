// tests/test_maker_checker_rule.mjs
// Verification of Maker-Checker / Segregation of Duties Rule (ICH GCP E6 / 21 CFR Part 11)
// Requirement: The user uploading a document CANNOT assign themselves as reviewer or approve their own document.

const BASE_URL = 'http://localhost:5000/api';

async function runMakerCheckerTest() {
  console.log('========================================================================');
  console.log('VigiThink eTMF — Segregation of Duties & Maker-Checker Verification');
  console.log('Compliance: ICH GCP E6(R2) Section 5.1 & 21 CFR Part 11');
  console.log('Rule: Uploader cannot self-assign for review or self-approve QC');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${details ? `— ${details}` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate as Sukriti Singh (TMF Lead)
    const tmfLoginRes = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'sukriti.singh@vigithink.com', password: 'Sukriti@VigiThink2026' })
    });
    const tmfLoginJson = await tmfLoginRes.json();
    const tmfUser = tmfLoginJson.data;
    assert(tmfUser?.roleId === 'tmf_manager', 'TMF Lead (Sukriti Singh) authenticated');

    // 2. Fetch existing study or create temporary test study
    const studiesRes = await (await fetch(`${BASE_URL}/studies`)).json();
    let studyId = studiesRes.data[0]?.id;
    if (!studyId) {
      studyId = 'VTK-742';
    }

    // -------------------------------------------------------------------------
    // TEST 1: Sukriti uploads a document and attempts to assign HERSELF as reviewer
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1: Self-Assignment Attempt by Document Uploader ---');
    const selfAssignDocId = `DOC-TEST-SELF-${Date.now().toString().slice(-4)}`;
    const selfAssignRes = await fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'tmf_manager'
      },
      body: JSON.stringify({
        document_id: selfAssignDocId,
        document_title: 'SOP Revision Test Document',
        study_id: studyId,
        tmf_zone_id: '01',
        tmf_section_id: '01.01',
        tmf_artifact_id: '01.01.01',
        uploaded_by_id: tmfUser.id,
        uploaded_by_name: tmfUser.name,
        // Attempting to self-assign Sukriti as reviewer:
        assigned_reviewer_id: tmfUser.id,
        assigned_reviewer_name: tmfUser.name,
        user: tmfUser
      })
    });

    const selfAssignJson = await selfAssignRes.json();
    console.log('[DEBUG Test 1]', selfAssignRes.status, selfAssignJson);
    assert(
      selfAssignRes.status === 400 && selfAssignJson.error?.includes('Segregation of Duties Violation'),
      'System strictly blocked uploader from self-assigning as reviewer (HTTP 400 Bad Request)'
    );

    // -------------------------------------------------------------------------
    // TEST 2: Sukriti uploads document assigned to independent reviewer (QA Gourish)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Valid Independent Reviewer Assignment ---');
    const validDocId = `DOC-TEST-INDEP-${Date.now().toString().slice(-4)}`;
    const validUploadRes = await fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'tmf_manager'
      },
      body: JSON.stringify({
        document_id: validDocId,
        document_title: 'Trial Quality Protocol Amendment',
        study_id: studyId,
        tmf_zone_id: '01',
        tmf_section_id: '01.01',
        tmf_artifact_id: '01.01.01',
        uploaded_by_id: tmfUser.id,
        uploaded_by_name: tmfUser.name,
        // Assign to independent QA Specialist (Gourish Chouksey):
        assigned_reviewer_id: 'usr_gourish',
        assigned_reviewer_name: 'Gourish Chouksey',
        assigned_reviewer_role: 'qa',
        user: tmfUser
      })
    });

    const validUploadJson = await validUploadRes.json();
    assert(
      validUploadRes.status === 201 && validUploadJson.success,
      'Document registered successfully with independent QA reviewer'
    );

    // -------------------------------------------------------------------------
    // TEST 3: Sukriti (who uploaded the document) tries to QC approve her own document
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Self-QC Review & Approval Attempt ---');
    const selfQcRes = await fetch(`${BASE_URL}/documents/${validDocId}/qc`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'tmf_manager'
      },
      body: JSON.stringify({
        qc_status: 'Passed',
        comments: 'I am approving my own document.',
        user: tmfUser
      })
    });

    const selfQcJson = await selfQcRes.json();
    console.log('[DEBUG Test 3]', selfQcRes.status, selfQcJson);
    assert(
      selfQcRes.status === 403 && selfQcJson.error?.includes('Segregation of Duties Violation'),
      'System blocked uploader from performing QC on their own document (HTTP 403 Forbidden)'
    );

    // -------------------------------------------------------------------------
    // TEST 4: Independent Reviewer (CTM Shubham) performs QC approval
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Independent Reviewer QC Approval ---');
    const ctmLoginRes = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'shubham.sharnagat@vigithink.com', password: 'Shubham@VigiThink2026' })
    });
    const ctmUser = (await ctmLoginRes.json()).data;

    const indepQcRes = await fetch(`${BASE_URL}/documents/${validDocId}/qc`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'ctm'
      },
      body: JSON.stringify({
        qc_status: 'Passed',
        comments: 'Independent peer review completed by CTM. All criteria met.',
        user: ctmUser
      })
    });

    const indepQcJson = await indepQcRes.json();
    assert(
      indepQcRes.status === 200 && indepQcJson.data?.qc_status === 'Passed',
      'Independent reviewer (CTM Shubham) successfully approved document into TMF'
    );

    // -------------------------------------------------------------------------
    // Clean-up test document
    // -------------------------------------------------------------------------
    const adminLoginRes = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'admin@vigithink.com', password: 'Admin@VigiThink2026' })
    });
    const adminUser = (await adminLoginRes.json()).data;

    await fetch(`${BASE_URL}/documents/${validDocId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'system_admin' },
      body: JSON.stringify({ user: adminUser })
    });

  } catch (err) {
    console.error('Fatal execution error:', err.message);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`Maker-Checker Verification Summary: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================================\n');

  if (failed > 0) process.exit(1);
}

runMakerCheckerTest();
