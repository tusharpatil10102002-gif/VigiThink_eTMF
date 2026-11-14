import assert from 'assert';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';

async function runPrerequisiteTests() {
  console.log('========================================================================');
  console.log('VigiThink eTMF — Clinical Study Protocol Prerequisite Enforcement Test');
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

  // 1. Verify Clean Slate initial state
  await test('Initial State: 0 clinical studies exist in repository', async () => {
    const res = await fetch(`${BASE_URL}/studies`);
    const json = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.length, 0, `Expected 0 studies, got ${json.data.length}`);
  })();

  // 2. Reject Single Document Upload when 0 studies exist
  await test('POST /api/documents/upload: Rejected with 422 when no study exists', async () => {
    // Create a temporary dummy file to upload
    const dummyFilePath = path.join(process.cwd(), 'temp_test_doc.pdf');
    fs.writeFileSync(dummyFilePath, '%PDF-1.4 Clinical Protocol Prerequisite Test File');

    try {
      const formData = new FormData();
      const fileBlob = new Blob([fs.readFileSync(dummyFilePath)], { type: 'application/pdf' });
      formData.append('file', fileBlob, 'temp_test_doc.pdf');
      formData.append('document_title', 'Protocol Document Test');
      formData.append('study_id', 'CLIN-001');

      const res = await fetch(`${BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData
      });
      const json = await res.json();

      assert.strictEqual(res.status, 422, `Expected 422, got ${res.status}`);
      assert.strictEqual(json.success, false);
      assert.ok(json.error.includes('Clinical Protocol Required'), `Expected error message to contain 'Clinical Protocol Required', got: ${json.error}`);
    } finally {
      if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
    }
  })();

  // 3. Reject JSON Document Creation when 0 studies exist
  await test('POST /api/documents: Rejected with 422 when no study exists', async () => {
    const res = await fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_title: 'Draft Protocol',
        study_id: 'CLIN-001',
        is_placeholder: false
      })
    });
    const json = await res.json();
    assert.strictEqual(res.status, 422, `Expected 422, got ${res.status}`);
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('Clinical Protocol Required'));
  })();

  // 4. Reject Bulk Upload when 0 studies exist
  await test('POST /api/documents/bulk-upload: Rejected with 422 when no study exists', async () => {
    const dummyFilePath = path.join(process.cwd(), 'temp_bulk_test.pdf');
    fs.writeFileSync(dummyFilePath, '%PDF-1.4 Bulk Test File');

    try {
      const formData = new FormData();
      const fileBlob = new Blob([fs.readFileSync(dummyFilePath)], { type: 'application/pdf' });
      formData.append('files', fileBlob, 'temp_bulk_test.pdf');
      formData.append('study_id', 'CLIN-001');

      const res = await fetch(`${BASE_URL}/documents/bulk-upload`, {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      assert.strictEqual(res.status, 422, `Expected 422, got ${res.status}`);
      assert.strictEqual(json.success, false);
      assert.ok(json.error.includes('Clinical Protocol Required'));
    } finally {
      if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
    }
  })();

  // 5. Reject Custom Folder Creation when 0 studies exist
  await test('POST /api/folders: Rejected with 422 when no study exists', async () => {
    const res = await fetch(`${BASE_URL}/folders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'system_admin'
      },
      body: JSON.stringify({
        name: 'Custom Regulatory Sub-Folder',
        study_id: 'CLIN-001'
      })
    });
    const json = await res.json();
    assert.strictEqual(res.status, 422, `Expected 422, got ${res.status}`);
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('Clinical Protocol Required'));
  })();

  // 6. Reject Quality Query Creation when 0 studies exist
  await test('POST /api/queries: Rejected with 422 when no study exists', async () => {
    const res = await fetch(`${BASE_URL}/queries`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'tmf_manager'
      },
      body: JSON.stringify({
        document_id: 'DOC-2026-0001',
        study_id: 'CLIN-001',
        comment: 'Missing PI Signature'
      })
    });
    const json = await res.json();
    assert.strictEqual(res.status, 422, `Expected 422, got ${res.status}`);
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('Clinical Protocol Required'));
  })();

  // 7. Reject Milestone Creation when 0 studies exist
  await test('POST /api/milestones: Rejected with 422 when no study exists', async () => {
    const res = await fetch(`${BASE_URL}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        study_id: 'CLIN-001',
        milestone: 'Site Initiation Visit (SIV)'
      })
    });
    const json = await res.json();
    assert.strictEqual(res.status, 422, `Expected 422, got ${res.status}`);
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('Clinical Protocol Required'));
  })();

  // 8. Admin initiates Clinical Study Protocol
  let testStudyCreated = null;
  await test('Admin Workflow: Initiate Study Protocol VTK-PREREQ-TEST', async () => {
    const studyPayload = {
      id: 'VTK-PREREQ-TEST',
      protocolNumber: 'VTK-2026-PH3-PREREQ',
      shortName: 'Prereq Test Trial',
      title: 'A Phase III Randomized Trial for Prerequisite Validation',
      phase: 'Phase III',
      therapeuticArea: 'Oncology',
      indication: 'Advanced Solid Tumors',
      sponsor: 'VigiThink Therapeutics Inc.',
      cro: 'Global Clinical Operations',
      status: 'Active',
      sites: [
        {
          id: 'SITE-101',
          number: '101',
          name: 'Central Oncology Research Institute',
          country: 'India',
          piName: 'Dr. Suresh Kumar, MD',
          status: 'Active'
        }
      ],
      user: {
        id: 'usr_tushar_admin',
        name: 'Tushar Patil',
        roleId: 'system_admin'
      }
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
    assert.strictEqual(json.data.id, 'VTK-PREREQ-TEST');
    testStudyCreated = json.data;
  })();

  // 9. Document Upload now SUCCEEDS after Study Protocol is initiated
  let createdDocId = null;
  await test('Upload Workflow: Document upload succeeds now that study protocol exists', async () => {
    const dummyFilePath = path.join(process.cwd(), 'temp_approved_protocol.pdf');
    fs.writeFileSync(dummyFilePath, '%PDF-1.4 Clinical Protocol Approved v1.0');

    try {
      const formData = new FormData();
      const fileBlob = new Blob([fs.readFileSync(dummyFilePath)], { type: 'application/pdf' });
      formData.append('file', fileBlob, 'temp_approved_protocol.pdf');
      formData.append('document_title', 'Protocol Document Version 1.0');
      formData.append('study_id', 'VTK-PREREQ-TEST');
      formData.append('site_id', 'SITE-101');
      formData.append('tmf_zone_id', '02');
      formData.append('tmf_zone_name', 'Central Trial Documents');
      formData.append('tmf_section_id', '02.01');
      formData.append('tmf_section_name', 'Protocol and Amendments');
      formData.append('tmf_artifact_id', '02.01.01');
      formData.append('tmf_artifact_name', 'Protocol');
      formData.append('user', JSON.stringify({
        id: 'usr_tushar_admin',
        name: 'Tushar Patil',
        roleId: 'system_admin'
      }));

      const res = await fetch(`${BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}: ${JSON.stringify(json)}`);
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.study_id, 'VTK-PREREQ-TEST');
      createdDocId = json.data.document_id;
    } finally {
      if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
    }
  })();

  // 10. Clean up: Delete created test document and test study to preserve clean-slate state
  await test('Clean-up: Remove test document & test study returning to clean slate', async () => {
    if (createdDocId) {
      const delDocRes = await fetch(`${BASE_URL}/documents/${createdDocId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': 'system_admin'
        },
        body: JSON.stringify({
          reason: 'Clean-up after prerequisite test suite execution',
          user: { id: 'usr_tushar_admin', name: 'Tushar Patil', roleId: 'system_admin' }
        })
      });
      assert.strictEqual(delDocRes.status, 200);
    }

    if (testStudyCreated) {
      const delStudyRes = await fetch(`${BASE_URL}/studies/${testStudyCreated.id}`, {
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
    }

    // Verify back to 0 studies
    const res = await fetch(`${BASE_URL}/studies`);
    const json = await res.json();
    assert.strictEqual(json.data.length, 0);
  })();

  console.log('\n========================================================================');
  console.log(`Test Execution Summary: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPrerequisiteTests();
