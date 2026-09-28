// Clinidea Education — Clinical Study Protocols, Countries, 6 Training Sites, and Milestones Data

export const INITIAL_STUDIES = [
  {
    id: "CLIN-001",
    protocolNumber: "CE-QVJ499-2026-001",
    version: "1.2 (Final) — Effective Date: 25 September 2026",
    title: "A 6-Week, Multicenter, Randomized, Double-Masked, Placebo-Controlled Study to Evaluate the Efficacy and Safety of Twice-Daily Brinzolamide 1% / Brimonidine 0.2% Fixed-Dose Combination as an Adjunctive Therapy to Travoprost 0.004% in Reducing Intraocular Pressure in Patients With Normal Tension Glaucoma",
    shortName: "QVJ499 Normal Tension Glaucoma (Phase IV)",
    phase: "Phase IV",
    therapeuticArea: "Ophthalmology",
    indication: "Normal tension glaucoma, inadequately controlled on travoprost 0.004% monotherapy",
    investigationalProduct: "Brinzolamide 1% / Brimonidine 0.2% Fixed-Dose Combination (Simbrinza® / QVJ499)",
    comparator: "Placebo eye-drop suspension, vehicle-matched",
    backgroundTherapy: "Travoprost 0.004% (Travatan®) once daily in the evening",
    studyDesign: "Multicenter, randomized, double-masked, two-arm, placebo-controlled, parallel-group, adjunctive-therapy design",
    sponsor: "Clinidea Education",
    cro: "Clinidea Clinical Operations & Data Management",
    status: "Active",
    startDate: "2026-09-25",
    targetEndDate: "2027-06-30",
    targetEnrollment: 200,
    currentEnrollment: 0,
    healthIndex: "Green",
    completenessPct: 0,
    filingLagDays: 0,
    openQueriesCount: 0,
    countries: [
      {
        id: "IND",
        code: "IND",
        name: "India",
        regulatoryAuthority: "CDSCO (Central Drugs Standard Control Organisation) & CTRI",
        centralEthicsName: "Institutional Ethics Committee (IEC) / IRB",
        retentionPeriodYears: 15,
        status: "Initiated",
        sites: [
          {
            id: "Site 001 - AIIMS RPC Eye Centre, New Delhi",
            number: "Site 001",
            name: "Site 001 - AIIMS RPC Eye Centre, New Delhi",
            piName: "Dr. Rajendra Prasad (Assigned: Shweta Pagare)",
            piLicense: "MCI-OPH-48921-IN",
            assignedStudent: "Shweta Pagare (Shweta.Pagare@clinidea.in)",
            status: "Active",
            activationDate: "2026-09-25",
            targetEnrollment: 35,
            enrolledCount: 0,
            healthStatus: "Green",
            completenessPct: 0
          },
          {
            id: "Site 002 - Sankara Nethralaya, Chennai",
            number: "Site 002",
            name: "Site 002 - Sankara Nethralaya, Chennai",
            piName: "Dr. Lingam Vijaya (Assigned: Sanjay Pawar)",
            piLicense: "MCI-OPH-31049-IN",
            assignedStudent: "Sanjay Pawar (Sanjay.Pawar@clinidea.in)",
            status: "Active",
            activationDate: "2026-09-25",
            targetEnrollment: 35,
            enrolledCount: 0,
            healthStatus: "Green",
            completenessPct: 0
          },
          {
            id: "Site 003 - L V Prasad Eye Institute, Hyderabad",
            number: "Site 003",
            name: "Site 003 - L V Prasad Eye Institute, Hyderabad",
            piName: "Dr. Garudadri Chandra (Assigned: Somesh Patidar)",
            piLicense: "MCI-OPH-52190-IN",
            assignedStudent: "Somesh Patidar (Somesh.Patidar@clinidea.in)",
            status: "Active",
            activationDate: "2026-09-25",
            targetEnrollment: 35,
            enrolledCount: 0,
            healthStatus: "Green",
            completenessPct: 0
          },
          {
            id: "Site 004 - Aravind Eye Hospital, Madurai",
            number: "Site 004",
            name: "Site 004 - Aravind Eye Hospital, Madurai",
            piName: "Dr. R. Venkatesh (Assigned: Gourish Chouksey)",
            piLicense: "MCI-OPH-61022-IN",
            assignedStudent: "Gourish Chouksey (Gourish.Chouksey@clinidea.in)",
            status: "Active",
            activationDate: "2026-09-25",
            targetEnrollment: 35,
            enrolledCount: 0,
            healthStatus: "Green",
            completenessPct: 0
          },
          {
            id: "Site 005 - Narayana Nethralaya, Bengaluru",
            number: "Site 005",
            name: "Site 005 - Narayana Nethralaya, Bengaluru",
            piName: "Dr. Rohit Shetty (Assigned: Shubham Sharnagat)",
            piLicense: "MCI-OPH-78412-IN",
            assignedStudent: "Shubham Sharnagat (Shubham.Sharnagat@clinidea.in)",
            status: "Active",
            activationDate: "2026-09-25",
            targetEnrollment: 30,
            enrolledCount: 0,
            healthStatus: "Green",
            completenessPct: 0
          },
          {
            id: "Site 006 - Shroff Eye Centre, Mumbai",
            number: "Site 006",
            name: "Site 006 - Shroff Eye Centre, Mumbai",
            piName: "Dr. Cyrus Shroff (Assigned: Mary Vismaya)",
            piLicense: "MCI-OPH-89104-IN",
            assignedStudent: "Mary Vismaya (Mary.Vismaya@clinidea.in)",
            status: "Active",
            activationDate: "2026-09-25",
            targetEnrollment: 30,
            enrolledCount: 0,
            healthStatus: "Green",
            completenessPct: 0
          }
        ]
      }
    ],
    milestones: [
      { id: "m_01", name: "Protocol Version 1.2 Final Approval & IEC Submission", date: "2026-09-25", status: "Completed", bindingArtifactIds: ["02.01.01", "03.02.01"] },
      { id: "m_02", name: "CTRI Prospective Trial Registration", date: "2026-09-28", status: "Completed", bindingArtifactIds: ["03.01.01"] },
      { id: "m_03", name: "6 Training Sites Activation & DOA Log Filing", date: "2026-10-01", status: "In Progress", bindingArtifactIds: ["06.01.01", "06.01.02", "06.01.04"] },
      { id: "m_04", name: "Visit 1 Screening & Open-Label Travoprost Run-In (29 Days)", date: "2026-10-15", status: "Planned", bindingArtifactIds: ["02.03.01"] },
      { id: "m_05", name: "Visit 3 Randomization (1:1 via IRT) & Masked Dosing", date: "2026-11-15", status: "Planned", bindingArtifactIds: ["07.01.01"] },
      { id: "m_06", name: "Visit 4 Day 14 Interim Safety Assessment", date: "2026-12-01", status: "Planned", bindingArtifactIds: ["08.01.01"] },
      { id: "m_07", name: "Visit 5 Day 42 (Week 6) Diurnal IOP Primary Endpoint", date: "2027-01-15", status: "Planned", bindingArtifactIds: ["06.02.04"] },
      { id: "m_08", name: "Database Lock, Unmasking & Statistical Analysis (MMRM/ANCOVA)", date: "2027-03-01", status: "Planned", bindingArtifactIds: ["10.01.01", "11.01.01"] },
      { id: "m_09", name: "Clinical Study Report (CSR) Sign-off & 15-Year TMF Archival", date: "2027-06-30", status: "Planned", bindingArtifactIds: ["02.04.01"] }
    ]
  },
  {
    id: "CARD-002",
    protocolNumber: "CE-CVR-2025-001",
    version: "2.1 (Final) — Effective Date: 22 September 2026",
    title: "To Study the Effect of Physical Activity on Blood Pressure in Hypertensive Adults — An Observational Cohort Study with Wearable-Device-Based Activity Monitoring",
    shortName: "Physical Activity & BP Cohort Study (CE-CVR-2025-001)",
    phase: "Observational Cohort",
    therapeuticArea: "Cardiology / Hypertension",
    indication: "Essential (Primary) Hypertension in Adults Aged 35–65 Years (SBP ≥130 and/or DBP ≥80 mmHg)",
    investigationalProduct: "Non-Interventional — Wearable Fitness Tracker & IPAQ-Short Form Stratification (Low/Moderate/High Tertiles)",
    comparator: "Baseline Physical Activity Tertile Comparison (High vs Low IPAQ Tertile)",
    backgroundTherapy: "Standard-of-Care Antihypertensive Regimen & WHO Physical Activity Counselling",
    studyDesign: "Prospective, Single-Centre/Multi-Cohort Observational Study with Wearable-Device-Based Activity Monitoring & DSMB Oversight",
    sponsor: "Clinidea Education",
    cro: "Study Steering Committee & Independent DSMB, Clinidea Education",
    status: "Active",
    startDate: "2026-09-22",
    targetEndDate: "2027-11-22",
    targetEnrollment: 112,
    currentEnrollment: 0,
    healthIndex: "Green",
    completenessPct: 0,
    filingLagDays: 0,
    openQueriesCount: 0,
    countries: [
      {
        id: "IND",
        code: "IND",
        name: "India",
        regulatoryAuthority: "CTRI / ICMR National Ethical Guidelines 2017 / DPDP Act 2023",
        centralEthicsName: "Institutional Ethics Committee (IEC) & Independent DSMB",
        retentionPeriodYears: 5,
        status: "Initiated",
        sites: [
          {
            id: "Site 101 - Clinidea Tertiary Hypertension Research Clinic, Pune",
            number: "Site 101",
            name: "Site 101 - Clinidea Tertiary Hypertension Research Clinic, Pune",
            piName: "Dr. Vikramaditya Deshpande (MD, DM Cardiology)",
            piLicense: "MCI-CARD-19842-IN",
            status: "Active",
            activationDate: "2026-09-22",
            targetEnrollment: 112,
            enrolledCount: 0,
            healthStatus: "Green",
            completenessPct: 0
          }
        ]
      }
    ],
    milestones: [
      { id: "m_201", name: "Protocol Version 2.1 Final Approval (IEC & DSMB Chair)", date: "2026-09-22", status: "Completed", bindingArtifactIds: ["02.01.01", "03.02.01"] },
      { id: "m_202", name: "Site Initiation, BP Device Calibration & Tracker Verification", date: "2026-10-15", status: "In Progress", bindingArtifactIds: ["06.01.02"] },
      { id: "m_203", name: "Participant Enrolment (N=112 across Low/Mod/High IPAQ Tertiles)", date: "2027-01-15", status: "Planned", bindingArtifactIds: ["02.03.01"] },
      { id: "m_204", name: "Visit 2 (Week 6) Interim BP Assessment & DSMB Safety Cut", date: "2027-04-15", status: "Planned", bindingArtifactIds: ["01.01.03"] },
      { id: "m_205", name: "Visit 3 (Week 12) Final Exit BP & Wearable Data Download", date: "2027-07-15", status: "Planned", bindingArtifactIds: ["06.02.04"] },
      { id: "m_206", name: "Database Lock, ANCOVA Statistical Analysis & Final Report", date: "2027-11-22", status: "Planned", bindingArtifactIds: ["11.01.01", "02.04.01"] }
    ]
  }
];
