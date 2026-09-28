import React, { useState } from 'react';
import { X, GraduationCap, CheckCircle2, BookOpen, Layers, Award, Terminal, FileText } from 'lucide-react';

export default function TrainingCurriculumModal({ onClose }) {
  const [activeTab, setActiveTab] = useState("modules");

  const modules = [
    { num: 1, title: "Clinical Trial & TMF Fundamentals", desc: "TMF vs eTMF, Purpose of eTMF, Essential Documents, Trial Lifecycle, ICH GCP E6(R2/R3)." },
    { num: 2, title: "eTMF Concepts & DIA Reference Model", desc: "DIA TMF Reference Model v3.1, Zone (01-11), Section, Artifact taxonomy, Level scope." },
    { num: 3, title: "VigiThink eTMF Login, Dashboard & Navigation", desc: "User authentication, Session audit, My Tasks filter, Subheader search, Quick Views." },
    { num: 4, title: "Roles, Users & RACI Permissions", desc: "TMF Manager, TMF Specialist, Clinical Trial Manager, CRA, QA Auditor, Investigator PI." },
    { num: 5, title: "Study, Country & Site Setup", desc: "Trial protocol configuration, Multi-country activation, Hospital site PI & license binding." },
    { num: 6, title: "TMF Structure, File Plan & Milestones", desc: "Configuring expected artifacts per milestone (Site Initiation, FPI, LPLV, Close-Out)." },
    { num: 7, title: "Document Upload & Bulk Upload", desc: "Native files, Multer multipart handling, cryptographic SHA-256 automated hashing." },
    { num: 8, title: "Metadata, Dynamic Indexing & Classification", desc: "Zone/Section/Artifact classification, Country/Site level assignment, Essential tagging." },
    { num: 9, title: "Document Workflow — Review, QC & Approval", desc: "Author Draft -> QC Checklist (14 checks) -> Query/Correction -> Approval -> eSignature." },
    { num: 10, title: "Version Control, Audit Trail & History", desc: "v1.0 to v2.0 revision bump, Concurrency Check-in/Check-out locks, Part 11 Audit Trail." },
    { num: 11, title: "Missing, Overdue, Expected & Duplicate Documents", desc: "Expected vs Missing gap analysis, Overdue alerts, Duplicate detection & replacement." },
    { num: 12, title: "TMF Quality, Completeness, Timeliness & KPIs", desc: "Completeness %, Filing latency SLAs, RAG Quality Index, Defect trend analytics." },
    { num: 13, title: "Reports, Analytics, Audit & Inspection Readiness", desc: "Completeness Pie Chart, Blinded/Unblinded report, Copy Log, Inspector portal export." },
    { num: 14, title: "Study Close-Out, Finalization & Archiving", desc: "Final QC gate checklist, Zero-gap signoff, 25-Year digital retention seal." }
  ];

  const exercises = [
    { num: 1, name: "New Study Setup", action: "Navigate to Studies -> Create New Study with Protocol ID and Phase." },
    { num: 2, name: "Country + Site Creation", action: "Add participating Country (e.g. India) and add Site 101 with PI details." },
    { num: 3, name: "File Plan Setup", action: "Open File Plan modal and review expected artifacts binding to milestones." },
    { num: 4, name: "Document Upload", action: "Use Quick Upload to upload a sample Protocol or MVR file with SHA-256 generation." },
    { num: 5, name: "Metadata & Indexing", action: "Assign correct Zone (Zone 02), Section (02.01), Country, and Site." },
    { num: 6, name: "Wrong Document Correction", action: "Move or reclassify an artifact using Repository -> Move Documents." },
    { num: 7, name: "QC Rejection & Query", action: "Open document viewer, enter defect reason, and click Query Raised." },
    { num: 8, name: "CRA Query Resubmission", action: "Go to Queries Management -> Click Respond/Remediate with action notes." },
    { num: 9, name: "Approval & Part 11 eSignature", action: "Sign document with role credentials and password verification." },
    { num: 10, name: "Version 1.0 to Version 2.0", action: "Open Document Viewer -> Versioning tab -> Author New Version with notes." },
    { num: 11, name: "Search & Retrieval", action: "Search document by ID in subheader and use wildcard % operator." },
    { num: 12, name: "Missing Document Tracking", action: "Visit Expected Document List (EDL) to review gaps and create placeholder." },
    { num: 13, name: "Overdue Document Tracking", action: "Review Timeliness SLA tab for delayed MVR filings." },
    { num: 14, name: "Completeness Report", action: "Open Reports -> Completeness -> View dynamic 3D-styled SVG Pie Chart." },
    { num: 15, name: "Audit Trail Defense", action: "Navigate to 21 CFR Part 11 Audit Trail and export CSV manifest." },
    { num: 16, name: "Study Close-Out Review", action: "Check that Missing = 0 and Pending QC = 0 in Study Close-out checklist." },
    { num: 17, name: "Finalization & Archival", action: "Execute Study Close-Out -> Confirm permanent 25-year digital archive lock." }
  ];

  const qcChecks = [
    "Correct study ID & protocol match",
    "Correct country & clinical investigator site number",
    "Correct DIA TMF Zone, Section, and Artifact classification",
    "Correct document type & essential record tag",
    "Correct version numbering sequence (v1.0, v2.0)",
    "Correct document generation date & contemporaneous filing date",
    "Complete pages with no missing attachments or blanks",
    "Full document legibility & OCR text extraction",
    "Required investigator & sponsor signatures present",
    "Mandatory clinical metadata populated (ALCOA+)",
    "Duplicate document check against existing SHA-256 checksums",
    "Correct filing repository path verified",
    "Redaction of confidential subject identifiers (HIPAA/GDPR)",
    "Certified true copy statement verified if paper source scanned"
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden text-xs font-sans">
        
        {/* Header */}
        <div className="bg-clinevo-header text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Clinidea Education — VigiThinkeTMF Training Curriculum</h3>
              <p className="text-[10px] text-blue-200 font-mono">Industry-Oriented eTMF Specialist, CRA & TMF Coordinator Training Standard</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('modules')}
            className={`pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'modules' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> 14 Training Modules
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'exercises' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> 17 Practical Exercises
          </button>
          <button
            onClick={() => setActiveTab('qcchecks')}
            className={`pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'qcchecks' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> 14 Practical QC Checks
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: 14 Modules */}
          {activeTab === 'modules' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {modules.map(m => (
                <div key={m.num} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold font-mono flex items-center justify-center text-xs shrink-0">
                      {m.num}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">{m.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-8 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: 17 Practical Exercises */}
          {activeTab === 'exercises' && (
            <div className="space-y-2.5">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px]">
                <strong>Practical Hands-On Objective:</strong> Every student can complete these 17 practical workflow exercises inside VigiThinkeTMF to experience real-world CRO/Sponsor clinical operations.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {exercises.map(ex => (
                  <div key={ex.num} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-start gap-2.5 hover:bg-slate-50 transition-colors">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold font-mono text-[10px] shrink-0">
                      Ex #{ex.num}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{ex.name}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">{ex.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 14 Quality Checks */}
          {activeTab === 'qcchecks' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                <strong>SOP-TMF-04 Quality Standard:</strong> A document is only approved and filed after passing all 14 mandatory quality criteria. If any item fails, a formal quality query is raised with corrective action instructions.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {qcChecks.map((check, idx) => (
                  <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2 text-slate-800 font-medium text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Check #{idx + 1}: {check}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">Clinidea Education VigiThinkeTMF Academic Framework</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-clinevo-blue hover:bg-blue-700 text-white rounded font-bold text-xs cursor-pointer shadow-xs"
          >
            Close Curriculum
          </button>
        </div>

      </div>
    </div>
  );
}
