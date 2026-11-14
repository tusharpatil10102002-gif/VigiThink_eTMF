// Global fetch is built-in in Node 18+

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5000/api';

async function verifyAllLinks() {
  console.log('========================================================================');
  console.log('VigiThink eTMF — Comprehensive Route & Link Integrity Verification');
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
    // 1. Backend health
    const health = await (await fetch(`${BACKEND_URL}/health`)).json();
    assert(health.status === 'OK', '1. Backend API Health Check (/api/health)');

    // 2. Frontend main entry
    const indexRes = await fetch(`${FRONTEND_URL}/`);
    assert(indexRes.status === 200, '2. Frontend SPA Root (http://localhost:3000/)');

    // 3. Frontend routes reachability
    const routesToTest = [
      '/explorer',
      '/reports',
      '/studies',
      '/edl',
      '/qc-queue',
      '/tasks',
      '/audit-trail',
      '/inspector-portal',
      '/version-control',
      '/blinding-access',
      '/roles-access',
      '/system-validation',
      '/inventory',
      '/queries',
      '/quality',
      '/timeliness',
      '/monitoring-visits',
      '/documents',
      '/documents/DOC-2026-0001'
    ];

    for (const r of routesToTest) {
      const res = await fetch(`${FRONTEND_URL}${r}`);
      assert(res.status === 200, `3. Frontend Route Reachability: ${r}`);
    }

    // 4. Test /uploads fallback on missing physical file (Must return 200, never 404)
    const uploadRes = await fetch(`http://localhost:5000/uploads/non-existent-sample.pdf`);
    assert(uploadRes.status === 200, '4. Uploads Route Graceful Fallback (/uploads/:filename returns 200, no 404 broken link)');

    // 5. Test Certified Document Download with active document
    const testDocId = `DOC-LINKTEST-${Date.now().toString().slice(-4)}`;
    const createDocRes = await fetch(`${BACKEND_URL}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'system_admin' },
      body: JSON.stringify({
        document_id: testDocId,
        document_title: 'Link Verification Test Document',
        study_id: 'VTK-742',
        site_id: 'SITE-001',
        tmf_zone_id: '01',
        tmf_section_id: '01.01',
        tmf_artifact_id: '01.01.01',
        tmf_artifact_name: 'Trial Master Oversight Plan',
        version_number: '1.0'
      })
    });
    const createDocJson = await createDocRes.json();
    assert(createDocJson.success, '5a. Create Test Document for Download Verification');

    const dlRes = await fetch(`${BACKEND_URL}/documents/${testDocId}/download`);
    assert(dlRes.status === 200, '5b. Document Certified Download Endpoint (/api/documents/:id/download)');

    // Clean up test document
    await fetch(`${BACKEND_URL}/documents/${testDocId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'system_admin' }
    });

    // 6. Test Notifications endpoint and default action_url
    const notifsRes = await (await fetch(`${BACKEND_URL}/notifications`)).json();
    assert(notifsRes.success === true, '6. Notifications API Endpoint (/api/notifications)');

    // 7. Test Studies API
    const studiesRes = await (await fetch(`${BACKEND_URL}/studies`)).json();
    assert(studiesRes.success === true, `7. Studies API Endpoint (Found ${studiesRes.count} active study)`);

    // 8. Test Documents API
    const docsRes = await (await fetch(`${BACKEND_URL}/documents`)).json();
    assert(docsRes.success === true, `8. Documents API Endpoint (Found ${docsRes.count} document)`);

  } catch (err) {
    console.error('Fatal test error:', err.message);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`Link Integrity Verification Summary: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================================\n');

  if (failed > 0) process.exit(1);
}

verifyAllLinks();
