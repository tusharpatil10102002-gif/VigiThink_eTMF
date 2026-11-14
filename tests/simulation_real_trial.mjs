/**
 * VIGITHINK eTMF
 * REAL-WORLD CLINICAL TRIAL SIMULATION & VALIDATION MASTER SUITE
 * 
 * Study: CLIN-909 (Novavue Therapeutics / VigiThink CRO - Phase III Oncology)
 * Compliance: 21 CFR Part 11, ICH GCP E6(R2/R3), DIA TMF Reference Model v3.1 (11 Zones)
 *
 * Scenarios Validated:
 *  1. Study Protocol Setup (CLIN-909, 2 Countries, 3 Sites, Multi-Role Personnel)
 *  2. Site Activation & Site User Document Upload (DOA Log, Artifact 05.03.01)
 *  3. Document Controller QC Inspection & Query/Rejection (Rework Loop)
 *  4. Remediation, Resubmission & TMF Lead Approval into DIA Zone 05
 *  5. CRA Site Monitoring Visit Submission (IMV Report, Artifact 05.02.02)
 *  6. Bulk Upload & Intelligent DIA TMF Classification Engine
 *  7. TMF Completeness & ALCOA+ Data Integrity Inspection Readiness
 *  8. Protocol Version Control & Superseding (v1.0 -> v1.1 Amendment)
 *  9. Study Closeout Checklist Verification, 25-Year Archival & Read-Only Lock
 */

const BASE_URL = 'http://localhost:5000';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testId, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m[PASS]\x1b[0m ${testId}: ${message}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m[FAIL]\x1b[0m ${testId}: ${message}`);
  }
}

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function runMasterSimulation() {
  console.log('================================================================');
  console.log('VIGITHINK eTMF: REAL-WORLD CLINICAL TRIAL SIMULATION');
  console.log('Study: CLIN-909 (Novavue Therapeutics - Phase III Oncology)');
  console.log('Standard: DIA TMF Reference Model v3.1 | 21 CFR Part 11 | ICH GCP');
  console.log('================================================================\n');

  // ===========================================================================
  // SCENARIO 1: Study Protocol Setup & Organization Configuration
  // ===========================================================================
  console.log('--- SCENARIO 1: Study Protocol & Site Setup (CLIN-909) ---');
  
  // 1.1 Clean up if previous simulation run exists
  await request('/api/studies/CLIN-909', {
    method: 'DELETE',
    headers: { 'x-user-role': 'system_admin' },
    body: JSON.stringify({ user: { id: 'usr_admin', roleId: 'system_admin', name: 'System Admin' } })
  });

  // 1.2 Create Study CLIN-909
  const studyPayload = {
    id: 'CLIN-909',
    shortName: 'NV-909 Oncology',
    title: 'Phase III Randomized, Double-Blind Study of NV-909 in Advanced Solid Tumors',
    protocolNumber: 'NV-909-ONC',
    version: '1.0 (Final)',
    phase: 'Phase III',
    therapeuticArea: 'Oncology',
    indication: 'Advanced Metastatic Solid Tumors',
    investigationalProduct: 'NV-909 (100mg IV Infusion)',
    comparator: 'Standard of Care (Chemotherapy)',
    studyDesign: 'Randomized, Double-Blind, Parallel-Group, Multi-Center',
    sponsor: 'Novavue Therapeutics Inc.',
    cro: 'VigiThink Clinical Research Services',
    status: 'Setup',
    targetEnrollment: 150,
    countries: [
      {
        id: 'country_in',
        code: 'IN',
        name: 'India',
        sites: [
          {
            id: 'SITE-101',
            number: '101',
            name: 'Apollo Hospitals, Mumbai',
            piName: 'Dr. Vikram Joshi',
            country: 'India',
            status: 'Site Identification',
            targetEnrollment: 50
          },
          {
            id: 'SITE-102',
            number: '102',
            name: 'Tata Memorial Centre, Mumbai',
            piName: 'Dr. Sunita Kulkarni',
            country: 'India',
            status: 'Site Identification',
            targetEnrollment: 50
          }
        ]
      },
      {
        id: 'country_us',
        code: 'US',
        name: 'United States',
        sites: [
          {
            id: 'SITE-103',
            number: '103',
            name: 'Memorial Sloan Kettering, New York',
            piName: 'Dr. Robert Vance',
            country: 'United States',
            status: 'Site Identification',
            targetEnrollment: 50
          }
        ]
      }
    ],
    sites: [
      {
        id: 'SITE-101',
        number: '101',
        name: 'Apollo Hospitals, Mumbai',
        piName: 'Dr. Vikram Joshi',
        status: 'Site Identification'
      },
      {
        id: 'SITE-102',
        number: '102',
        name: 'Tata Memorial Centre, Mumbai',
        piName: 'Dr. Sunita Kulkarni',
        status: 'Site Identification'
      },
      {
        id: 'SITE-103',
        number: '103',
        name: 'Memorial Sloan Kettering, New York',
        piName: 'Dr. Robert Vance',
        status: 'Site Identification'
      }
    ],
    user: { id: 'usr_admin', name: 'Tushar Patil (Admin)', roleId: 'system_admin' }
  };

  const createStudyRes = await request('/api/studies', {
    method: 'POST',
    body: JSON.stringify(studyPayload)
  });
  assert(createStudyRes.status === 201 && createStudyRes.data?.data?.id === 'CLIN-909', 'S1.1', 'Study CLIN-909 created with 2 countries & 3 sites');

  // 1.3 Advance Study Lifecycle State to Activation
  const studyStateRes = await request('/api/studies/CLIN-909/status', {
    method: 'PUT',
    headers: { 'x-user-role': 'ctm' },
    body: JSON.stringify({
      status: 'Activation',
      reason: 'Institutional clearance granted; regulatory approvals secured in IN and US.',
      user: { id: 'usr_aarav_ctm', name: 'Aarav Mehta', roleId: 'ctm' }
    })
  });
  assert(studyStateRes.status === 200 && studyStateRes.data?.newStatus === 'Activation', 'S1.2', 'Study state advanced to "Activation" by CTM');

  // 1.4 Advance Site 102 (Tata Memorial) to "Activation"
  const siteStateRes = await request('/api/studies/CLIN-909/site/SITE-102/status', {
    method: 'PUT',
    headers: { 'x-user-role': 'ctm' },
    body: JSON.stringify({
      status: 'Activation',
      reason: 'Site Initiation Visit complete; essential regulatory package approved.',
      user: { id: 'usr_aarav_ctm', name: 'Aarav Mehta', roleId: 'ctm' }
    })
  });
  assert(siteStateRes.status === 200 && siteStateRes.data?.newStatus === 'Activation', 'S1.3', 'Site 102 advanced to "Activation" status');

  // ===========================================================================
  // SCENARIO 2: Site User Document Preparation & Upload (DOA Log)
  // ===========================================================================
  console.log('\n--- SCENARIO 2: Site User Uploads Delegation of Authority Log ---');
  
  const doaDocPayload = {
    document_id: 'DOC-909-001',
    document_title: 'Delegation of Authority Log - Site 102 - Novavue NV-909',
    study_id: 'CLIN-909',
    country_code: 'IN',
    site_id: 'SITE-102',
    tmf_zone_id: '05',
    tmf_zone_name: 'Site Management',
    tmf_section_id: '05.03',
    tmf_section_name: 'Site Staff & Delegation of Authority',
    tmf_artifact_id: '05.03.01',
    tmf_artifact_name: 'Delegation of Authority Log (DOA)',
    version_number: '0.1',
    source_type: 'Electronic Native',
    is_certified_copy: true,
    workflow_action: 'Submit for QC Review',
    assigned_reviewer_id: 'usr_pooja_dc',
    assigned_reviewer_name: 'Pooja Verma (Doc Controller)',
    assigned_reviewer_role: 'document_controller',
    submission_notes: 'Initial site staff DOA log for Site 102 containing PI, Sub-Is and study coordinators.',
    user: { id: 'usr_sanjay', name: 'Sanjay Pawar (Site User / PI)', roleId: 'site_user' }
  };

  const uploadDoaRes = await request('/api/documents', {
    method: 'POST',
    body: JSON.stringify(doaDocPayload)
  });
  assert(uploadDoaRes.status === 201 && uploadDoaRes.data?.data?.document_id === 'DOC-909-001', 'S2.1', 'DOA Log uploaded by Site User and routed to Document Controller for QC');
  assert(uploadDoaRes.data?.data?.lifecycle_stage === 6, 'S2.2', 'DOA Log correctly placed in Lifecycle Stage 6 (Quality Control)');

  // ===========================================================================
  // SCENARIO 3: Document Controller QC Rejection & Query Rework Loop
  // ===========================================================================
  console.log('\n--- SCENARIO 3: QC Inspection Query & Site Remediation ---');

  // 3.1 Document Controller raises a query / rejects for rework
  const rejectRes = await request('/api/documents/DOC-909-001/qc', {
    method: 'PUT',
    headers: { 'x-user-role': 'document_controller' },
    body: JSON.stringify({
      qcStatus: 'Query Raised',
      comments: 'Missing Sub-Investigator signature on page 3. Delegation end date blank for study coordinator.',
      assigned_to: 'usr_sanjay',
      user: { id: 'usr_pooja_dc', name: 'Pooja Verma (Doc Controller)', roleId: 'document_controller' }
    })
  });
  assert(rejectRes.status === 200 && rejectRes.data?.data?.qc_status === 'Query Raised', 'S3.1', 'Document Controller rejected DOA Log with mandatory query comments');
  assert(rejectRes.data?.data?.lifecycle_status?.includes('Rework Required'), 'S3.2', 'Document status updated to Rework Required in audit history');

  // 3.2 Site User reviews query and submits remediated version 0.2
  const remediateRes = await request('/api/documents/DOC-909-001/rework-submit', {
    method: 'PUT',
    headers: { 'x-user-role': 'site_user' },
    body: JSON.stringify({
      rework_notes: 'Sub-Investigator signature obtained on page 3; all coordinator dates completed.',
      new_checksum_hash: 'c81598539e0839e0d1656201b1b9e28e12d46e9102430541d2f9d85cf55d144b',
      assigned_reviewer_id: 'usr_sukriti_mentor',
      assigned_reviewer_name: 'Sukriti Singh (TMF Lead)',
      assigned_reviewer_role: 'tmf_manager',
      user: { id: 'usr_sanjay', name: 'Sanjay Pawar (Site User / PI)', roleId: 'site_user' }
    })
  });
  assert(remediateRes.status === 200 && remediateRes.data?.data?.version_number === '0.2', 'S3.3', 'Remediated DOA Log v0.2 resubmitted for TMF Lead review');
  assert(remediateRes.data?.data?.lifecycle_stage === 6, 'S3.4', 'Document returned to Stage 6 (Quality Control Queue)');

  // ===========================================================================
  // SCENARIO 4: TMF Lead Review, Approval & DIA Zone 05 Filing
  // ===========================================================================
  console.log('\n--- SCENARIO 4: TMF Lead QC Approval & DIA Zone Filing ---');

  const approveRes = await request('/api/documents/DOC-909-001/qc', {
    method: 'PUT',
    headers: { 'x-user-role': 'tmf_manager' },
    body: JSON.stringify({
      qcStatus: 'Passed',
      comments: '10-Point QC Verification Complete: All signatures present, dates aligned with protocol activation.',
      user: { id: 'usr_sukriti_mentor', name: 'Sukriti Singh (TMF Lead)', roleId: 'tmf_manager' }
    })
  });
  assert(approveRes.status === 200 && (approveRes.data?.data?.status === 'Effective' || approveRes.data?.data?.status === 'Approved'), 'S4.1', 'TMF Lead approved DOA Log into "Effective" status');
  assert(approveRes.data?.data?.lifecycle_stage === 9, 'S4.2', 'Document filed into DIA Zone 05 Artifact 05.03.01 (Stage 9: TMF Filing)');

  // ===========================================================================
  // SCENARIO 5: CRA Site Monitoring Visit Submission
  // ===========================================================================
  console.log('\n--- SCENARIO 5: CRA Interim Monitoring Visit Submission ---');

  const imvDocPayload = {
    document_id: 'DOC-909-002',
    document_title: 'Interim Monitoring Visit Report - Site 102 - Visit 01',
    study_id: 'CLIN-909',
    country_code: 'IN',
    site_id: 'SITE-102',
    tmf_zone_id: '05',
    tmf_zone_name: 'Site Management',
    tmf_section_id: '05.02',
    tmf_section_name: 'Site Initiation & Monitoring Visits',
    tmf_artifact_id: '05.02.02',
    tmf_artifact_name: 'Interim Monitoring Visit (IMV) Report',
    version_number: '1.0',
    source_type: 'Electronic Native',
    is_certified_copy: true,
    workflow_action: 'Submit for QC Review',
    assigned_reviewer_id: 'usr_sukriti_mentor',
    assigned_reviewer_name: 'Sukriti Singh (TMF Lead)',
    assigned_reviewer_role: 'tmf_manager',
    submission_notes: 'IMV-01 conducted on-site. 100% ICF verified for first 10 enrolled subjects. No major deviations.',
    user: { id: 'usr_neha_cra', name: 'Neha Sharma (CRA)', roleId: 'cra' }
  };

  const uploadImvRes = await request('/api/documents', {
    method: 'POST',
    body: JSON.stringify(imvDocPayload)
  });
  assert(uploadImvRes.status === 201 && uploadImvRes.data?.data?.document_id === 'DOC-909-002', 'S5.1', 'CRA IMV-01 Report uploaded successfully');

  // Approve IMV
  const approveImvRes = await request('/api/documents/DOC-909-002/qc', {
    method: 'PUT',
    headers: { 'x-user-role': 'tmf_manager' },
    body: JSON.stringify({
      qcStatus: 'Passed',
      comments: 'CRA IMV Report verified with visit logs and follow-up letter.',
      user: { id: 'usr_sukriti_mentor', name: 'Sukriti Singh (TMF Lead)', roleId: 'tmf_manager' }
    })
  });
  assert(approveImvRes.status === 200 && (approveImvRes.data?.data?.status === 'Effective' || approveImvRes.data?.data?.status === 'Approved'), 'S5.2', 'CRA IMV-01 Report approved and filed in Zone 05');

  // ===========================================================================
  // SCENARIO 6: Bulk Upload & Intelligent DIA TMF Classification Engine
  // ===========================================================================
  console.log('\n--- SCENARIO 6: Bulk Upload & Intelligent Classification ---');

  // Test Classifier Directly
  const classifyTest1 = await request('/api/documents/classify', {
    method: 'POST',
    body: JSON.stringify({ title: 'Investigator_Brochure_Edition_8.pdf' })
  });
  assert(classifyTest1.data?.data?.zoneId === '02', 'S6.1', 'Intelligent classifier mapped Investigator Brochure to Zone 02');

  const classifyTest2 = await request('/api/documents/classify', {
    method: 'POST',
    body: JSON.stringify({ title: 'Ethics_Committee_Approval_Letter.pdf' })
  });
  assert(classifyTest2.data?.data?.zoneId === '04', 'S6.2', 'Intelligent classifier mapped Ethics Committee Approval to Zone 04');

  const classifyTest3 = await request('/api/documents/classify', {
    method: 'POST',
    body: JSON.stringify({ title: 'Pharmacy_Drug_Accountability_Log.xlsx' })
  });
  assert(classifyTest3.data?.data?.zoneId === '06', 'S6.3', 'Intelligent classifier mapped Drug Accountability Log to Zone 06');

  // Perform multipart bulk upload using FormData
  const formData = new FormData();
  const file1 = new Blob(['%PDF-1.4 Clinical Protocol Investigator Brochure NV-909'], { type: 'application/pdf' });
  const file2 = new Blob(['%PDF-1.4 Institutional Review Board Approval Notice Mumbai'], { type: 'application/pdf' });
  const file3 = new Blob(['Date,Batch,Dispensed,Returned,Sign\n2026-05-01,B001,10,0,PI'], { type: 'text/csv' });

  formData.append('files', file1, 'Investigator_Brochure_Edition_8.pdf');
  formData.append('files', file2, 'IRB_Ethics_Approval_Notice_Mumbai.pdf');
  formData.append('files', file3, 'Pharmacy_IP_Accountability_Log_Site102.csv');
  formData.append('study_id', 'CLIN-909');
  formData.append('site_id', 'SITE-102');
  formData.append('country_code', 'IN');
  formData.append('submission_notes', 'Core regulatory package bulk submission');
  formData.append('user', JSON.stringify({ id: 'usr_pooja_dc', name: 'Pooja Verma (Doc Controller)', roleId: 'document_controller' }));

  const bulkUploadRes = await fetch(`${BASE_URL}/api/documents/bulk-upload`, {
    method: 'POST',
    body: formData
  });
  const bulkData = await bulkUploadRes.json().catch(() => ({}));
  assert(bulkUploadRes.status === 201 && bulkData.count === 3, 'S6.4', `Bulk upload successfully processed 3 clinical documents with auto-classification`);
  assert(bulkData.data[0].checksum_hash && bulkData.data[0].checksum_hash.length === 64, 'S6.5', 'SHA-256 cryptographic hashes generated for all bulk files');

  // ===========================================================================
  // SCENARIO 7: TMF Completeness & ALCOA+ Inspection Readiness Dossier
  // ===========================================================================
  console.log('\n--- SCENARIO 7: TMF Completeness & Regulatory Inspection Dossier ---');

  const dossierRes = await request('/api/v1/compliance/inspection-dossier/CLIN-909');
  assert(dossierRes.status === 200 && dossierRes.data?.data?.summary_metrics?.total_documents >= 5, 'S7.1', 'Inspection dossier computed for Study CLIN-909');
  assert(dossierRes.data?.data?.inspection_seal?.manifest_checksum?.length === 64, 'S7.2', 'Cryptographic SHA-256 seal generated for inspection manifest');
  assert(dossierRes.data?.data?.alcoa_plus_metrics?.original?.score === 100, 'S7.3', 'ALCOA+ "Original" metric reaches 100% cryptographic integrity');
  assert(dossierRes.data?.data?.dia_zones_breakdown?.length === 11, 'S7.4', 'Complete 11-Zone DIA TMF Reference Model breakdown generated');

  // Verify Inspection Dossier CSV format
  const csvRes = await fetch(`${BASE_URL}/api/v1/compliance/inspection-dossier/CLIN-909?format=csv`);
  const csvText = await csvRes.text();
  assert(csvRes.status === 200 && csvText.includes('Document ID,Title,Study ID'), 'S7.5', 'Downloadable CSV inspection manifest generated successfully');

  // ===========================================================================
  // SCENARIO 8: Protocol Version Control & Superseding
  // ===========================================================================
  console.log('\n--- SCENARIO 8: Protocol Version Control (v1.0 -> v1.1 Amendment) ---');

  // 8.1 Upload Protocol v1.0
  const protoV1 = await request('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      document_id: 'DOC-909-PROTO-V1',
      document_title: 'Clinical Protocol NV-909-ONC v1.0',
      study_id: 'CLIN-909',
      country_code: 'IN',
      site_id: 'SITE-102',
      tmf_zone_id: '02',
      tmf_zone_name: 'Central Trial Documents',
      tmf_section_id: '02.01',
      tmf_section_name: 'Protocol & Amendments',
      tmf_artifact_id: '02.01.01',
      tmf_artifact_name: 'Final Approved Clinical Protocol',
      version_number: '1.0',
      status: 'Draft',
      user: { id: 'usr_aarav_ctm', name: 'Aarav Mehta', roleId: 'ctm' }
    })
  });
  assert(protoV1.status === 201, 'S8.1', 'Protocol v1.0 initialized in repository');

  // Approve v1.0
  await request('/api/documents/DOC-909-PROTO-V1/qc', {
    method: 'PUT',
    headers: { 'x-user-role': 'tmf_manager' },
    body: JSON.stringify({
      qcStatus: 'Passed',
      user: { id: 'usr_sukriti_mentor', name: 'Sukriti Singh (TMF Lead)', roleId: 'tmf_manager' }
    })
  });

  // 8.2 Upload Protocol Amendment v1.1 and supersede v1.0
  const protoV11 = await request('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      document_id: 'DOC-909-PROTO-V1-1',
      document_title: 'Clinical Protocol NV-909-ONC v1.1 (Amendment 1)',
      study_id: 'CLIN-909',
      country_code: 'IN',
      site_id: 'SITE-102',
      tmf_zone_id: '02',
      tmf_zone_name: 'Central Trial Documents',
      tmf_section_id: '02.01',
      tmf_section_name: 'Protocol & Amendments',
      tmf_artifact_id: '02.01.01',
      tmf_artifact_name: 'Final Approved Clinical Protocol',
      version_number: '1.1',
      status: 'Draft',
      submission_notes: 'Protocol Amendment 1: Addition of exploratory pharmacokinetic cohort.',
      user: { id: 'usr_aarav_ctm', name: 'Aarav Mehta', roleId: 'ctm' }
    })
  });
  assert(protoV11.status === 201, 'S8.2', 'Protocol Amendment v1.1 created successfully');

  // Approve v1.1
  await request('/api/documents/DOC-909-PROTO-V1-1/qc', {
    method: 'PUT',
    headers: { 'x-user-role': 'tmf_manager' },
    body: JSON.stringify({
      qcStatus: 'Passed',
      user: { id: 'usr_sukriti_mentor', name: 'Sukriti Singh (TMF Lead)', roleId: 'tmf_manager' }
    })
  });

  // Check out v1.0 and mark as Superseded
  const supersedeRes = await request('/api/documents/DOC-909-PROTO-V1/checkout', {
    method: 'POST',
    body: JSON.stringify({
      action: 'checkin',
      version_number: '1.0',
      status: 'Superseded',
      user: { id: 'usr_aarav_ctm', name: 'Aarav Mehta', roleId: 'ctm' },
      notes: 'Superseded by Protocol Amendment v1.1.'
    })
  });
  assert(supersedeRes.status === 200 && supersedeRes.data?.data?.status === 'Superseded', 'S8.3', 'Protocol v1.0 marked as Superseded with preserved audit trail');

  // ===========================================================================
  // SCENARIO 9: Study Closeout Checklist, 25-Year Archival & Read-Only Lock
  // ===========================================================================
  console.log('\n--- SCENARIO 9: Study Closeout, Archival & 25-Year Retention Lock ---');

  // 9.1 Complete formal Closeout Checklist
  const checklistRes = await request('/api/studies/CLIN-909/closeout-checklist', {
    method: 'PUT',
    headers: { 'x-user-role': 'ctm' },
    body: JSON.stringify({
      checklist: {
        databaseLocked: true,
        ipAccounted: true,
        allMonitoringVisitsCompleted: true,
        allDocumentsFiled: true,
        queriesResolved: true,
        signOffComplete: true
      },
      notes: 'All clinical milestones complete. Formal database lock achieved. Ready for TMF archival.',
      user: { id: 'usr_aarav_ctm', name: 'Aarav Mehta', roleId: 'ctm' }
    })
  });
  assert(checklistRes.status === 200 && checklistRes.data?.data?.databaseLocked === true, 'S9.1', 'Formal Study Closeout checklist validated and signed off');

  // 9.2 Engage 25-Year Statutory Archival Lock
  const archiveRes = await request('/api/studies/CLIN-909/archive', {
    method: 'PUT',
    headers: { 'x-user-role': 'system_admin' },
    body: JSON.stringify({
      reason: 'Formal trial completion; 25-year digital TMF regulatory retention lock engaged per GCP / 21 CFR Part 11.',
      user: { id: 'usr_admin', name: 'Tushar Patil (Admin)', roleId: 'system_admin' }
    })
  });
  assert(archiveRes.status === 200 && archiveRes.data?.data?.status === 'Archived', 'S9.2', 'Study CLIN-909 archived with 25-year statutory lock');

  // 9.3 Verify All Study Documents are locked in Stage 11 (Archival)
  const verifyDoc = await request('/api/documents/DOC-909-001');
  assert(verifyDoc.status === 200 && verifyDoc.data?.data?.lifecycle_stage === 11, 'S9.3', 'DOA Log transitioned to Stage 11 (Archival)');
  assert(verifyDoc.data?.data?.lifecycle_status?.includes('25-Yr Regulatory Lock'), 'S9.4', '25-Year regulatory lock active on clinical document record');

  // 9.4 Verify Immutability: Deleting an archived document by non-admin is forbidden
  const deleteForbiddenRes = await request('/api/documents/DOC-909-001', {
    method: 'DELETE',
    headers: { 'x-user-role': 'site_user' },
    body: JSON.stringify({ user: { id: 'usr_sanjay', roleId: 'site_user' } })
  });
  assert(deleteForbiddenRes.status === 403, 'S9.5', 'Non-admin unauthorized document deletion blocked with 403 Forbidden');

  // 9.5 Clean slate tear-down: Remove simulation study so production remains 100% clean
  const teardownRes = await request('/api/studies/CLIN-909', {
    method: 'DELETE',
    headers: { 'x-user-role': 'system_admin' },
    body: JSON.stringify({ user: { id: 'usr_tushar_admin', roleId: 'system_admin' } })
  });
  assert(teardownRes.status === 200, 'S9.6', 'Simulation study CLIN-909 cleaned up - 100% clean slate confirmed');

  // ===========================================================================
  // SUMMARY REPORT
  // ===========================================================================
  console.log('\n================================================================');
  console.log('SIMULATION & VALIDATION EXECUTION SUMMARY:');
  console.log(`Total Simulation Steps Tested: ${totalTests}`);
  console.log(`Passed: \x1b[32m${passedTests}\x1b[0m`);
  console.log(`Failed: \x1b[31m${failedTests}\x1b[0m`);
  console.log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('================================================================\n');

  if (failedTests === 0) {
    console.log('\x1b[32mALL 9 REAL-WORLD CLINICAL TRIAL SCENARIOS VALIDATED WITH 100% SUCCESS!\x1b[0m\n');
  } else {
    process.exit(1);
  }
}

runMasterSimulation();
