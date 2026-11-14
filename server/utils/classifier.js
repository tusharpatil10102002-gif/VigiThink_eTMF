// VigiThink eTMF: Intelligent Document Classification Engine
// DIA TMF Reference Model v3.1 (11 Zones, Sections, Artifacts & Duplicate Detection)

export const DIA_CLASSIFICATION_RULES = [
  {
    patterns: [/delegation.*(?:log|auth)/i, /doa\s*log/i, /site.*staff.*delegation/i],
    zoneId: '05',
    zoneName: 'Site Management',
    sectionId: '05.03',
    sectionName: 'Site Staff & Delegation of Authority',
    artifactId: '05.03.01',
    artifactName: 'Delegation of Authority Log (DOA)',
    documentType: 'Essential Document',
    confidence: 0.98
  },
  {
    patterns: [/(?:curriculum\s*vitae|\bcv\b|resume|investigator\s*cv)/i],
    zoneId: '05',
    zoneName: 'Site Management',
    sectionId: '05.03',
    sectionName: 'Site Staff & Delegation of Authority',
    artifactId: '05.03.02',
    artifactName: 'Curriculum Vitae (CV) of Key Personnel',
    documentType: 'Essential Document',
    confidence: 0.95
  },
  {
    patterns: [/(?:medical\s*license|registration\s*cert|license|practicing\s*license)/i],
    zoneId: '05',
    zoneName: 'Site Management',
    sectionId: '05.03',
    sectionName: 'Site Staff & Delegation of Authority',
    artifactId: '05.03.03',
    artifactName: 'Medical License / Professional Registration',
    documentType: 'Essential Document',
    confidence: 0.94
  },
  {
    patterns: [/(?:gcp\s*cert|good\s*clinical\s*practice|ich\s*gcp|training\s*cert)/i],
    zoneId: '05',
    zoneName: 'Site Management',
    sectionId: '05.03',
    sectionName: 'Site Staff & Delegation of Authority',
    artifactId: '05.03.04',
    artifactName: 'GCP Training Certificate',
    documentType: 'Essential Document',
    confidence: 0.95
  },
  {
    patterns: [/(?:site\s*initiation|siv\s*report|initiation\s*visit)/i],
    zoneId: '05',
    zoneName: 'Site Management',
    sectionId: '05.02',
    sectionName: 'Site Initiation & Monitoring Visits',
    artifactId: '05.02.01',
    artifactName: 'Site Initiation Visit (SIV) Report',
    documentType: 'Essential Document',
    confidence: 0.96
  },
  {
    patterns: [/(?:interim\s*monitoring|monitoring\s*visit|imv\s*report|mvr|site\s*monitoring\s*report)/i],
    zoneId: '05',
    zoneName: 'Site Management',
    sectionId: '05.02',
    sectionName: 'Site Initiation & Monitoring Visits',
    artifactId: '05.02.02',
    artifactName: 'Interim Monitoring Visit (IMV) Report',
    documentType: 'Essential Document',
    confidence: 0.95
  },
  {
    patterns: [/(?:close[\s-]*out\s*visit|cov\s*report|site\s*closeout)/i],
    zoneId: '05',
    zoneName: 'Site Management',
    sectionId: '05.02',
    sectionName: 'Site Initiation & Monitoring Visits',
    artifactId: '05.02.03',
    artifactName: 'Close-Out Visit (COV) Report',
    documentType: 'Essential Document',
    confidence: 0.96
  },
  {
    patterns: [/(?:protocol\s*amendment|final.*approved.*protocol|clinical\s*protocol|\bprotocol\b)/i],
    zoneId: '02',
    zoneName: 'Central Trial Documents',
    sectionId: '02.01',
    sectionName: 'Protocol & Amendments',
    artifactId: '02.01.01',
    artifactName: 'Final Approved Clinical Protocol',
    documentType: 'Essential Document',
    confidence: 0.97
  },
  {
    patterns: [/(?:investigator['’]?s?\s*brochure|\bib\b)/i],
    zoneId: '02',
    zoneName: 'Central Trial Documents',
    sectionId: '02.02',
    sectionName: 'Investigator Brochure',
    artifactId: '02.02.01',
    artifactName: 'Investigator’s Brochure (IB)',
    documentType: 'Essential Document',
    confidence: 0.96
  },
  {
    patterns: [/(?:informed\s*consent|consent\s*form|\bicf\b|patient\s*information)/i],
    zoneId: '02',
    zoneName: 'Central Trial Documents',
    sectionId: '02.03',
    sectionName: 'Informed Consent Forms',
    artifactId: '02.03.01',
    artifactName: 'Master Informed Consent Form (ICF)',
    documentType: 'Essential Document',
    confidence: 0.95
  },
  {
    patterns: [/(?:irb.*approval|iec.*approval|ethics.*committee.*approval|institutional\s*review\s*board)/i],
    zoneId: '04',
    zoneName: 'IRB/IEC and Other Approvals',
    sectionId: '04.01',
    sectionName: 'IRB / IEC Approvals',
    artifactId: '04.01.01',
    artifactName: 'IRB / Ethics Committee Approval Letter',
    documentType: 'Essential Document',
    confidence: 0.97
  },
  {
    patterns: [/(?:ip\s*accountability|investigational\s*product.*accountability|drug\s*accountability|dispensation\s*log)/i],
    zoneId: '06',
    zoneName: 'IP and Trial Supplies',
    sectionId: '06.01',
    sectionName: 'IP Accountability & Storage',
    artifactId: '06.01.01',
    artifactName: 'Investigational Product Accountability Log',
    documentType: 'Essential Document',
    confidence: 0.96
  },
  {
    patterns: [/(?:temp.*log|temperature\s*excursion|storage\s*condition|cold\s*chain)/i],
    zoneId: '06',
    zoneName: 'IP and Trial Supplies',
    sectionId: '06.01',
    sectionName: 'IP Accountability & Storage',
    artifactId: '06.01.02',
    artifactName: 'Temperature Storage Log & Excursion Report',
    documentType: 'Essential Document',
    confidence: 0.94
  },
  {
    patterns: [/(?:serious\s*adverse\s*event|\bsae\b|susar|safety\s*notification|adverse\s*reaction)/i],
    zoneId: '07',
    zoneName: 'Safety Reporting',
    sectionId: '07.01',
    sectionName: 'Serious Adverse Events (SAE)',
    artifactId: '07.01.01',
    artifactName: 'Initial Serious Adverse Event (SAE) Notification',
    documentType: 'Essential Document',
    confidence: 0.95
  },
  {
    patterns: [/(?:data\s*management\s*plan|\bdmp\b|ecrf\s*guidelines|database\s*lock)/i],
    zoneId: '10',
    zoneName: 'Data Management',
    sectionId: '10.01',
    sectionName: 'Data Management Plan & Lock',
    artifactId: '10.01.01',
    artifactName: 'Data Management Plan (DMP)',
    documentType: 'Essential Document',
    confidence: 0.95
  },
  {
    patterns: [/(?:statistical\s*analysis\s*plan|\bsap\b|clinical\s*study\s*report|\bcsr\b)/i],
    zoneId: '11',
    zoneName: 'Statistics',
    sectionId: '11.01',
    sectionName: 'Statistical Analysis Plan & CSR',
    artifactId: '11.01.01',
    artifactName: 'Statistical Analysis Plan (SAP)',
    documentType: 'Essential Document',
    confidence: 0.96
  }
];

/**
 * Classifies document text or filename into DIA TMF Model v3.1 taxonomy
 * @param {string} text - Document title, filename, or keywords
 * @returns {object} Classification prediction
 */
export function classifyClinicalDocument(text = '') {
  const clean = text.trim();
  const normalized = clean.replace(/[_.-]+/g, ' ');

  for (const rule of DIA_CLASSIFICATION_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(clean) || pattern.test(normalized)) {
        return {
          matched: true,
          zoneId: rule.zoneId,
          zoneName: rule.zoneName,
          sectionId: rule.sectionId,
          sectionName: rule.sectionName,
          artifactId: rule.artifactId,
          artifactName: rule.artifactName,
          documentType: rule.documentType,
          confidence: rule.confidence,
          confidenceScore: Math.round(rule.confidence * 100),
          suggestedTitle: clean.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ')
        };
      }
    }
  }

  // Default fallback to Zone 01 Trial Management
  return {
    matched: false,
    zoneId: '01',
    zoneName: 'Trial Management',
    sectionId: '01.01',
    sectionName: 'Trial Oversight',
    artifactId: '01.01.01',
    artifactName: 'Trial Master Oversight Plan',
    documentType: 'General Clinical Document',
    confidence: 0.50,
    confidenceScore: 50,
    suggestedTitle: clean.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ') || 'Clinical Document'
  };
}
