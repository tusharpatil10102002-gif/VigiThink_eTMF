import React from 'react';
import { FileCode2, CheckCircle2, ShieldCheck, Download, Award } from 'lucide-react';

export default function ValidationRepository() {
  const csvDocs = [
    { id: "VMP-01", name: "Validation Master Plan (VMP) — VigiThink eTMF v1.0", status: "Approved & Executed", date: "2025-12-01" },
    { id: "IQ-01", name: "Installation Qualification (IQ) Protocol & Execution Log", status: "Passed (100%)", date: "2025-12-10" },
    { id: "OQ-01", name: "Operational Qualification (OQ) Functional Test Suite", status: "Passed (100%)", date: "2025-12-20" },
    { id: "PQ-01", name: "Performance Qualification (PQ) End-to-End Trial Stress Test", status: "Passed (100%)", date: "2026-01-05" },
    { id: "TM-01", name: "21 CFR Part 11 Traceability Matrix & Compliance Checklist", status: "Verified Compliant", date: "2026-01-10" },
    { id: "UAT-01", name: "User Acceptance Testing (UAT) Sign-off Certificate", status: "Signed & Locked", date: "2026-01-12" }
  ];

  const handleDownloadCsvDoc = (d) => {
    const content = `CLINIDEA EDUCATION — VIGITHINK eTMF
COMPUTERIZED SYSTEM VALIDATION (CSV) & GAMP 5 CONTROLLED RECORD
================================================================================
Document ID: ${d.id}
Document Title: ${d.name}
Effective Date: ${d.date}
Validation Status: ${d.status}
Compliance Standard: 21 CFR Part 11, GAMP 5 Category 4, ICH GCP E6(R2/R3)

SUMMARY OF VALIDATION EVIDENCE:
This document forms part of the Computerized System Validation Package for
Clinidea Education VigiThink eTMF Application Release 2.0.
Validation lifecycle activities include:
1. User Requirements Specifications (URS) Verification
2. Functional Specification & Architecture Design Review
3. Installation Qualification (IQ), Operational Qualification (OQ), Performance Qualification (PQ)
4. Requirements Traceability Matrix (RTM) Verification
5. 21 CFR Part 11 Electronic Signature & Audit Trail Security Assessment

================================================================================
Approved by: Head of Computer Systems Validation & Head of Quality Assurance
Clinidea Education & Therapeutics PVT LTD
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Clinidea_CSV_${d.id}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Computerized System Validation (CSV) & 21 CFR Part 11 Repository
          </h1>
          <p className="text-xs text-slate-500 font-mono">Controlled validation lifecycle evidence, GAMP 5 Category 4 documentation & IQ/OQ/PQ records</p>
        </div>

        <span className="px-3 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs font-bold shadow-xs">
          Validation Status: GAMP 5 Level 4 Validated
        </span>
      </div>

      <div className="glass-panel overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <th className="p-3">Doc ID</th>
              <th className="p-3">Deliverable Name</th>
              <th className="p-3">Effective Date</th>
              <th className="p-3">Validation Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white font-sans">
            {csvDocs.map(d => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-blue-700">{d.id}</td>
                <td className="p-3 font-bold text-slate-900">{d.name}</td>
                <td className="p-3 font-mono text-slate-600">{d.date}</td>
                <td className="p-3">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-bold text-[10px]">
                    {d.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button 
                    onClick={() => handleDownloadCsvDoc(d)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300 text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Download Dossier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
