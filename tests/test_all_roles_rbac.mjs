/**
 * VigiThink eTMF — All Roles & Credentials RBAC Matrix Verification
 */

const BASE_URL = 'http://localhost:5000/api';

const CREDENTIALS = [
  { role: 'system_admin', loginId: 'admin@vigithink.com', password: 'admin123', name: 'Tushar Patil' },
  { role: 'tmf_manager', loginId: 'sukriti.singh@vigithink.com', password: 'sukriti123', name: 'Sukriti Singh' },
  { role: 'cra', loginId: 'Shweta.Pagare@vigithink.com', password: 'Shweta@8766689151', name: 'Shweta Pagare' },
  { role: 'site_user', loginId: 'Sanjay.Pawar@vigithink.com', password: 'Sanjay@9926999827', name: 'Sanjay Pawar' },
  { role: 'doc_controller', loginId: 'Somesh.Patidar@vigithink.com', password: 'Somesh@9691749822', name: 'Somesh Patidar' },
  { role: 'qa', loginId: 'Gourish.Chouksey@vigithink.com', password: 'Gourish@8815989114', name: 'Gourish Chouksey' },
  { role: 'ctm', loginId: 'Shubham.Sharnagat@vigithink.com', password: 'Shubham@9244630832', name: 'Shubham Sharnagat' },
  { role: 'tmf_lead_trainee', loginId: 'Mary.Vismaya@vigithink.com', password: 'Mary@7034197627', name: 'Mary Vismaya' },
  { role: 'auditor', loginId: 'inspector@vigithink.com', password: 'Inspector@2026', name: 'Regulatory Auditor' }
];

async function runRBACTests() {
  console.log('='.repeat(70));
  console.log('VigiThink eTMF: All Roles & Credentials RBAC Verification');
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Authenticate every single role
  console.log('\n--- 1. Testing Login Authentication for All 9 Roles ---');
  const authenticatedUsers = {};
  for (const cred of CREDENTIALS) {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: cred.loginId, password: cred.password })
    });
    const data = await res.json();
    assert(res.ok && data.success, `Role '${cred.role}' (${cred.name}) logged in successfully`);
    if (data.data) {
      authenticatedUsers[cred.role] = data.data;
    }
  }

  // 2. Test Admin Only Privileges
  console.log('\n--- 2. Testing Administrator Privileges & Non-Admin Enforcement ---');
  // Attempt to delete non-existent study with CRA -> should be 403 Forbidden
  const craDeleteRes = await fetch(`${BASE_URL}/studies/FAKE-STUDY`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: authenticatedUsers.cra })
  });
  assert(craDeleteRes.status === 403, 'CRA blocked from deleting study (403 Forbidden)');

  // Attempt to delete non-existent study with Site User -> should be 403 Forbidden
  const siteUserDeleteRes = await fetch(`${BASE_URL}/studies/FAKE-STUDY`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: authenticatedUsers.site_user })
  });
  assert(siteUserDeleteRes.status === 403, 'Site User blocked from deleting study (403 Forbidden)');

  // Attempt user creation with CTM -> should be 403 Forbidden
  const ctmCreateUserRes = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Unauthorized User',
      loginId: 'unauth_user',
      password: 'password',
      adminUser: authenticatedUsers.ctm
    })
  });
  assert(ctmCreateUserRes.status === 403, 'CTM blocked from creating users (403 Forbidden)');

  // 3. Document Lifecycle QC Permissions Test
  console.log('\n--- 3. Testing Quality Control (QC) Permissions Enforcement ---');
  // First, create a temporary study and document to test QC transitions
  const adminUser = authenticatedUsers.system_admin;
  const tempStudyId = `VTK-QC-TEST-${Date.now().toString().slice(-4)}`;
  await fetch(`${BASE_URL}/studies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: tempStudyId,
      shortName: 'QC-Test-Protocol',
      title: 'QC Flow Verification Trial',
      protocolNumber: 'VTK-QC-01',
      phase: 'Phase II',
      therapeuticArea: 'Ophthalmology',
      sponsor: 'VigiThink Therapeutics',
      cro: 'VigiThink Clinical Services',
      status: 'Active',
      countries: [{ id: 'IND', name: 'India', code: 'IND', sites: [] }],
      user: adminUser
    })
  });

  const tempDocId = `DOC-QC-${Date.now().toString().slice(-4)}`;
  await fetch(`${BASE_URL}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: tempDocId,
      document_id: tempDocId,
      study_id: tempStudyId,
      zone_id: '05',
      section_id: '05.02',
      artifact_id: '05.02.01',
      title: 'Site Staff Delegation Log Test',
      file_name: 'delegation_log_test.pdf',
      file_size_mb: '1.2',
      status: 'Under Review',
      qc_status: 'Pending QC Review',
      uploaded_by_id: authenticatedUsers.site_user.id,
      uploaded_by_name: authenticatedUsers.site_user.name,
      uploaded_by_role: 'Site User / Investigator'
    })
  });

  // Attempt QC Pass with Site User -> must be 403 Forbidden
  const siteUserQcPassRes = await fetch(`${BASE_URL}/documents/${tempDocId}/qc`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'site_user' },
    body: JSON.stringify({
      qcStatus: 'Passed',
      comments: 'Site user attempting illegal QC self-approval',
      user: authenticatedUsers.site_user
    })
  });
  assert(siteUserQcPassRes.status === 403, 'Site User blocked from QC Pass (403 Forbidden - Segregation of Duties)');

  // Attempt QC Pass with CRA -> must be 403 Forbidden
  const craQcPassRes = await fetch(`${BASE_URL}/documents/${tempDocId}/qc`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'cra' },
    body: JSON.stringify({
      qcStatus: 'Passed',
      comments: 'CRA attempting unauthorized QC approval',
      user: authenticatedUsers.cra
    })
  });
  assert(craQcPassRes.status === 403, 'CRA blocked from QC Pass (403 Forbidden)');

  // Document Controller requesting Rework/Query -> must succeed (200 OK)
  const docControllerRejectRes = await fetch(`${BASE_URL}/documents/${tempDocId}/qc`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'doc_controller' },
    body: JSON.stringify({
      qcStatus: 'Failed',
      comments: 'Missing PI signature on page 3. Please re-sign.',
      user: authenticatedUsers.doc_controller
    })
  });
  assert(docControllerRejectRes.ok, 'Document Controller permitted to reject with remediation query (200 OK)');

  // TMF Lead approving QC -> must succeed (200 OK)
  const tmfLeadPassRes = await fetch(`${BASE_URL}/documents/${tempDocId}/qc`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'tmf_manager' },
    body: JSON.stringify({
      qcStatus: 'Passed',
      comments: 'Verified against 14-point checklist. Approved for filing.',
      user: authenticatedUsers.tmf_manager
    })
  });
  assert(tmfLeadPassRes.ok, 'TMF Lead authorized to pass QC and advance document to Effective/Filed (200 OK)');

  // 4. Audit Trail Immutability
  console.log('\n--- 4. Testing 21 CFR Part 11 Audit Trail Immutability ---');
  const auditDeleteRes = await fetch(`${BASE_URL}/audit-logs/aud_test`, {
    method: 'DELETE'
  });
  assert(auditDeleteRes.status === 405, 'Audit record deletion strictly forbidden (405 Method Not Allowed)');

  const auditPutRes = await fetch(`${BASE_URL}/audit-logs/aud_test`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'TAMPERED_ACTION' })
  });
  assert(auditPutRes.status === 405, 'Audit record modification strictly forbidden (405 Method Not Allowed)');

  // 5. Clean Up Temporary Test Entities
  console.log('\n--- 5. Clean Slate Tear-down ---');
  await fetch(`${BASE_URL}/studies/${tempStudyId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: adminUser })
  });
  await fetch(`${BASE_URL}/documents/${tempDocId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: adminUser })
  });

  const finalCheckStudies = await fetch(`${BASE_URL}/studies`).then(r => r.json());
  const finalCheckDocs = await fetch(`${BASE_URL}/documents`).then(r => r.json());
  assert(finalCheckStudies.count === 0, 'Clean slate verified: 0 studies');
  assert(finalCheckDocs.count === 0, 'Clean slate verified: 0 documents');

  console.log('\n' + '='.repeat(70));
  console.log(`TOTAL RBAC CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('='.repeat(70));

  if (failed > 0) process.exit(1);
}

runRBACTests();
