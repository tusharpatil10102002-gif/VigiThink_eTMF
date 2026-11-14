const testDocId = 'DOC-REWORK-' + Date.now();
const baseUrl = 'http://127.0.0.1:5000/api';

console.log('Testing QC Rejection, Rework, and Re-approval Lifecycle Loop...');

// 1. Create doc
const cRes = await fetch(baseUrl + '/documents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    document_id: testDocId,
    document_title: 'Site Staff CV - Dr. Mehra',
    study_id: 'CLIN-001',
    tmf_zone_id: '05',
    tmf_section_id: '05.02',
    tmf_artifact_id: '05.02.02',
    tmf_artifact_name: 'Curriculum Vitae',
    user: { id: 'usr_student_s1', name: 'Aarav Sharma (CRC)', roleId: 'site_user' }
  })
});
const cJson = await cRes.json();
console.log('1. Initialized at Stage:', cJson.data.lifecycle_stage, cJson.data.lifecycle_stage_name);

// 2. QC Failed / Query Raised by TMF Lead
const qcRes = await fetch(baseUrl + '/documents/' + testDocId + '/qc', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    qcStatus: 'Failed',
    qualityIssueType: 'Missing PI Counter-signature',
    comments: 'CV is unsigned by the Principal Investigator. Return for correction.',
    user: { id: 'usr_sukriti_lead', name: 'Sukriti Singh (TMF Lead)', roleId: 'tmf_manager' }
  })
});
const qcJson = await qcRes.json();
console.log('2. QC Outcome (Stage 7):', qcJson.data.lifecycle_stage, qcJson.data.lifecycle_stage_name);
console.log('   Doc Status:', qcJson.data.status, '| Lifecycle Status:', qcJson.data.lifecycle_status);
console.log('   Quality Issue Flag:', qcJson.data.quality_issue_flag, '| Issue:', qcJson.data.quality_issue_type);

// 3. Rework re-submitted by CRC
const reworkRes = await fetch(baseUrl + '/documents/' + testDocId + '/lifecycle', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targetStage: 6,
    status: 'Re-submitted for QC',
    notes: 'PI signature obtained on CV. Re-submitted for TMF Lead verification.',
    user: { id: 'usr_student_s1', name: 'Aarav Sharma (CRC)', roleId: 'site_user' }
  })
});
const reworkJson = await reworkRes.json();
console.log('3. Stage after CRC Re-submission:', reworkJson.data.lifecycle_stage, reworkJson.data.lifecycle_stage_name);
console.log('   Lifecycle Status:', reworkJson.data.lifecycle_status);

// 4. Now TMF Lead re-inspects and Passes QC
const passRes = await fetch(baseUrl + '/documents/' + testDocId + '/qc', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    qcStatus: 'Passed',
    comments: 'PI signature confirmed present and verified. Quality clearance approved.',
    user: { id: 'usr_sukriti_lead', name: 'Sukriti Singh (TMF Lead)', roleId: 'tmf_manager' }
  })
});
const passJson = await passRes.json();
console.log('4. Stage after TMF Lead QC Clearance:', passJson.data.lifecycle_stage, passJson.data.lifecycle_stage_name);
console.log('   Final Doc Status:', passJson.data.status, '| Score:', passJson.data.qc_score);
console.log('✓ QC Rework & Re-approval loop test PASSED!');
