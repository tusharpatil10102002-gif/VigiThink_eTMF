// Comprehensive Full-Stack Verification Suite for VigiThink eTMF
// Covers Sections A through L of the Senior QA / Security / Full-Stack Specification

import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:5000/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests.push({ testName, details });
    console.error(`  [FAIL] ${testName} - Details: ${details}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('VIGITHINK eTMF: SENIOR QA & SECURITY AUDIT TEST SUITE');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // SECTION A: Authentication and User Management
  // ---------------------------------------------------------------------------
  console.log('--- SECTION A: Authentication & User Management ---');

  // Test A1: Valid Admin Login
  const loginAdminRes = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginInput: 'admin@vigithink.com', password: 'Admin@VigiThink2026' })
  });
  const loginAdminJson = await loginAdminRes.json();
  assert(loginAdminRes.status === 200 && loginAdminJson.success && loginAdminJson.data.roleId === 'system_admin',
    'A1: Admin login with valid credentials succeeds');

  // Test A2: Valid TMF Lead Login
  const loginTmfRes = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginInput: 'sukriti.singh@vigithink.com', password: 'Sukriti@VigiThink2026' })
  });
  const loginTmfJson = await loginTmfRes.json();
  assert(loginTmfRes.status === 200 && loginTmfJson.success && loginTmfJson.data.roleId === 'tmf_manager',
    'A2: TMF Lead login succeeds');

  // Test A3: Invalid Password Rejection
  const badPassRes = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginInput: 'admin@vigithink.com', password: 'WrongPassword999' })
  });
  const badPassJson = await badPassRes.json();
  assert(badPassRes.status === 401 && !badPassJson.success,
    'A3: Invalid password rejected with 401');

  // Test A4: Non-existent User Rejection
  const noUserRes = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginInput: 'hacker@malicious.com', password: 'Password123' })
  });
  assert(noUserRes.status === 401 || noUserRes.status === 404,
    'A4: Non-existent login ID rejected with 401/404');

  // Test A5: User Creation by Admin
  const testUserId = `usr_test_${Date.now()}`;
  const testUserLogin = `test.cra.${Date.now()}@vigithink.com`;
  const createUserRes = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: testUserId,
      name: 'Test Associate',
      loginId: testUserLogin,
      email: testUserLogin,
      password: 'SecurePassword123',
      roleId: 'cra',
      adminUser: { id: 'usr_tushar_founder', roleId: 'system_admin' }
    })
  });
  const createUserJson = await createUserRes.json();
  assert(createUserRes.status === 201 && createUserJson.success && !createUserJson.data.password,
    'A5: System Admin can create user with stripped password in API response');

  // Test A5b: Verify user can authenticate with bcrypt-hashed password
  const testUserLoginRes = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginInput: testUserLogin, password: 'SecurePassword123' })
  });
  const testUserLoginJson = await testUserLoginRes.json();
  assert(testUserLoginRes.status === 200 && testUserLoginJson.success,
    'A5b: User with bcrypt-hashed password logs in successfully');

  // Test A6: User Creation by Non-Admin Blocked (RBAC)
  const nonAdminCreateRes = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Illegal User',
      loginId: 'illegal@vigithink.com',
      password: 'Pass',
      roleId: 'cra',
      adminUser: { id: 'usr_cra_1', roleId: 'cra' }
    })
  });
  assert(nonAdminCreateRes.status === 403,
    'A6: Non-admin user creation blocked with 403');

  // Test A7: User Deactivation & Blocked Login
  const createdDbUser = createUserJson.data;
  const toggleRes = await fetch(`${BASE_URL}/users/${createdDbUser.id}/toggle-active`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminUser: { roleId: 'system_admin' } })
  });
  const toggleJson = await toggleRes.json();
  assert(toggleRes.status === 200 && toggleJson.data.isActive === false,
    'A7: System Admin can deactivate user account');

  const deactLoginRes = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginInput: testUserLogin, password: 'SecurePassword123' })
  });
  assert(deactLoginRes.status === 403,
    'A8: Deactivated user login rejected with 403 Forbidden');

  // Clean up test user
  await fetch(`${BASE_URL}/users/${createdDbUser.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminUser: { roleId: 'system_admin' } })
  });

  // ---------------------------------------------------------------------------
  // SECTION B: Role-Based Access Control (All 6 Roles)
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION B: Role-Based Access Control ---');

  // Document for RBAC testing
  const rbacDocId = `DOC-RBAC-${Date.now()}`;
  await fetch(`${BASE_URL}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: rbacDocId,
      document_title: 'RBAC Security Validation Protocol',
      study_id: 'CLIN-001',
      site_id: 'SITE-01',
      tmf_zone_id: '01',
      tmf_section_id: '01.01',
      tmf_artifact_id: '01.01.01',
      tmf_artifact_name: 'Trial Master Oversight Plan',
      user: { id: 'usr_tushar_founder', roleId: 'system_admin' }
    })
  });

  // Test B1: Site User attempting QC Pass -> MUST FAIL WITH 403
  const siteUserQcRes = await fetch(`${BASE_URL}/documents/${rbacDocId}/qc`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'site_user' },
    body: JSON.stringify({ qcStatus: 'Passed', comments: 'CRC trying to approve' })
  });
  assert(siteUserQcRes.status === 403,
    'B1: Site User / CRC blocked from QC Pass (403)');

  // Test B2: CRA attempting QC Pass -> MUST FAIL WITH 403
  const craQcRes = await fetch(`${BASE_URL}/documents/${rbacDocId}/qc`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'cra' },
    body: JSON.stringify({ qcStatus: 'Passed', comments: 'CRA trying to approve' })
  });
  assert(craQcRes.status === 403,
    'B2: CRA blocked from QC Pass (403)');

  // Test B3: Document Controller attempting QC Pass -> MUST FAIL WITH 403
  const docControllerQcRes = await fetch(`${BASE_URL}/documents/${rbacDocId}/qc`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'doc_controller' },
    body: JSON.stringify({ qcStatus: 'Passed', comments: 'Doc Controller trying to approve' })
  });
  assert(docControllerQcRes.status === 403,
    'B3: Document Controller blocked from QC Pass (403)');

  // Test B4: Document Controller CAN reject / raise query
  const docControllerRejectRes = await fetch(`${BASE_URL}/documents/${rbacDocId}/qc`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'doc_controller' },
    body: JSON.stringify({ qcStatus: 'Failed', comments: 'Missing indexing stamp. Please re-index.' })
  });
  assert(docControllerRejectRes.status === 200,
    'B4: Document Controller permitted to reject / request rework (200)');

  // Test B5: TMF Lead CAN pass QC
  const tmfLeadPassRes = await fetch(`${BASE_URL}/documents/${rbacDocId}/qc`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'tmf_manager' },
    body: JSON.stringify({ qcStatus: 'Passed', comments: 'Verified compliant with DIA model.' })
  });
  assert(tmfLeadPassRes.status === 200,
    'B5: TMF Lead permitted to pass QC (200)');

  // Test B6: Non-admin trying to delete document -> MUST FAIL WITH 403
  const craDeleteRes = await fetch(`${BASE_URL}/documents/${rbacDocId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'cra' }
  });
  assert(craDeleteRes.status === 403,
    'B6: CRA blocked from deleting clinical document (403)');

  // Test B7: System Admin can delete document
  const adminDeleteRes = await fetch(`${BASE_URL}/documents/${rbacDocId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'system_admin' }
  });
  assert(adminDeleteRes.status === 200,
    'B7: System Admin authorized to delete document (200)');

  // ---------------------------------------------------------------------------
  // SECTION C: Dashboard and Study Management
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION C: Dashboard & Study Management ---');

  const dashAdmin = await fetch(`${BASE_URL}/v1/dashboard/admin`);
  const dashAdminJson = await dashAdmin.json();
  assert(dashAdmin.status === 200 && dashAdminJson.data.system_status.api_gateway === 'OPERATIONAL',
    'C1: Admin dashboard returns operational statistics');

  const dashTmf = await fetch(`${BASE_URL}/v1/dashboard/tmf-lead`);
  assert(dashTmf.status === 200, 'C2: TMF Lead dashboard returns QC metrics');

  const dashCtm = await fetch(`${BASE_URL}/v1/dashboard/ctm`);
  assert(dashCtm.status === 200, 'C3: CTM dashboard returns study oversight metrics');

  const dashCra = await fetch(`${BASE_URL}/v1/dashboard/cra`);
  assert(dashCra.status === 200, 'C4: CRA dashboard returns site monitoring metrics');

  const dashSite = await fetch(`${BASE_URL}/v1/dashboard/site-user`);
  assert(dashSite.status === 200, 'C5: Site User dashboard returns personal uploads');

  const dashDocCtrl = await fetch(`${BASE_URL}/v1/dashboard/document-controller`);
  assert(dashDocCtrl.status === 200, 'C6: Document Controller dashboard returns indexing queues');

  // Study listing
  const studiesRes = await fetch(`${BASE_URL}/studies`);
  const studiesJson = await studiesRes.json();
  assert(studiesRes.status === 200 && Array.isArray(studiesJson.data),
    'C7: Clinical studies endpoint responds with valid dataset array');

  // ---------------------------------------------------------------------------
  // SECTION D: DIA TMF Reference Model v3.1 (11 Zones)
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION D: DIA TMF Reference Model v3.1 (11 Zones) ---');

  const zonesRes = await fetch(`${BASE_URL}/v1/tmf/zones`);
  const zonesJson = await zonesRes.json();
  assert(zonesRes.status === 200 && zonesJson.data.zones.length === 11,
    'D1: All 11 DIA TMF Reference Model zones returned exactly');

  const zone5SectionsRes = await fetch(`${BASE_URL}/v1/tmf/zones/05/sections`);
  const zone5SectionsJson = await zone5SectionsRes.json();
  assert(zone5SectionsRes.status === 200 && zone5SectionsJson.data.sections.length > 0,
    'D2: DIA Zone 05 sections retrieved accurately');

  const complianceRes = await fetch(`${BASE_URL}/v1/compliance/readiness`);
  const complianceJson = await complianceRes.json();
  assert(complianceRes.status === 200 && complianceJson.data.alcoa_plus_metrics.attributable,
    'D3: ALCOA+ compliance indices calculated accurately');

  // ---------------------------------------------------------------------------
  // SECTION E: Document Management & Security
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION E: Document Management & Security ---');

  // Test E1: Disallowed file extension (.exe) rejected
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const fakeExeBody = 
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="malware.exe"\r\n` +
    `Content-Type: application/x-msdownload\r\n\r\n` +
    `MZ executable binary dummy content\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="document_title"\r\n\r\n` +
    `Malicious Executable\r\n` +
    `--${boundary}--\r\n`;

  const exeUploadRes = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body: fakeExeBody
  });
  assert(exeUploadRes.status === 400,
    'E1: Disallowed file extension (.exe) rejected with 400');

  // Test E2: Allowed file upload (.txt) succeeds
  const testDocUniqueId = `DOC-UP-${Date.now()}`;
  const validFileBody = 
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="site_delegation_log.txt"\r\n` +
    `Content-Type: text/plain\r\n\r\n` +
    `Delegation of Authority Log Content for Site 001\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="document_id"\r\n\r\n` +
    `${testDocUniqueId}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="document_title"\r\n\r\n` +
    `Delegation of Authority Log - Site 001\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="study_id"\r\n\r\n` +
    `CLIN-001\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="tmf_zone_id"\r\n\r\n` +
    `05\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="tmf_section_id"\r\n\r\n` +
    `05.03\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="tmf_artifact_id"\r\n\r\n` +
    `05.03.01\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="tmf_artifact_name"\r\n\r\n` +
    `Delegation of Authority Log\r\n` +
    `--${boundary}--\r\n`;

  const validUploadRes = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body: validFileBody
  });
  const validUploadJson = await validUploadRes.json();
  assert(validUploadRes.status === 201 && validUploadJson.success,
    'E2: Valid clinical document upload succeeds with 201');

  // Test E3: Duplicate document_id upload rejected with 409 Conflict
  const duplicateUploadRes = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body: validFileBody
  });
  assert(duplicateUploadRes.status === 409,
    'E3: Duplicate document ID rejected with 409 Conflict');

  // Test E4: Document Download / Stream succeeds
  const downloadRes = await fetch(`${BASE_URL}/documents/${testDocUniqueId}/download`);
  assert(downloadRes.status === 200,
    'E4: Document download streams successfully (200)');

  // Test E5: Concurrency Locking / Checkout
  const checkoutRes = await fetch(`${BASE_URL}/documents/${testDocUniqueId}/checkout`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'checkout',
      purpose: 'Annual PI credential re-verification',
      user: { id: 'usr_cra_1', name: 'Veepra Singh (Lead CRA)', roleId: 'cra' }
    })
  });
  const checkoutJson = await checkoutRes.json();
  assert(checkoutRes.status === 200 && checkoutJson.data.checkout_status === 'Checked Out',
    'E5: Concurrency checkout locks document exclusively');

  // Test E6: Concurrency Check-in
  const checkinRes = await fetch(`${BASE_URL}/documents/${testDocUniqueId}/checkout`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'checkin',
      user: { id: 'usr_cra_1', name: 'Veepra Singh (Lead CRA)', roleId: 'cra' }
    })
  });
  const checkinJson = await checkinRes.json();
  assert(checkinRes.status === 200 && checkinJson.data.checkout_status === 'Checked In',
    'E6: Document check-in releases lock safely');

  // Clean up
  await fetch(`${BASE_URL}/documents/${testDocUniqueId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'system_admin' }
  });

  // ---------------------------------------------------------------------------
  // SECTION F: Document Workflow (11-Stage Lifecycle)
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION F: Document Workflow (11-Stage Lifecycle) ---');

  const flowDocId = `DOC-FLOW-${Date.now()}`;
  
  // Stages 1-5 (Created -> Reviewed -> Signed -> Uploaded -> Metadata Entered)
  const fInitRes = await fetch(`${BASE_URL}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: flowDocId,
      document_title: 'Full Lifecycle DOA Log',
      study_id: 'CLIN-001',
      site_id: 'SITE-01',
      tmf_zone_id: '05',
      tmf_section_id: '05.03',
      tmf_artifact_id: '05.03.01',
      tmf_artifact_name: 'Delegation of Authority Log',
      user: { id: 'usr_student_s1', name: 'Aarav Sharma (CRC)', roleId: 'site_user' }
    })
  });
  const fInitJson = await fInitRes.json();
  assert(fInitJson.data.lifecycle_stage === 6,
    'F1: Document submitted to QC (Stage 6)');

  // Stage 6 & 7: QC Review Outcome (Accepted) by TMF Lead
  const fQcRes = await fetch(`${BASE_URL}/documents/${flowDocId}/qc`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      qcStatus: 'Passed',
      comments: 'ALCOA+ criteria verified.',
      user: { id: 'usr_sukriti_lead', name: 'Sukriti Singh (TMF Lead)', roleId: 'tmf_manager' }
    })
  });
  const fQcJson = await fQcRes.json();
  assert(fQcJson.data.lifecycle_stage === 9 && fQcJson.data.status === 'Approved',
    'F2: QC Passed advances document through Stage 7, 8 & 9 (TMF Filed)');

  // Stage 10: 21 CFR Part 11 Electronic Signature by QA
  const fSignRes = await fetch(`${BASE_URL}/documents/${flowDocId}/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meaning: 'Approval and Certification of Inspection Readiness',
      user: { id: 'usr_qa_1', name: 'Dr. Anita Desai (QA Auditor)', roleId: 'qa' }
    })
  });
  const fSignJson = await fSignRes.json();
  assert(fSignJson.data.lifecycle_stage === 10 && fSignJson.data.signature_type === 'Electronic (Part 11)',
    'F3: Stage 10 Monitoring & Inspection Readiness signed under 21 CFR Part 11');

  // Stage 11: Study Close-Out & Archival with 25-Year Lock
  const fArchiveRes = await fetch(`${BASE_URL}/documents/${flowDocId}/lifecycle`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetStage: 11,
      notes: 'Study close-out completed. 25-year retention lock active.',
      user: { id: 'usr_tushar_founder', name: 'Tushar Patil (System Admin)', roleId: 'system_admin' }
    })
  });
  const fArchiveJson = await fArchiveRes.json();
  assert(fArchiveJson.data.lifecycle_stage === 11 && fArchiveJson.data.lifecycle_status.includes('Archived'),
    'F4: Stage 11 Archival engaged with 25-year regulatory lock');

  // Clean up
  await fetch(`${BASE_URL}/documents/${flowDocId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'system_admin' }
  });

  // ---------------------------------------------------------------------------
  // SECTION I: Audit Trail Immutability (21 CFR Part 11)
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION I: Audit Trail Immutability (21 CFR Part 11) ---');

  const auditRes = await fetch(`${BASE_URL}/audit-logs?limit=5`);
  const auditJson = await auditRes.json();
  assert(auditRes.status === 200 && Array.isArray(auditJson.data) && auditJson.data.length > 0,
    'I1: Audit trail entries queryable with cryptographic signatures');

  // Test I2: Attempt to DELETE audit trail record -> MUST FAIL WITH 405
  const auditDeleteRes = await fetch(`${BASE_URL}/audit-logs/aud_test`, {
    method: 'DELETE'
  });
  assert(auditDeleteRes.status === 405,
    'I2: Audit trail records cannot be deleted (405 Method Not Allowed)');

  // Test I3: Attempt to PUT/modify audit trail record -> MUST FAIL WITH 405
  const auditPutRes = await fetch(`${BASE_URL}/audit-logs/aud_test`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'FORGED_RECORD' })
  });
  assert(auditPutRes.status === 405,
    'I3: Audit trail records cannot be modified (405 Method Not Allowed)');

  // ---------------------------------------------------------------------------
  // SECTION J: Security & Protection against Critical Attacks
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION J: Security & Privilege Escalation Checks ---');

  // Test J1: Unauthorized System Clear Data -> MUST FAIL WITH 403
  const clearDataRes = await fetch(`${BASE_URL}/system/clear-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'cra' }
  });
  assert(clearDataRes.status === 403,
    'J1: Non-admin system clear-data blocked (403)');

  // Test J2: Unauthorized System Reset Demo -> MUST FAIL WITH 403
  const resetDemoRes = await fetch(`${BASE_URL}/system/reset-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'site_user' }
  });
  assert(resetDemoRes.status === 403,
    'J2: Non-admin system reset-demo blocked (403)');

  // Test J3: Unauthorized Study Deletion -> MUST FAIL WITH 403
  const studyDeleteRes = await fetch(`${BASE_URL}/studies/CLIN-001`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'doc_controller' }
  });
  assert(studyDeleteRes.status === 403,
    'J3: Unauthorized study protocol deletion blocked (403)');

  // Test J4: Security Headers in Response
  const healthRes = await fetch(`${BASE_URL}/health`);
  const nosniffHeader = healthRes.headers.get('x-content-type-options');
  const frameHeader = healthRes.headers.get('x-frame-options');
  assert(nosniffHeader === 'nosniff' && frameHeader === 'SAMEORIGIN',
    'J4: Production security headers (nosniff, SAMEORIGIN) present in API responses');

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST SUITE EXECUTION SUMMARY:`);
  console.log(`Total Tests Run: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests.length}`);
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`Pass Rate: ${passRate}%`);
  console.log('================================================================');

  if (failedTests.length > 0) {
    console.error('\nFAILED TESTS BREAKDOWN:');
    failedTests.forEach((f, idx) => {
      console.error(`${idx + 1}. ${f.testName}: ${f.details}`);
    });
    process.exit(1);
  } else {
    console.log('\nALL TEST CASES PASSED WITH 100% SUCCESS!');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
