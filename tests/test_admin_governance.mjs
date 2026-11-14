/**
 * VigiThink eTMF — Admin Governance Test Suite
 * Validates:
 * 1. Admin Authentication (POST /api/users/login)
 * 2. Study Creation (POST /api/studies)
 * 3. Investigational Site Creation with PI details (POST /api/studies/:id/site)
 * 4. Investigator Account Creation (POST /api/users with role: site_user / Principal Investigator)
 * 5. Student / CRA Account Creation (POST /api/users with role: cra)
 * 6. Site Assignment to Users (PUT /api/users/:id)
 * 7. Investigator Login & Scoped Access Verification
 * 8. Audit Trail Verification (21 CFR Part 11 Compliance)
 * 9. Clean-slate Restoration (Tear-down test data)
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('='.repeat(70));
  console.log('VigiThink eTMF: Comprehensive Admin Governance Verification');
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

  try {
    // 1. Admin Authentication
    console.log('\n--- Step 1: Admin Authentication ---');
    const loginRes = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: 'admin@vigithink.com',
        password: 'admin123'
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.ok && loginData.success, 'Admin logged in successfully');
    assert(loginData.data?.roleId === 'system_admin', 'Admin holds system_admin role');
    const adminUser = loginData.data;

    // 2. Study Creation
    console.log('\n--- Step 2: Study Creation by Admin ---');
    const testStudyId = `VTK-ONCO-${Date.now().toString().slice(-4)}`;
    const createStudyRes = await fetch(`${BASE_URL}/studies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testStudyId,
        shortName: 'OncoShield-Phase3',
        title: 'Phase III Trial of OncoShield in Advanced NSCLC',
        protocolNumber: 'VTK-2026-NSCLC-01',
        phase: 'Phase III',
        therapeuticArea: 'Oncology',
        indication: 'Non-Small Cell Lung Cancer',
        sponsor: 'VigiThink BioPharma Inc.',
        cro: 'VigiThink Clinical Services Ltd.',
        status: 'Active',
        startDate: '2026-03-01',
        targetEndDate: '2028-12-31',
        targetEnrollment: 120,
        countries: [
          { id: 'IND', code: 'IND', name: 'India', status: 'Active', sites: [] }
        ],
        user: adminUser
      })
    });
    const createStudyData = await createStudyRes.json();
    assert(createStudyRes.status === 201 && createStudyData.success, `Admin created study ${testStudyId}`);
    assert(createStudyData.data?.id === testStudyId, 'Returned study ID matches');

    // 3. Site Creation with PI details
    console.log('\n--- Step 3: Site Creation with Investigator Details ---');
    const siteNumber = '101';
    const siteId = `SITE-${siteNumber}`;
    const addSiteRes = await fetch(`${BASE_URL}/studies/${testStudyId}/site`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        countryId: 'IND',
        site: {
          id: siteId,
          number: siteNumber,
          name: 'Site 101 - AIIMS Oncology Center, New Delhi',
          country: 'India',
          state: 'Delhi',
          city: 'New Delhi',
          address: 'Ansari Nagar, New Delhi 110029',
          piName: 'Dr. Arvind Sharma, MD (AIIMS)',
          piEmail: 'arvind.sharma@vigithink.com',
          piContact: '+91 98111 22334',
          piLicense: 'MCI-19842-DL',
          status: 'Active',
          activationDate: '2026-03-01',
          targetEnrollment: 40,
          assignedCraName: 'Shweta Pagare'
        },
        user: adminUser
      })
    });
    const addSiteData = await addSiteRes.json();
    assert(addSiteRes.status === 201 && addSiteData.success, `Site ${siteId} created under India`);

    // Fetch study to verify site in both countries[0].sites and study.sites
    const getStudyRes = await fetch(`${BASE_URL}/studies/${testStudyId}`);
    const getStudyData = await getStudyRes.json();
    const indCountry = getStudyData.data?.countries?.find(c => c.id === 'IND');
    const siteInCountry = indCountry?.sites?.find(s => s.id === siteId);
    assert(!!siteInCountry, 'Site is verified in study country hierarchy');
    assert(siteInCountry?.piName === 'Dr. Arvind Sharma, MD (AIIMS)', 'PI details saved accurately in site');

    // 4. Investigator User Creation
    console.log('\n--- Step 4: Investigator User Account Creation ---');
    const investigatorLoginId = `arvind.sharma.${Date.now().toString().slice(-4)}`;
    const createInvestigatorRes = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Arvind Sharma',
        loginId: investigatorLoginId,
        email: `${investigatorLoginId}@vigithink.com`,
        password: 'Investigator@2026',
        mobile: '+91 98111 22334',
        course: 'ICH-GCP Investigator Certification',
        position: 'Principal Investigator',
        roleId: 'site_user',
        trainingRole: 'Principal Investigator – Site 101',
        studyScope: testStudyId,
        countryScope: 'India',
        siteScope: 'Site 101 - AIIMS Oncology Center, New Delhi',
        assignedSite: 'Site 101 - AIIMS Oncology Center, New Delhi',
        adminUser: adminUser
      })
    });
    const createInvestigatorData = await createInvestigatorRes.json();
    assert(createInvestigatorRes.status === 201 && createInvestigatorData.success, `Investigator ${investigatorLoginId} created`);
    assert(createInvestigatorData.data?.roleId === 'site_user', 'Investigator role correctly set to site_user');
    assert(createInvestigatorData.data?.position === 'Principal Investigator', 'Position is Principal Investigator');
    const investigatorUser = createInvestigatorData.data;

    // 5. Student / CRA User Creation
    console.log('\n--- Step 5: Student / CRA Credential Creation ---');
    const studentLoginId = `vikram.malhotra.${Date.now().toString().slice(-4)}`;
    const createStudentRes = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vikram Malhotra',
        loginId: studentLoginId,
        email: `${studentLoginId}@vigithink.com`,
        password: 'Student@2026',
        mobile: '+91 98222 33445',
        course: 'Clinical Research & Pharmacovigilance',
        position: 'Student',
        roleId: 'cra',
        trainingRole: 'CRA – Rotation 1',
        studyScope: testStudyId,
        countryScope: 'India',
        siteScope: 'ALL',
        adminUser: adminUser
      })
    });
    const createStudentData = await createStudentRes.json();
    assert(createStudentRes.status === 201 && createStudentData.success, `Student ${studentLoginId} created`);
    const studentUser = createStudentData.data;

    // 6. Site Assignment to Student / User
    console.log('\n--- Step 6: Site Assignment to User ---');
    const assignedSiteName = 'Site 101 - AIIMS Oncology Center, New Delhi';
    const assignSiteRes = await fetch(`${BASE_URL}/users/${studentUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteScope: assignedSiteName,
        assignedSite: assignedSiteName,
        adminUser: adminUser
      })
    });
    const assignSiteData = await assignSiteRes.json();
    assert(assignSiteRes.ok && assignSiteData.success, 'Site assigned successfully to user');
    assert(assignSiteData.data?.siteScope === assignedSiteName, 'User siteScope updated to assigned site');

    // 7. Investigator Authentication & Access Check
    console.log('\n--- Step 7: Investigator Login & Scoped Access Verification ---');
    const invLoginRes = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: investigatorLoginId,
        password: 'Investigator@2026'
      })
    });
    const invLoginData = await invLoginRes.json();
    assert(invLoginRes.ok && invLoginData.success, 'Investigator logged in successfully with assigned password');
    assert(invLoginData.data?.studyScope === testStudyId, 'Investigator restricted to study scope');
    assert(invLoginData.data?.siteScope === assignedSiteName, 'Investigator restricted to assigned site');

    // 8. Audit Trail Verification
    console.log('\n--- Step 8: Audit Trail Verification ---');
    const auditRes = await fetch(`${BASE_URL}/audit-logs`);
    const auditData = await auditRes.json();
    const logs = auditData.data || [];
    const studyLog = logs.find(l => l.action === 'STUDY_CREATED' && l.study_id === testStudyId);
    const siteLog = logs.find(l => l.action === 'SITE_ADDED' && l.study_id === testStudyId);
    const userLog = logs.find(l => l.action === 'USER_CREDENTIAL_CREATED' && (l.target_id === investigatorLoginId || l.target_title?.includes('Arvind')));
    assert(!!studyLog, 'STUDY_CREATED entry recorded in 21 CFR Part 11 audit trail');
    assert(!!siteLog, 'SITE_ADDED entry recorded in audit trail with PI info');
    assert(!!userLog, 'USER_CREDENTIAL_CREATED entry recorded for investigator');

    // 9. Clean-slate Restoration (Tear-down)
    console.log('\n--- Step 9: Production Clean-slate Restoration ---');
    const deleteStudyRes = await fetch(`${BASE_URL}/studies/${testStudyId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: adminUser })
    });
    assert(deleteStudyRes.ok, `Test study ${testStudyId} deleted`);

    const deleteInvRes = await fetch(`${BASE_URL}/users/${investigatorUser.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUser: adminUser })
    });
    assert(deleteInvRes.ok, `Test investigator ${investigatorLoginId} deleted`);

    const deleteStudentRes = await fetch(`${BASE_URL}/users/${studentUser.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUser: adminUser })
    });
    assert(deleteStudentRes.ok, `Test student ${studentLoginId} deleted`);

    // Verify studies count is back to clean state
    const finalStudiesRes = await fetch(`${BASE_URL}/studies`);
    const finalStudies = await finalStudiesRes.json();
    assert(finalStudies.count === 0, `Database verified clean-slate: ${finalStudies.count} studies remaining`);

    console.log('\n' + '='.repeat(70));
    console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('='.repeat(70));

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTest();
