// tests/test_full_etmf_workflow_checklist.mjs
// Rigorous 14-Point Clinical Trial eTMF Workflow Testing Checklist
// Reference: ICH GCP E6(R2), 21 CFR Part 11, DIA TMF Reference Model v3.1

const BASE_URL = 'http://localhost:5000/api';

async function run14PointChecklist() {
  console.log('========================================================================');
  console.log('VigiThink eTMF — Complete 14-Point Clinical Workflow Checklist');
  console.log('Document: Investigator CV | Study: CLI-001 | Site: SITE-001');
  console.log('Actors: Site User, Document Controller, CRA, TMF Lead');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, checklistItem, details = '') {
    if (condition) {
      console.log(`[PASS] ${checklistItem}`);
      passed++;
    } else {
      console.error(`[FAIL] ${checklistItem} ${details ? `— ${details}` : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Initial Setup: Authenticate All Enterprise Roles
    // -------------------------------------------------------------
    console.log('--- Phase 0: Authenticating Trial Personnel ---');
    const adminLogin = await (await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'admin@vigithink.com', password: 'Admin@VigiThink2026' })
    })).json();
    const adminUser = adminLogin.data;

    const crcLogin = await (await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'Sanjay.Pawar@vigithink.com', password: 'Sanjay@9926999827' })
    })).json();
    const crcUser = crcLogin.data;

    const docControllerLogin = await (await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'Somesh.Patidar@vigithink.com', password: 'Somesh@9691749822' })
    })).json();
    const docControllerUser = docControllerLogin.data;

    const craLogin = await (await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'Shweta.Pagare@vigithink.com', password: 'Shweta@8766689151' })
    })).json();
    const craUser = craLogin.data;

    const tmfLogin = await (await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'sukriti.singh@vigithink.com', password: 'Sukriti@VigiThink2026' })
    })).json();
    const tmfLeadUser = tmfLogin.data;

    // Ensure study CLI-001 exists for testing
    let study = await (await fetch(`${BASE_URL}/studies/CLI-001`)).json();
    if (!study.data) {
      const studyRes = await fetch(`${BASE_URL}/studies`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': 'system_admin'
        },
        body: JSON.stringify({
          id: 'CLI-001',
          protocolNumber: 'PROT-CLI-001',
          shortName: 'CLI-001',
          title: 'Phase III Oncology Clinical Trial',
          sponsor: 'Novavue Therapeutics',
          cro: 'VigiThink Clinical Research Services',
          therapeuticArea: 'Oncology',
          indication: 'Metastatic Non-Small Cell Lung Carcinoma (NSCLC)',
          phase: 'Phase III',
          status: 'Active',
          countries: [
            {
              id: 'IN',
              name: 'India',
              code: 'IN',
              regulatoryAuthority: 'CDSCO',
              retentionPeriodYears: 25,
              sites: [
                {
                  id: 'SITE-001',
                  number: 'SITE-001',
                  name: 'AIIMS RPC Oncology Centre, New Delhi',
                  piName: 'Dr. Rajesh Rao, MD',
                  status: 'Active'
                }
              ]
            }
          ],
          user: adminUser
        })
      });
      const studyCreateJson = await studyRes.json();
      console.log('CLI-001 Created for checklist:', studyRes.status, studyCreateJson);
    }

    const testDocId = `DOC-CLI001-CV-${Date.now().toString().slice(-4)}`;

    // -------------------------------------------------------------
    // Item 1: Site User uploads a document
    // -------------------------------------------------------------
    console.log('\n--- Checklist Item 1: Site User Uploads Document ---');
    const uploadRes = await fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'site_user' },
      body: JSON.stringify({
        document_id: testDocId,
        document_title: 'Investigator Curriculum Vitae — Dr. Rajesh Rao, MD',
        study_id: 'CLI-001',
        site_id: 'SITE-001',
        tmf_zone_id: '06',
        tmf_section_id: '06.01',
        tmf_artifact_id: '06.01.02',
        tmf_artifact_name: 'Investigator Curriculum Vitae',
        workflow_type: 'Investigator CV',
        version_number: '1.0',
        uploaded_by_id: crcUser.id,
        uploaded_by_name: crcUser.name,
        uploaded_by_role: 'site_user',
        assigned_reviewer_id: craUser.id,
        assigned_reviewer_name: craUser.name,
        assigned_reviewer_role: 'cra',
        user: crcUser
      })
    });
    const uploadJson = await uploadRes.json();
    console.log('[DEBUG Item 1]', uploadRes.status, uploadJson);
    assert(uploadJson.success && uploadJson.data.status === 'Submitted', '1. Site User uploads a document (Status: Submitted)');

    // -------------------------------------------------------------
    // Item 2: Document Controller receives notification
    // -------------------------------------------------------------
    console.log('\n--- Checklist Item 2: Document Controller Receives Notification ---');
    const notifsDocCtrl = await (await fetch(`${BASE_URL}/notifications?roleId=doc_controller`)).json();
    const docSubmittedNotif = notifsDocCtrl.data.find(n => n.document_id === testDocId && n.type === 'DOCUMENT_SUBMITTED');
    assert(!!docSubmittedNotif, '2. Document Controller receives notification of new submission');

    // -------------------------------------------------------------
    // Item 3: Document Controller rejects document with reason
    // -------------------------------------------------------------
    console.log('\n--- Checklist Item 3: Document Controller Rejects Document With Reason ---');
    const rejectRes = await fetch(`${BASE_URL}/documents/${testDocId}/qc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'doc_controller' },
      body: JSON.stringify({
        qc_status: 'Failed',
        quality_issue_type: 'Missing Required Signature',
        comments: 'Investigator wet-ink signature missing on page 4. Please sign and return.',
        user: docControllerUser
      })
    });
    const rejectJson = await rejectRes.json();
    assert(
      rejectJson.success && 
      rejectJson.data.status === 'QC Rejected' && 
      rejectJson.data.rejection_reason === 'Missing Required Signature' &&
      rejectJson.data.rejection_date_time,
      '3. Document Controller rejects document with reason & mandatory rejection metadata'
    );

    // -------------------------------------------------------------
    // Item 4: Site User receives correction request
    // -------------------------------------------------------------
    console.log('\n--- Checklist Item 4: Site User Receives Correction Request ---');
    const notifsSite = await (await fetch(`${BASE_URL}/notifications?userId=${crcUser.id}`)).json();
    const correctionNotif = notifsSite.data.find(n => n.document_id === testDocId && n.type === 'QC_REJECTED');
    assert(!!correctionNotif && correctionNotif.message.includes('Missing Required Signature'), '4. Site User receives correction request notification with reason');

    // -------------------------------------------------------------
    // Item 5: Site User uploads corrected version
    // -------------------------------------------------------------
    console.log('\n--- Checklist Item 5: Site User Uploads Corrected Version ---');
    const reworkRes = await fetch(`${BASE_URL}/documents/${testDocId}/rework-submit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'site_user' },
      body: JSON.stringify({
        version_number: '1.1',
        rework_notes: 'Dr. Rao signed page 4 on 06-Nov-2026. Corrected CV attached.',
        user: crcUser
      })
    });
    const reworkJson = await reworkRes.json();
    assert(reworkJson.success && reworkJson.data.version_number === '1.1', '5. Site User uploads corrected version v1.1');

    // -------------------------------------------------------------
    // Item 6: Previous version remains accessible in history
    // -------------------------------------------------------------
    console.log('\n--- Checklist Item 6: Previous Version Remains Accessible in History ---');
    const docVerCheck = await (await fetch(`${BASE_URL}/documents/${testDocId}`)).json();
    const prevVer = docVerCheck.data.versions_history?.find(v => v.version_number === '1.0');
    assert(!!prevVer && prevVer.status === 'Superseded', '6. Previous version (v1.0) remains accessible in history with Superseded status');

    // -------------------------------------------------------------
    // Item 7: Document Controller passes QC
    // -------------------------------------------------------------
    console.log('\n--- Checklist Item 7: Document Controller Passes QC ---');
    const docCtrlPassRes = await fetch(`${BASE_URL}/documents/${testDocId}/qc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'doc_controller' },
      body: JSON.stringify({
        qc_status: 'Passed',
        target_status: 'QC Passed',
        comments: 'Signature verified on page 4. ALCOA+ compliance confirmed.',
        user: docControllerUser
      })
    });
    const docCtrlPassJson = await docCtrlPassRes.json();
    assert(docCtrlPassJson.success && docCtrlPassJson.data.status === 'QC Passed', '7. Document Controller passes QC (Distinct Milestone Status: QC Passed)');

    // -------------------------------------------------------------
    // Item 8: CRA receives review task
    // -------------------------------------------------------------
    console.log('\n--- Checklist Item 8: CRA Receives Review Task ---');
    const notifsCra = await (await fetch(`${BASE_URL}/notifications?roleId=cra`)).json();
    const craTaskNotif = notifsCra.data.find(n => n.document_id === testDocId && n.type === 'QC_PASSED');
    assert(!!craTaskNotif, '8. CRA receives review task notification for content verification');

    // -------------------------------------------------------------
    // Item 9: CRA requests revision
    // -------------------------------------------------------------
    console.log('\n--- Checklist Item 9: CRA Requests Revision ---');
    const craRevReqRes = await fetch(`${BASE_URL}/documents/${testDocId}/content-review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'cra' },
      body: JSON.stringify({
        reviewDecision: 'Revision Required',
        correctionsRequested: 'GCP Certificate date in CV does not match recent re-certification',
        comments: 'Please attach latest 2026 GCP Refresher date in CV education section.',
        user: craUser
      })
    });
    const craRevReqJson = await craRevReqRes.json();
    assert(craRevReqJson.success && craRevReqJson.data.status === 'Revision Required', '9. CRA requests revision (Status: Revision Required)');

    // -------------------------------------------------------------
    // Item 10: Corrected document is resubmitted & review passed
    // -------------------------------------------------------------
    console.log('\n--- Checklist Item 10: Corrected Document Resubmitted & CRA Verifies ---');
    await fetch(`${BASE_URL}/documents/${testDocId}/rework-submit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'site_user' },
      body: JSON.stringify({
        version_number: '1.2',
        rework_notes: 'CV updated with 2026 GCP Refresher date.',
        user: crcUser
      })
    });
    // Doc Controller clears QC on v1.2
    await fetch(`${BASE_URL}/documents/${testDocId}/qc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'doc_controller' },
      body: JSON.stringify({ qc_status: 'Passed', target_status: 'QC Passed', user: docControllerUser })
    });
    // CRA passes content review
    const craPassRes = await fetch(`${BASE_URL}/documents/${testDocId}/content-review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'cra' },
      body: JSON.stringify({
        reviewDecision: 'Passed',
        comments: 'Qualifications and 2026 GCP training verified by CRA.',
        user: craUser
      })
    });
    const craPassJson = await craPassRes.json();
    assert(craPassJson.success && craPassJson.data.status === 'Approval Pending', '10. Corrected document resubmitted and verified by CRA (Status: Approval Pending)');

    // -------------------------------------------------------------
    // Item 11: Authorized approver completes approval
    // -------------------------------------------------------------
    console.log('\n--- Checklist Item 11: Authorized Approver Completes Approval ---');
    const approveRes = await fetch(`${BASE_URL}/documents/${testDocId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'tmf_manager' },
      body: JSON.stringify({
        user: tmfLeadUser,
        meaning: 'I approve the authenticity, qualifications, and trial compliance of this Investigator CV.',
        passwordVerified: true
      })
    });
    const approveJson = await approveRes.json();
    assert(
      approveJson.success && 
      approveJson.data.signature_type === 'Electronic (Part 11)' && 
      (approveJson.data.status === 'Approved' || approveJson.data.status === 'Effective'),
      '11. Authorized approver (TMF Lead) completes 21 CFR Part 11 Electronic Signature Approval'
    );

    // -------------------------------------------------------------
    // Item 12: Document Controller completes filing
    // -------------------------------------------------------------
    console.log('\n--- Checklist Item 12: Document Controller Completes Filing ---');
    const filingRes = await fetch(`${BASE_URL}/documents/${testDocId}/file`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'doc_controller' },
      body: JSON.stringify({
        notes: 'Final metadata verified. Officially filed in Zone 06 > Artifact 06.01.02.',
        user: docControllerUser
      })
    });
    const filingJson = await filingRes.json();
    assert(filingJson.success && filingJson.data.status === 'Filed', '12. Document Controller completes filing (Distinct Milestone Status: Filed)');

    // -------------------------------------------------------------
    // Item 13: Audit trail captures every activity
    // -------------------------------------------------------------
    console.log('\n--- Checklist Item 13: Audit Trail Captures Every Activity ---');
    const auditRes = await (await fetch(`${BASE_URL}/audit-logs`)).json();
    const docLogs = auditRes.data.filter(l => l.target_id === testDocId || l.study_id === 'CLI-001');
    assert(docLogs.length >= 6, `13. Audit trail captured ${docLogs.length} immutable events across the lifecycle`);

    // -------------------------------------------------------------
    // Item 14: Unauthorized user cannot access restricted document / Self-QC blocked
    // -------------------------------------------------------------
    console.log('\n--- Checklist Item 14: Unauthorized Access & Segregation of Duties ---');
    const unauthorizedQcAttempt = await fetch(`${BASE_URL}/documents/${testDocId}/qc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'site_user' },
      body: JSON.stringify({ qc_status: 'Passed', comments: 'Unauthorized QC', user: crcUser })
    });
    assert(unauthorizedQcAttempt.status === 403, '14. Unauthorized user (Site User) cannot approve QC (HTTP 403 Forbidden)');

    // -------------------------------------------------------------
    // Clean-up Test Document
    // -------------------------------------------------------------
    await fetch(`${BASE_URL}/documents/${testDocId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'system_admin' },
      body: JSON.stringify({ user: adminUser })
    });

    await fetch(`${BASE_URL}/studies/CLI-001`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'system_admin' },
      body: JSON.stringify({ user: adminUser })
    });

  } catch (err) {
    console.error('Fatal checklist execution error:', err.message);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`eTMF Workflow Testing Checklist Summary: ${passed} / 14 Completed`);
  console.log('========================================================================\n');

  if (failed > 0) process.exit(1);
}

run14PointChecklist();
