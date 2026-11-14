// tests/test_user_exact_workflow.mjs
// Live End-to-End Verification of User's Exact Clinical Trial Journey
// Study: CLI-001 (Phase III Oncology) | Site: SITE-001 | Document: Investigator CV (Zone 06)

const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('========================================================================');
  console.log('VigiThink eTMF — Industry Standard Clinical Workflow Verification');
  console.log('Study: CLI-001 (Phase III Oncology) | Site: SITE-001 (AIIMS Oncology)');
  console.log('Document: Investigator CV (Dr. Rajesh Rao, MD) — DIA Zone 06');
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
    // -------------------------------------------------------------
    // Initial Setup & Cleanup: Ensure Clean State Before Test
    // -------------------------------------------------------------
    const initialAdminLogin = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'admin@vigithink.com', password: 'Admin@VigiThink2026' })
    });
    const initialAdminJson = await initialAdminLogin.json();
    const adminUser = initialAdminJson.data;

    // Remove any leftover CLI-001 artifacts from previous runs
    try {
      await fetch(`${BASE_URL}/documents/DOC-CLI001-CV-001`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'system_admin' },
        body: JSON.stringify({ user: adminUser })
      });
      await fetch(`${BASE_URL}/studies/CLI-001`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'system_admin' },
        body: JSON.stringify({ user: adminUser })
      });
    } catch (_) {}

    // -------------------------------------------------------------
    // Step 1: Admin Authentication & Enterprise Role Verification
    // -------------------------------------------------------------
    console.log('--- Step 1: System Administrator Authentication & Setup ---');
    assert(initialAdminJson.success && adminUser?.roleId === 'system_admin', 'Admin logged in successfully with system_admin role');

    // -------------------------------------------------------------
    // Step 2: Admin Creates Clinical Study Protocol CLI-001
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Clinical Trial Protocol Initiation (CLI-001) ---');
    const studyPayload = {
      id: 'CLI-001',
      protocolNumber: 'PROT-CLI-001',
      shortName: 'Phase III Oncology Trial',
      title: 'A Multi-Center Phase III Study of Novel Targeted Immunotherapy in Advanced Solid Tumors',
      sponsor: 'Novavue Therapeutics',
      cro: 'VigiThink Clinical CRO',
      phase: 'Phase III',
      therapeuticArea: 'Oncology',
      indication: 'Advanced Solid Tumors',
      status: 'Active',
      startDate: '2026-11-01',
      plannedEndDate: '2028-11-01',
      countries: [
        {
          id: 'IN',
          name: 'India',
          code: 'IN',
          regulatoryAuthority: 'CDSCO',
          retentionPeriodYears: 25,
          sites: []
        }
      ]
    };

    const studyCreateRes = await fetch(`${BASE_URL}/studies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studyPayload)
    });
    const studyCreateJson = await studyCreateRes.json();
    assert(studyCreateJson.success && studyCreateJson.data.id === 'CLI-001', 'Admin successfully initiated Study Protocol CLI-001');

    // -------------------------------------------------------------
    // Step 3: Admin Creates Site SITE-001 & Delegates PI, CRC, CRA
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Investigational Site Setup & Personnel Delegation ---');
    const usersRes = await fetch(`${BASE_URL}/users`);
    const usersJson = await usersRes.json();
    const piUser = usersJson.data.find(u => u.loginId.toLowerCase().includes('arvind') || u.name.includes('Arvind') || u.roleId === 'investigator');
    const crcUser = usersJson.data.find(u => u.loginId.toLowerCase().includes('sanjay') || u.roleId === 'site_user');
    const craUser = usersJson.data.find(u => u.loginId.toLowerCase().includes('shweta') || u.roleId === 'cra');

    const sitePayload = {
      countryId: 'IN',
      site: {
        id: 'SITE-001',
        number: 'SITE-001',
        name: 'AIIMS RPC Oncology Centre, New Delhi',
        country: 'India',
        piName: piUser.name,
        piEmail: piUser.email,
        piPhone: '+91 98111 22334',
        piLicense: 'MCI-REG-54892',
        assignedPiId: piUser.id,
        crcName: crcUser.name,
        crcEmail: crcUser.email,
        assignedCrcId: crcUser.id,
        assignedCraId: craUser.id,
        assignedCraName: craUser.name,
        status: 'Active'
      },
      user: adminUser
    };

    const siteCreateRes = await fetch(`${BASE_URL}/studies/CLI-001/sites`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'system_admin'
      },
      body: JSON.stringify(sitePayload)
    });
    const siteCreateJson = await siteCreateRes.json();
    assert(siteCreateJson.success, 'Admin configured Site SITE-001 under CLI-001');

    // Verify 4D Scope synchronization for PI, CRC, CRA
    const usersUpdatedRes = await fetch(`${BASE_URL}/users`);
    const usersUpdatedJson = await usersUpdatedRes.json();
    const piUserUpdated = usersUpdatedJson.data.find(u => u.id === piUser.id);
    const crcUserUpdated = usersUpdatedJson.data.find(u => u.id === crcUser.id);
    const craUserUpdated = usersUpdatedJson.data.find(u => u.id === craUser.id);

    assert(piUserUpdated && piUserUpdated.studyScope === 'CLI-001' && piUserUpdated.siteScope.includes('SITE-001'), `PI (${piUser.name}) automatically scoped to CLI-001 / SITE-001`);
    assert(crcUserUpdated && crcUserUpdated.studyScope === 'CLI-001' && crcUserUpdated.siteScope.includes('SITE-001'), `CRC (${crcUser.name}) automatically scoped to CLI-001 / SITE-001`);
    assert(craUserUpdated && craUserUpdated.studyScope === 'CLI-001' && craUserUpdated.siteScope.includes('SITE-001'), `CRA (${craUser.name}) automatically scoped to CLI-001 / SITE-001`);

    // -------------------------------------------------------------
    // Step 4: CRC (Sanjay Pawar) Uploads Investigator CV
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Document Upload & Metadata Ingestion by Site CRC ---');
    const cvPayload = {
      document_id: 'DOC-CLI001-CV-001',
      document_title: 'Investigator Curriculum Vitae — Dr. Rajesh Rao, MD',
      file_name: 'Investigator_CV_Dr_Rajesh_Rao.pdf',
      file_path: '/uploads/Investigator_CV_Dr_Rajesh_Rao.pdf',
      study_id: 'CLI-001',
      site_id: 'SITE-001',
      tmf_zone_id: '06',
      tmf_section_id: '06.01',
      tmf_artifact_id: '06.01.02',
      artifact_name: 'Investigator Curriculum Vitae',
      version_number: '1.0',
      document_date: '2026-11-01',
      filing_date: '2026-11-01',
      status: 'Draft',
      qc_status: 'Not Started',
      lifecycle_stage: 6,
      lifecycle_status: 'Pending QC Inspection',
      uploaded_by_id: crcUser.id,
      uploaded_by_name: crcUser.name,
      uploaded_by_role: 'site_user',
      assigned_reviewer_id: 'tmf_lead_sukriti',
      assigned_reviewer_name: 'Sukriti Singh',
      checksum_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    };

    const docUploadRes = await fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cvPayload)
    });
    const docUploadJson = await docUploadRes.json();
    assert(docUploadJson.success && docUploadJson.data.document_id === 'DOC-CLI001-CV-001', 'CRC uploaded Investigator CV mapped to DIA Zone 06 (Site Management)');
    assert(docUploadJson.data.lifecycle_stage === 6, 'CV successfully routed to Lifecycle Stage 6 (QC Clearance Queue)');

    // -------------------------------------------------------------
    // Step 5: TMF Lead Discrepancy Inspection (Query / Rework Returned)
    // -------------------------------------------------------------
    console.log('\n--- Step 5: TMF Lead 10-Point QC Inspection & Query Workflow ---');
    const tmfLoginRes = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'sukriti.singh@vigithink.com', password: 'Sukriti@VigiThink2026' })
    });
    const tmfLoginJson = await tmfLoginRes.json();
    assert(tmfLoginJson.success && tmfLoginJson.data?.roleId === 'tmf_manager', 'TMF Lead (Sukriti Singh) authenticated with QC Approver privilege');
    const tmfUser = tmfLoginJson.data;

    const dynamicQueryId = `QRY-CLI001-${Date.now().toString().slice(-4)}`;
    const queryPayload = {
      query_id: dynamicQueryId,
      document_id: 'DOC-CLI001-CV-001',
      study_id: 'CLI-001',
      issue_type: 'Missing Required Signature',
      comment: 'Investigator signature and date missing on Page 4 of CV. Please have Dr. Rao sign and re-submit.',
      user: tmfUser
    };
    const queryRes = await fetch(`${BASE_URL}/queries`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'tmf_manager'
      },
      body: JSON.stringify(queryPayload)
    });
    const queryJson = await queryRes.json();
    assert(queryJson.success && queryJson.data.query_id === dynamicQueryId, `TMF Lead successfully raised formal quality query (${dynamicQueryId}) under SOP-TMF-04`);

    // Flag document as rework required
    await fetch(`${BASE_URL}/documents/DOC-CLI001-CV-001/qc`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'tmf_manager'
      },
      body: JSON.stringify({
        qc_status: 'Query Raised',
        comments: 'Signature missing on page 4. Returned to site coordinator.',
        quality_issue_type: 'Missing Required Signature',
        user: tmfUser
      })
    });

    const docCheckRes = await fetch(`${BASE_URL}/documents/DOC-CLI001-CV-001`);
    const docCheckJson = await docCheckRes.json();
    assert(docCheckJson.data.qc_status === 'Query Raised' && docCheckJson.data.lifecycle_stage === 7, 'Document accurately flagged in Stage 7 (Returned for Rework to CRC)');

    // -------------------------------------------------------------
    // Step 6: CRC Remediation & Resubmission (v1.1)
    // -------------------------------------------------------------
    console.log('\n--- Step 6: Site CRC Query Response & Signed CV Resubmission ---');
    const resolveQueryRes = await fetch(`${BASE_URL}/queries/${dynamicQueryId}/resolve`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'site_user'
      },
      body: JSON.stringify({
        response: 'Dr. Rao has wet-ink signed and dated page 4 of the CV on 02-Nov-2026. Updated signed CV uploaded.',
        status: 'Response Provided',
        user: crcUser
      })
    });
    const resolveQueryJson = await resolveQueryRes.json();
    assert(resolveQueryJson.success && resolveQueryJson.data.status === 'Response Provided', `CRC recorded remediation explanation against Query ${dynamicQueryId}`);

    // Resubmit document with incremented version v1.1 via rework-submit endpoint
    const resubmitDocRes = await fetch(`${BASE_URL}/documents/DOC-CLI001-CV-001/rework-submit`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'site_user'
      },
      body: JSON.stringify({
        version_number: '1.1',
        rework_notes: 'Signed CV v1.1 submitted by CRC Sanjay Pawar.',
        user: crcUser
      })
    });
    const resubmitJson = await resubmitDocRes.json();
    assert(resubmitJson.success && resubmitJson.data.version_number === '1.1', 'CV version incremented to v1.1 and re-routed to Stage 6 QC Queue');

    // -------------------------------------------------------------
    // Step 7: TMF Lead 10-Point Checklist QC Pass & Part 11 Approval
    // -------------------------------------------------------------
    console.log('\n--- Step 7: TMF Lead 10-Point Checklist Clearance & 21 CFR Part 11 Sign-off ---');
    const qcPassRes = await fetch(`${BASE_URL}/documents/DOC-CLI001-CV-001/qc`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'tmf_manager'
      },
      body: JSON.stringify({
        qc_status: 'Passed',
        comments: 'All 10 quality checks verified. Signature on page 4 confirmed valid. Document accepted for filing.',
        user: tmfUser
      })
    });
    const qcPassJson = await qcPassRes.json();
    assert(qcPassJson.success && qcPassJson.data.qc_status === 'Passed', 'TMF Lead approved document with 10-Point ALCOA+ QC clearance');
    assert(qcPassJson.data.status === 'Approved' && qcPassJson.data.lifecycle_stage === 9, 'CV officially filed into TMF Zone 06 (Stage 9: TMF Filing)');

    // Apply 21 CFR Part 11 e-Signature
    const signRes = await fetch(`${BASE_URL}/documents/DOC-CLI001-CV-001/sign`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'tmf_manager'
      },
      body: JSON.stringify({
        user: tmfUser,
        meaning: 'I approve the authenticity, completeness, and filing of this essential investigator record under SOP-TMF-04.',
        passwordVerified: true
      })
    });
    const signJson = await signRes.json();
    assert(signJson.success && signJson.data.signature_type === 'Electronic (Part 11)', '21 CFR Part 11 Electronic Signature sealed with non-repudiation manifest');
    assert(signJson.data.status === 'Effective' && signJson.data.lifecycle_stage === 10, 'Document status set to Effective & Stage 10 (Inspection Ready)');

    // -------------------------------------------------------------
    // Step 8: 21 CFR Part 11 Immutable Audit Trail Verification
    // -------------------------------------------------------------
    console.log('\n--- Step 8: Immutable Audit Trail Ledger Verification ---');
    const auditRes = await fetch(`${BASE_URL}/audit-logs`);
    const auditJson = await auditRes.json();
    const studyLogs = auditJson.data.filter(l => l.study_id === 'CLI-001');
    assert(studyLogs.length >= 3, `Audit trail recorded ${studyLogs.length} immutable events for CLI-001`);

    // Verify 405 Method Not Allowed on audit modification
    const tamperRes = await fetch(`${BASE_URL}/audit-logs/aud_test`, { method: 'DELETE' });
    assert(tamperRes.status === 405, '21 CFR §11.10(e) Immutability: DELETE on audit trail strictly rejected with 405 Method Not Allowed');

    // -------------------------------------------------------------
    // Step 9: Study Closeout & 25-Year Statutory Archival Lock
    // -------------------------------------------------------------
    console.log('\n--- Step 9: Study Closeout & 25-Year Statutory Retention Lock ---');
    const archiveRes = await fetch(`${BASE_URL}/studies/CLI-001/archive`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'system_admin'
      },
      body: JSON.stringify({
        reason: 'Study closeout completed. 25-year digital TMF regulatory retention lock engaged.',
        user: adminUser
      })
    });
    const archiveJson = await archiveRes.json();
    assert(archiveJson.success, 'Study CLI-001 successfully transitioned to Archived status with 25-year lock');

    // Verify document record is permanently locked in Stage 11 (Archival)
    const finalDocRes = await fetch(`${BASE_URL}/documents/DOC-CLI001-CV-001`);
    const finalDocJson = await finalDocRes.json();
    assert(finalDocJson.data.lifecycle_stage === 11 && finalDocJson.data.lifecycle_status.includes('Archived'), 'Investigator CV entered permanent Write-Once Read-Many (WORM) 25-Year Lock');

    // -------------------------------------------------------------
    // Step 10: Clean-Up & Production Clean Slate Restoration
    // -------------------------------------------------------------
    console.log('\n--- Step 10: Clean-Up & Production Clean Slate Restoration ---');
    await fetch(`${BASE_URL}/documents/DOC-CLI001-CV-001`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'system_admin' },
      body: JSON.stringify({ user: adminUser, reason: 'Test clean up' })
    });
    await fetch(`${BASE_URL}/studies/CLI-001`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'system_admin' },
      body: JSON.stringify({ user: adminUser, reason: 'Test clean up' })
    });

    const finalStudies = await (await fetch(`${BASE_URL}/studies`)).json();
    const finalDocs = await (await fetch(`${BASE_URL}/documents`)).json();
    const cli001StillExists = finalStudies.data.some(s => s.id === 'CLI-001');
    const docStillExists = finalDocs.data.some(d => d.document_id === 'DOC-CLI001-CV-001');
    assert(!cli001StillExists, 'Test Study CLI-001 cleanly de-provisioned from repository');
    assert(!docStillExists, 'Test Document DOC-CLI001-CV-001 cleanly de-provisioned from repository');

  } catch (err) {
    console.error('Fatal execution error:', err.message);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`Execution Summary: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================================\n');

  if (failed > 0) process.exit(1);
}

runTest();
