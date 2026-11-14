import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api';

async function runDelegationTest() {
  console.log('========================================================================');
  console.log('VigiThink eTMF — Admin End-to-End Governance & Delegation Flow Test');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return async () => {
      try {
        await fn();
        console.log(`[PASS] ${name}`);
        passed++;
      } catch (err) {
        console.error(`[FAIL] ${name}`);
        console.error(`       Error: ${err.message}`);
        failed++;
      }
    };
  }

  const studyId = `VTK-FLOW-${Date.now().toString().substring(8)}`;
  const siteId = `SITE-${Date.now().toString().substring(8)}`;
  const piLoginId = `pi.dr.gupta.${Date.now().toString().substring(8)}`;
  const crcLoginId = `crc.priya.${Date.now().toString().substring(8)}`;
  const craLoginId = `cra.anil.${Date.now().toString().substring(8)}`;

  // 1. Admin Authentication
  await test('Step 1: Admin Authentication', async () => {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'admin@vigithink.com', password: 'admin123' })
    });
    const json = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.roleId, 'system_admin');
  })();

  // 2. Admin creates Clinical Study Protocol
  await test('Step 2: Admin creates Clinical Study Protocol', async () => {
    const studyPayload = {
      id: studyId,
      shortName: 'OncoImmune Phase 3',
      title: 'A Phase III Double-Blind Trial in Solid Tumors',
      protocolNumber: `PROTO-${studyId}`,
      phase: 'Phase III',
      therapeuticArea: 'Oncology',
      indication: 'Metastatic NSCLC',
      sponsor: 'VigiThink Therapeutics Inc.',
      cro: 'Global Clinical Operations',
      status: 'Active',
      countries: [
        {
          id: 'IN',
          code: 'IND',
          name: 'India',
          regulatoryAuthority: 'CDSCO',
          retentionPeriodYears: 25,
          sites: []
        }
      ],
      user: { id: 'usr_tushar_admin', name: 'Tushar Patil', roleId: 'system_admin' }
    };

    const res = await fetch(`${BASE_URL}/studies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'system_admin'
      },
      body: JSON.stringify(studyPayload)
    });
    const json = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.id, studyId);
  })();

  // 3. Admin creates PI User Credential
  let piUser = null;
  await test('Step 3: Admin creates Principal Investigator (PI) user credential', async () => {
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'system_admin'
      },
      body: JSON.stringify({
        name: 'Dr. Ramesh Gupta, MD',
        loginId: piLoginId,
        password: 'Password@123',
        email: 'ramesh.gupta@hospital.org',
        position: 'Principal Investigator',
        roleId: 'investigator',
        trainingRole: 'Principal Investigator (PI)',
        studyScope: studyId,
        siteScope: 'ALL'
      })
    });
    const json = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.roleId, 'investigator');
    piUser = json.data;
  })();

  // 4. Admin creates CRC (Site User) Credential
  let crcUser = null;
  await test('Step 4: Admin creates Clinical Research Coordinator (CRC) user credential', async () => {
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'system_admin'
      },
      body: JSON.stringify({
        name: 'Priya Sharma',
        loginId: crcLoginId,
        password: 'Password@123',
        email: 'priya.crc@hospital.org',
        position: 'Clinical Research Coordinator (CRC)',
        roleId: 'site_user',
        trainingRole: 'Site User / CRC',
        studyScope: studyId,
        siteScope: 'ALL'
      })
    });
    const json = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.roleId, 'site_user');
    crcUser = json.data;
  })();

  // 5. Admin creates CRA Credential
  let craUser = null;
  await test('Step 5: Admin creates Clinical Research Associate (CRA) user credential', async () => {
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'system_admin'
      },
      body: JSON.stringify({
        name: 'Anil Deshmukh',
        loginId: craLoginId,
        password: 'Password@123',
        email: 'anil.deshmukh@cro.com',
        position: 'Clinical Research Associate (CRA)',
        roleId: 'cra',
        trainingRole: 'CRA – Lead Monitor',
        studyScope: studyId,
        siteScope: 'ALL'
      })
    });
    const json = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.roleId, 'cra');
    craUser = json.data;
  })();

  // 6. Admin creates Site and assigns PI, CRC, and CRA
  await test('Step 6: Admin creates Site & assigns PI, CRC, and CRA', async () => {
    const sitePayload = {
      countryId: 'IN',
      site: {
        id: siteId,
        number: '101',
        name: 'Tata Memorial Cancer Centre',
        country: 'India',
        piName: piUser.name,
        piEmail: piUser.email,
        piLicense: 'MCI-DELHI-49812',
        assignedPiId: piUser.id || piUser.loginId,
        crcName: crcUser.name,
        crcEmail: crcUser.email,
        assignedCrcId: crcUser.id || crcUser.loginId,
        assignedCraId: craUser.id || craUser.loginId,
        assignedCraName: craUser.name,
        targetEnrollment: 60,
        status: 'Active'
      },
      user: { id: 'usr_tushar_admin', name: 'Tushar Patil', roleId: 'system_admin' }
    };

    const res = await fetch(`${BASE_URL}/studies/${studyId}/sites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'system_admin'
      },
      body: JSON.stringify(sitePayload)
    });
    const json = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.success, true);
    
    // Check site in returned study
    const foundSite = json.data.sites.find(s => s.id === siteId || s.number === '101');
    assert.ok(foundSite, 'Site not found in study.sites');
    assert.strictEqual(foundSite.piName, piUser.name);
    assert.strictEqual(foundSite.crcName, crcUser.name);
    assert.strictEqual(foundSite.assignedCraName, craUser.name);
  })();

  // 7. Verify automatic scope synchronization for assigned users
  await test('Step 7: Verify automatic scope synchronization in User database', async () => {
    // Check PI user scope
    const piRes = await fetch(`${BASE_URL}/users`);
    const piJson = await piRes.json();
    
    const dbPi = piJson.data.find(u => u.loginId === piLoginId);
    assert.ok(dbPi, 'PI user not found');
    assert.strictEqual(dbPi.studyScope, studyId);
    assert.ok(dbPi.siteScope.includes('Tata Memorial Cancer Centre'));

    // Check CRC user scope
    const dbCrc = piJson.data.find(u => u.loginId === crcLoginId);
    assert.ok(dbCrc, 'CRC user not found');
    assert.strictEqual(dbCrc.studyScope, studyId);
    assert.ok(dbCrc.siteScope.includes('Tata Memorial Cancer Centre'));

    // Check CRA user scope
    const dbCra = piJson.data.find(u => u.loginId === craLoginId);
    assert.ok(dbCra, 'CRA user not found');
    assert.strictEqual(dbCra.studyScope, studyId);
    assert.ok(dbCra.siteScope.includes('Tata Memorial Cancer Centre'));
  })();

  // 8. Admin re-assigns or updates site personnel
  await test('Step 8: Admin re-assigns site personnel via PUT /sites/:siteId/personnel', async () => {
    const updatePayload = {
      siteId,
      piName: 'Dr. Ramesh Gupta, MD, PhD',
      crcName: 'Priya Sharma (Senior CRC)',
      assignedCraName: 'Anil Deshmukh (Senior CRA)',
      reason: 'Mid-study delegation title update by Admin',
      user: { id: 'usr_tushar_admin', name: 'Tushar Patil', roleId: 'system_admin' }
    };

    const res = await fetch(`${BASE_URL}/studies/${studyId}/sites/${siteId}/personnel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'system_admin'
      },
      body: JSON.stringify(updatePayload)
    });
    const json = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.site.piName, 'Dr. Ramesh Gupta, MD, PhD');
    assert.strictEqual(json.site.crcName, 'Priya Sharma (Senior CRC)');
  })();

  // 9. Verify 21 CFR Part 11 Audit Trail logs
  await test('Step 9: Verify 21 CFR Part 11 Audit Trail records for all delegations', async () => {
    const res = await fetch(`${BASE_URL}/audit-logs?study_id=${studyId}`);
    const json = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    
    const actions = json.data.map(l => l.action);
    assert.ok(actions.includes('STUDY_CREATED'), 'Audit log missing STUDY_CREATED');
    assert.ok(actions.includes('SITE_ADDED'), 'Audit log missing SITE_ADDED');
    assert.ok(actions.includes('SITE_PERSONNEL_ASSIGNED'), 'Audit log missing SITE_PERSONNEL_ASSIGNED');
  })();

  // 10. Clean up: Delete created study and created users, return to clean-slate state
  await test('Step 10: Clean up and restore production clean slate', async () => {
    // Delete study
    const delStudyRes = await fetch(`${BASE_URL}/studies/${studyId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'system_admin'
      },
      body: JSON.stringify({
        user: { id: 'usr_tushar_admin', name: 'Tushar Patil', roleId: 'system_admin' }
      })
    });
    assert.strictEqual(delStudyRes.status, 200);

    // Delete created users
    for (const uid of [piUser.id, crcUser.id, craUser.id].filter(Boolean)) {
      await fetch(`${BASE_URL}/users/${uid}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'system_admin'
        },
        body: JSON.stringify({
          user: { id: 'usr_tushar_admin', name: 'Tushar Patil', roleId: 'system_admin' }
        })
      });
    }

    // Verify 0 studies remaining
    const stRes = await fetch(`${BASE_URL}/studies`);
    const stJson = await stRes.json();
    assert.strictEqual(stJson.data.length, 0);
  })();

  console.log('\n========================================================================');
  console.log(`Delegation Test Execution Summary: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDelegationTest();
