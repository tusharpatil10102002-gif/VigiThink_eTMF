import React, { useState } from 'react';
import { X, BookOpen, Layers, ShieldCheck, FileCheck, CheckCircle2, Lock, FileText, Database } from 'lucide-react';

export default function SystemDocumentationModal({ onClose }) {
  const [activeTab, setActiveTab] = useState("diaModel");

  const diaZones = [
    { id: "01", name: "Trial Management", desc: "Trial committees, trial oversight, project management plans, agreements, and trial financing." },
    { id: "02", name: "Central Trial Documents", desc: "Core clinical study protocol, protocol amendments, Investigator Brochure (IB), and subject information sheets." },
    { id: "03", name: "Regulatory", desc: "Health Authority notifications, IND/CTA submissions, import licenses, and regulatory correspondence." },
    { id: "04", name: "IRB / IEC", desc: "Central and local ethics committee submissions, approvals, roster, and informed consent endorsements." },
    { id: "05", name: "Site Management", desc: "Site selection, feasibility, site initiation visit (SIV), interim monitoring visits (IMV), and close-out visit (COV) reports." },
    { id: "06", name: "IP and Trial Supplies", desc: "Investigational Product (IP) dossier, Certificate of Analysis (CoA), shipment receipts, temperature logs, and destruction records." },
    { id: "07", name: "Safety Reporting", desc: "SUSAR notifications, DSUR periodic reports, SAE line listings, and data monitoring committee reports." },
    { id: "08", name: "Central and Local Testing", desc: "Laboratory accreditations, normal reference ranges, laboratory director CVs, and sample shipment manifests." },
    { id: "09", name: "Third Parties", desc: "Vendor evaluations, Master Service Agreements (MSAs), CRO oversight documentation, and laboratory transfer agreements." },
    { id: "10", name: "Data Management", desc: "Data Management Plan (DMP), electronic Case Report Forms (eCRF), database design specifications, and lock documentation." },
    { id: "11", name: "Statistics", desc: "Statistical Analysis Plan (SAP), interim analysis reports, randomization code lists, and Clinical Study Report (CSR)." }
  ];

  const qcChecks = [
    { no: 1, name: "Protocol & Study ID Verification", standard: "ICH GCP E6(R2) §8.1", desc: "Document belongs to designated study protocol number." },
    { no: 2, name: "Country & Investigational Site Matching", standard: "ICH GCP E6(R2) §8.2", desc: "Verified country and hospital facility site identifier." },
    { no: 3, name: "DIA TMF Taxonomy Classification", standard: "DIA TMF Model v3.1", desc: "Correct Zone, Section, and Artifact taxonomic indexing." },
    { no: 4, name: "Essential Record Classification", standard: "ICH GCP §1.23", desc: "Mandatory regulatory vs. non-essential operational record tagging." },
    { no: 5, name: "Sequential Versioning Control", standard: "21 CFR §11.10(k)", desc: "Strict major/minor version succession (v1.0, v1.1, v2.0)." },
    { no: 6, name: "Contemporaneous Filing Date", standard: "ALCOA+ Standard", desc: "Document generation date matches event timing (within SLA window)." },
    { no: 7, name: "Completeness & Attachment Integrity", standard: "ICH GCP §5.5.3", desc: "Zero missing annexures, blanks, or unexecuted signature blocks." },
    { no: 8, name: "Legibility & Optical Resolution", standard: "ICH GCP §1.63", desc: "Clear OCR contrast, non-degraded text, and full human readability." },
    { no: 9, name: "Regulatory & Medical Signatures", standard: "21 CFR Part 11", desc: "Mandatory investigator, sponsor, and monitor e-signatures present." },
    { no: 10, name: "Mandatory Metadata Attributes", standard: "GxP Compliance", desc: "Complete author, title, date, language, and confidentiality indexing." },
    { no: 11, name: "Duplicate & Checksum Validation", standard: "21 CFR §11.10(b)", desc: "Cryptographic SHA-256 fingerprint verified against duplicate entries." },
    { no: 12, name: "Filing Repository Breadcrumb", standard: "DIA Reference Model", desc: "Correct hierarchical breadcrumb path verified in repository tree." },
    { no: 13, name: "Subject Privacy & PHI Redaction", standard: "HIPAA / GDPR", desc: "Patient names and direct subject identifiers strictly redacted." },
    { no: 14, name: "Certified True Copy Attestation", standard: "ICH GCP §1.63", desc: "Signed declaration verified if scanned from paper source." }
  ];

  const complianceStandards = [
    { title: "21 CFR Part 11 Electronic Records & Signatures", desc: "Mandates computer system validation, audit trails, secure access authorities, dual-identification e-signatures, and record integrity." },
    { title: "ICH GCP E6(R2 / R3) Good Clinical Practice", desc: "International standard for design, conduct, performance, monitoring, auditing, recording, analyses, and reporting of clinical trials." },
    { title: "DIA TMF Reference Model v3.1", desc: "Industry-standard taxonomy providing standard Zone, Section, and Artifact classifications for clinical trial documentation." },
    { title: "Statutory 25-Year GxP Retention (EU CTR 536/2014)", desc: "Requires Trial Master Files to be archived securely in an unalterable, read-only state for a minimum of 25 years after trial completion." }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden text-xs font-sans">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">VigiThink eTMF: System Documentation &amp; Compliance Reference</h3>
              <p className="text-[10px] text-slate-300 font-mono">DIA TMF Reference Model v3.1 · 21 CFR Part 11 · ICH GCP E6(R2/R3) Standards</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('diaModel')}
            className={`pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'diaModel' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> DIA TMF Model (11 Zones)
          </button>
          <button
            onClick={() => setActiveTab('alcoaQc')}
            className={`pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'alcoaQc' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> 14-Point ALCOA+ QC Standards
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'compliance' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Regulatory Compliance Guidelines
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'diaModel' && (
            <div className="space-y-3">
              <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg text-slate-800 text-xs">
                <p className="font-semibold text-blue-900">DIA TMF Reference Model v3.1 Structure</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  The repository adheres to the global standard DIA taxonomy consisting of 11 Zones, categorized hierarchically by Zone, Section, and Artifact level scopes (Trial, Country, Site).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {diaZones.map(z => (
                  <div key={z.id} className="border border-slate-200 rounded-lg p-3 bg-white hover:border-blue-300 transition-colors shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold font-mono text-[10px] rounded">
                        Zone {z.id}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs">{z.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {z.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'alcoaQc' && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-slate-800 text-xs">
                <p className="font-semibold text-emerald-950">14-Point ALCOA+ Quality Control Clearance Criteria</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Enforced under SOP-TMF-04 before clinical documentation can receive formal Quality Clearance (Stage 8) and regulatory filing approval.
                </p>
              </div>

              <div className="space-y-2">
                {qcChecks.map(qc => (
                  <div key={qc.no} className="border border-slate-200 rounded-lg p-2.5 bg-white flex items-start justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {qc.no}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{qc.name}</h4>
                        <p className="text-[11px] text-slate-600 mt-0.5">{qc.desc}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded border border-slate-200 whitespace-nowrap shrink-0">
                      {qc.standard}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-slate-800 text-xs">
                <p className="font-semibold text-purple-950">Regulatory Standards &amp; Inspection Readiness</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Architectural safeguards implemented in VigiThink eTMF to satisfy FDA, EMA, MHRA, and CDSCO regulatory inspections.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complianceStandards.map((std, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Lock className="w-4 h-4 text-purple-700 shrink-0" />
                      <h4 className="font-bold text-xs">{std.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {std.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-[10px] text-slate-500 font-mono">
            VigiThink eTMF Reference Standard · Revision 2026.1
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded cursor-pointer transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
