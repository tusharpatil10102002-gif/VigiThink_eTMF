// Test script for VigiThink eTMF REST API v1 Specification endpoints
const BASE_URL = 'http://localhost:5000/api/v1';

async function testEndpoint(name, url, options = {}) {
  try {
    const res = await fetch(url, options);
    const json = await res.json();
    if (res.ok && json.success) {
      console.log(`[PASS] ${name} -> Status: ${res.status}, RequestId: ${json.meta?.request_id}`);
      return json.data;
    } else {
      console.error(`[FAIL] ${name} -> Status: ${res.status}`, json);
      process.exit(1);
    }
  } catch (err) {
    console.error(`[ERROR] ${name} ->`, err.message);
    process.exit(1);
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('Testing VigiThink eTMF Specification API v1 Endpoints');
  console.log('===============================================================');

  // 1. Admin Dashboard
  const adminData = await testEndpoint('1. GET /dashboard/admin', `${BASE_URL}/dashboard/admin`);
  console.log('   Metrics:', JSON.stringify(adminData.metrics));
  console.log('   System Status:', JSON.stringify(adminData.system_status));

  // 2. TMF Lead Dashboard
  const tmfData = await testEndpoint('2. GET /dashboard/tmf-lead', `${BASE_URL}/dashboard/tmf-lead`);
  console.log('   Metrics:', JSON.stringify(tmfData.metrics));
  console.log('   QC Queue count:', tmfData.qc_queue.length);

  // 3. CTM Dashboard
  const ctmData = await testEndpoint('3. GET /dashboard/ctm', `${BASE_URL}/dashboard/ctm`);
  console.log('   Metrics:', JSON.stringify(ctmData.metrics));

  // 4. CRA Dashboard
  const craData = await testEndpoint('4. GET /dashboard/cra', `${BASE_URL}/dashboard/cra`);
  console.log('   Metrics:', JSON.stringify(craData.metrics));
  console.log('   Monitoring Schedule:', craData.monitoring_schedule.length);

  // 5. Site User Dashboard
  const siteData = await testEndpoint('5. GET /dashboard/site-user', `${BASE_URL}/dashboard/site-user`);
  console.log('   Metrics:', JSON.stringify(siteData.metrics));

  // 6. Document Controller Dashboard
  const docCtrlData = await testEndpoint('6. GET /dashboard/document-controller', `${BASE_URL}/dashboard/document-controller`);
  console.log('   Metrics:', JSON.stringify(docCtrlData.metrics));

  // 7. DIA TMF Reference Model Zones (11 Zones)
  const zonesData = await testEndpoint('7. GET /tmf/zones', `${BASE_URL}/tmf/zones`);
  console.log(`   Model: ${zonesData.model_version}, Total Zones: ${zonesData.total_zones}`);
  if (zonesData.total_zones !== 11) {
    console.error(`Expected 11 zones, got ${zonesData.total_zones}`);
    process.exit(1);
  }

  // 8. 10-Point QC Verification Checklist
  const qcData = await testEndpoint('8. GET /qc/checklist-template', `${BASE_URL}/qc/checklist-template`);
  console.log(`   Template: ${qcData.template_name}, Items: ${qcData.total_items}`);
  if (qcData.total_items !== 10) {
    console.error(`Expected 10 checklist items, got ${qcData.total_items}`);
    process.exit(1);
  }

  // 9. Studies
  const studiesData = await testEndpoint('9. GET /studies', `${BASE_URL}/studies`);
  console.log(`   Total Studies: ${studiesData.length}`);

  // 10. Compliance & ALCOA+ Readiness
  const compData = await testEndpoint('10. GET /compliance/readiness', `${BASE_URL}/compliance/readiness`);
  console.log(`   Readiness: ${compData.overall_readiness_percentage}%, Audit Events: ${compData.part_11_audit_seal.total_audit_events}`);

  console.log('===============================================================');
  console.log('ALL API v1 SPECIFICATION TESTS PASSED SUCCESSFULLY! (10/10)');
  console.log('===============================================================');
}

runTests();
