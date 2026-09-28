// DIA TMF Reference Model v3.1 Industry Taxonomy

export const DIA_TMF_ZONES = [
  {
    id: "01",
    name: "Zone 01 — Trial Management",
    code: "TM",
    description: "Trial oversight, project management plans, trial committee meetings, and sponsor oversight.",
    sections: [
      {
        id: "01.01",
        name: "01.01 — Trial Oversight",
        artifacts: [
          { id: "01.01.01", name: "Trial Management Plan", essential: true, defaultRetentionYears: 25 },
          { id: "01.01.02", name: "Steering Committee Charter & Minutes", essential: false, defaultRetentionYears: 15 },
          { id: "01.01.03", name: "Data Safety Monitoring Board (DSMB) Charter", essential: true, defaultRetentionYears: 25 },
          { id: "01.01.04", name: "DSMB Open/Closed Minutes & Reports", essential: true, defaultRetentionYears: 25 },
          { id: "01.01.05", name: "Trial Risk Management Plan", essential: true, defaultRetentionYears: 25 }
        ]
      },
      {
        id: "01.02",
        name: "01.02 — Trial Tracking & Metrics",
        artifacts: [
          { id: "01.02.01", name: "Trial Status Reports", essential: false, defaultRetentionYears: 10 },
          { id: "01.02.02", name: "Subject Enrollment Logs (Aggregated)", essential: false, defaultRetentionYears: 15 },
          { id: "01.02.03", name: "TMF Health & Audit Readiness Reports", essential: true, defaultRetentionYears: 25 }
        ]
      }
    ]
  },
  {
    id: "02",
    name: "Zone 02 — Central Trial Documents",
    code: "CT",
    description: "Core protocol documents, Investigator Brochure, master informed consents, and insurance.",
    sections: [
      {
        id: "02.01",
        name: "02.01 — Protocol & Amendments",
        artifacts: [
          { id: "02.01.01", name: "Master Protocol (Final Signed)", essential: true, defaultRetentionYears: 25 },
          { id: "02.01.02", name: "Protocol Amendments (Global)", essential: true, defaultRetentionYears: 25 },
          { id: "02.01.03", name: "Sample Case Report Form (CRF)", essential: true, defaultRetentionYears: 25 }
        ]
      },
      {
        id: "02.02",
        name: "02.02 — Investigator Brochure (IB)",
        artifacts: [
          { id: "02.02.01", name: "Investigator's Brochure (IB)", essential: true, defaultRetentionYears: 25 },
          { id: "02.02.02", name: "IB Updates & Acknowledgements", essential: true, defaultRetentionYears: 25 }
        ]
      },
      {
        id: "02.03",
        name: "02.03 — Information to Subjects",
        artifacts: [
          { id: "02.03.01", name: "Master Informed Consent Form (ICF)", essential: true, defaultRetentionYears: 25 },
          { id: "02.03.02", name: "Patient Recruitment Materials", essential: false, defaultRetentionYears: 10 }
        ]
      }
    ]
  },
  {
    id: "03",
    name: "Zone 03 — Central Regulatory & IRB/IEC Approvals",
    code: "RA",
    description: "Sponsor-level regulatory submissions (IND/CTA), central IRB approvals, and authority licenses.",
    sections: [
      {
        id: "03.01",
        name: "03.01 — Regulatory Authority Approvals",
        artifacts: [
          { id: "03.01.01", name: "IND / CTA Initial Dossier & Approval", essential: true, defaultRetentionYears: 25 },
          { id: "03.01.02", name: "Import / Export Licenses", essential: true, defaultRetentionYears: 15 }
        ]
      },
      {
        id: "03.02",
        name: "03.02 — Central Ethics / IRB Approvals",
        artifacts: [
          { id: "03.02.01", name: "Central Ethics Committee (IEC/IRB) Approval", essential: true, defaultRetentionYears: 25 },
          { id: "03.02.02", name: "IEC/IRB Approved Document Stamp List", essential: true, defaultRetentionYears: 25 }
        ]
      }
    ]
  },
  {
    id: "04",
    name: "Zone 04 — IP & Trial Supplies (Central)",
    code: "IP",
    description: "Investigational product release certificates, manufacturing documentation, cold-chain specifications.",
    sections: [
      {
        id: "04.01",
        name: "04.01 — IP Documentation",
        artifacts: [
          { id: "04.01.01", name: "Certificate of Analysis (CoA)", essential: true, defaultRetentionYears: 25 },
          { id: "04.01.02", name: "GMP Manufacturing Certificate", essential: true, defaultRetentionYears: 25 },
          { id: "04.01.03", name: "Master Labeling & Packaging Docs", essential: true, defaultRetentionYears: 25 }
        ]
      }
    ]
  },
  {
    id: "05",
    name: "Zone 05 — Safety Reporting (Central)",
    code: "SR",
    description: "Expedited safety notifications, SUSAR reports, annual safety reports (DSUR).",
    sections: [
      {
        id: "05.01",
        name: "05.01 — Expedited Safety Reports",
        artifacts: [
          { id: "05.01.01", name: "SUSAR / CIOMS Safety Reports", essential: true, defaultRetentionYears: 25 },
          { id: "05.01.02", name: "Development Safety Update Report (DSUR)", essential: true, defaultRetentionYears: 25 }
        ]
      }
    ]
  },
  {
    id: "06",
    name: "Zone 06 — Site Management (Country / Site Level)",
    code: "SM",
    description: "Investigator selection, Feasibility, Site Initiation, Monitoring Visit Reports, and Delegation Logs.",
    sections: [
      {
        id: "06.01",
        name: "06.01 — Site Personnel & Credentials",
        artifacts: [
          { id: "06.01.01", name: "Principal Investigator (PI) CV & License", essential: true, defaultRetentionYears: 25 },
          { id: "06.01.02", name: "Form FDA 1572 / Statement of Investigator", essential: true, defaultRetentionYears: 25 },
          { id: "06.01.03", name: "Financial Disclosure Form (FDF)", essential: true, defaultRetentionYears: 25 },
          { id: "06.01.04", name: "Site Delegation of Authority Log (DOA)", essential: true, defaultRetentionYears: 25 },
          { id: "06.01.05", name: "GCP Training Certificates", essential: true, defaultRetentionYears: 15 }
        ]
      },
      {
        id: "06.02",
        name: "06.02 — Monitoring Visit Reports",
        artifacts: [
          { id: "06.02.01", name: "Site Selection / Feasibility Report", essential: true, defaultRetentionYears: 25 },
          { id: "06.02.02", name: "Site Initiation Visit (SIV) Report & Letter", essential: true, defaultRetentionYears: 25 },
          { id: "06.02.03", name: "Interim Monitoring Visit (IMV) Report & Letter", essential: true, defaultRetentionYears: 25 },
          { id: "06.02.04", name: "Close-Out Visit (COV) Report & Letter", essential: true, defaultRetentionYears: 25 }
        ]
      }
    ]
  },
  {
    id: "07",
    name: "Zone 07 — Site IRB / IEC & Local Approvals",
    code: "SI",
    description: "Site-specific IRB/IEC submissions, notifications, annual renewals, and site consent forms.",
    sections: [
      {
        id: "07.01",
        name: "07.01 — Local IRB/IEC Approvals",
        artifacts: [
          { id: "07.01.01", name: "Site Ethics Committee Approval Letter", essential: true, defaultRetentionYears: 25 },
          { id: "07.01.02", name: "Approved Site ICF (Local Language)", essential: true, defaultRetentionYears: 25 },
          { id: "07.01.03", name: "Site IRB Annual Re-approval", essential: true, defaultRetentionYears: 25 }
        ]
      }
    ]
  },
  {
    id: "08",
    name: "Zone 08 — IP & Trial Supplies (Site Level)",
    code: "IS",
    description: "Site drug accountability logs, temperature excursion records, shipping manifests, return/destruction logs.",
    sections: [
      {
        id: "08.01",
        name: "08.01 — Site Supply & Accountability",
        artifacts: [
          { id: "08.01.01", name: "Site Drug Accountability Log (IP Log)", essential: true, defaultRetentionYears: 25 },
          { id: "08.01.02", name: "Site Temperature Excursion Log", essential: true, defaultRetentionYears: 15 },
          { id: "08.01.03", name: "IP Destruction / Return Certificate", essential: true, defaultRetentionYears: 25 }
        ]
      }
    ]
  },
  {
    id: "09",
    name: "Zone 09 — Safety Reporting (Site Level)",
    code: "SS",
    description: "Site Serious Adverse Event (SAE) forms, medical monitor notifications, safety queries.",
    sections: [
      {
        id: "09.01",
        name: "09.01 — Site SAE Reports",
        artifacts: [
          { id: "09.01.01", name: "Initial Site SAE Notification Form", essential: true, defaultRetentionYears: 25 },
          { id: "09.01.02", name: "SAE Follow-up & Medical Review", essential: true, defaultRetentionYears: 25 }
        ]
      }
    ]
  },
  {
    id: "10",
    name: "Zone 10 — Central / Local Lab & Samples",
    code: "LB",
    description: "Laboratory accreditations (CAP/CLIA), normal reference ranges, bioanalytical validation, sample shipment logs.",
    sections: [
      {
        id: "10.01",
        name: "10.01 — Lab Documentation",
        artifacts: [
          { id: "10.01.01", name: "Local Lab Certificate & Accreditation (CLIA/CAP)", essential: true, defaultRetentionYears: 25 },
          { id: "10.01.02", name: "Laboratory Normal Reference Ranges", essential: true, defaultRetentionYears: 25 },
          { id: "10.01.03", name: "Biological Sample Manifests", essential: false, defaultRetentionYears: 15 }
        ]
      }
    ]
  },
  {
    id: "11",
    name: "Zone 11 — Third Party / Vendor Oversight",
    code: "VO",
    description: "Clinical Trial Agreements (CTA), CRO contracts, vendor qualification, transfer of regulatory obligations.",
    sections: [
      {
        id: "11.01",
        name: "11.01 — Contracts & Agreements",
        artifacts: [
          { id: "11.01.01", name: "Clinical Trial Agreement (CTA / Site Budget)", essential: true, defaultRetentionYears: 25 },
          { id: "11.01.02", name: "Transfer of Regulatory Obligations (TORO)", essential: true, defaultRetentionYears: 25 },
          { id: "11.01.03", name: "Vendor Qualification & Audit Certificate", essential: true, defaultRetentionYears: 25 }
        ]
      }
    ]
  }
];
