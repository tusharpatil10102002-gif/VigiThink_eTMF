import React from 'react';
import { useTMFData } from '../context/TMFDataContext';
import { Clock, CheckCircle2, AlertTriangle, Calendar, ArrowRight } from 'lucide-react';

export default function TimelinessSlaView() {
  const { documents, selectedStudyId, activeStudy } = useTMFData();

  const studyDocs = documents.filter(d => d.study_id === selectedStudyId);

  // SLA rules per GCP: MVR within 5 days, Ethics approvals within 2 days, etc.
  const timelinessRows = [
    {
      sopGate: "SOP-TMF-01: Monitoring Visit Reports (MVR)",
      slaLimitDays: 5,
      actualAvgDays: 3.8,
      status: "Within SLA",
      recordsEvaluated: 14,
      onTimePct: 92
    },
    {
      sopGate: "SOP-TMF-02: Ethics Committee / IRB Approvals",
      slaLimitDays: 2,
      actualAvgDays: 1.2,
      status: "Within SLA",
      recordsEvaluated: 8,
      onTimePct: 100
    },
    {
      sopGate: "SOP-TMF-03: Serious Adverse Event (SAE) Filing",
      slaLimitDays: 1,
      actualAvgDays: 0.8,
      status: "Expedited GCP SLA Met",
      recordsEvaluated: 4,
      onTimePct: 100
    },
    {
      sopGate: "SOP-TMF-04: QC Auditor First-Pass Review",
      slaLimitDays: 3,
      actualAvgDays: 2.1,
      status: "Within SLA",
      recordsEvaluated: 28,
      onTimePct: 96
    },
    {
      sopGate: "SOP-TMF-05: Protocol Amendments & Site Training",
      slaLimitDays: 10,
      actualAvgDays: 11.4,
      status: "Overdue Warning",
      recordsEvaluated: 6,
      onTimePct: 67
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full font-sans text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-700" />
            Timeliness, Filing Turnaround & SLA Adherence Monitor
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Module 8 & Section 25: Tracking contemporaneous document filing from clinical event date to eTMF archive
          </p>
        </div>

        <span className="px-3 py-1 bg-indigo-50 text-indigo-800 rounded border border-indigo-300 font-mono font-bold">
          Trial: {activeStudy.id}
        </span>
      </div>

      {/* SLA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-emerald-600 space-y-1">
          <span className="text-slate-500 text-xs font-mono">Overall Timeliness Index</span>
          <p className="text-2xl font-bold text-emerald-700 font-mono">91%</p>
          <span className="text-[10px] text-slate-500 font-mono">Contemporaneous Filing Compliant</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-blue-600 space-y-1">
          <span className="text-slate-500 text-xs font-mono">Average Filing Latency</span>
          <p className="text-2xl font-bold text-blue-700 font-mono">2.8 Days</p>
          <span className="text-[10px] text-slate-500 font-mono">From Site Signature to Repository</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-amber-500 space-y-1">
          <span className="text-slate-500 text-xs font-mono">Delayed Filings Pending</span>
          <p className="text-2xl font-bold text-amber-700 font-mono">2 Records</p>
          <span className="text-[10px] text-amber-800 font-semibold">CRA Escalation Triggered</span>
        </div>
      </div>

      {/* SLA Gates Table */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Clinical SOP Filing Timelines</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-mono text-[11px] uppercase border-b border-slate-200">
                <th className="p-3">SOP Filing Gate</th>
                <th className="p-3">Mandated SLA Limit</th>
                <th className="p-3">Actual Average Turnaround</th>
                <th className="p-3">Records Evaluated</th>
                <th className="p-3">On-Time SLA Compliance</th>
                <th className="p-3">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {timelinessRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="p-3 font-semibold text-slate-900">{row.sopGate}</td>
                  <td className="p-3 font-mono text-slate-700">{row.slaLimitDays} Calendar Days</td>
                  <td className="p-3 font-mono font-bold text-blue-900">{row.actualAvgDays} Days</td>
                  <td className="p-3 font-mono text-slate-600">{row.recordsEvaluated}</td>
                  <td className="p-3 font-mono font-bold text-emerald-700">{row.onTimePct}%</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      row.status.includes('SLA Met') || row.status === 'Within SLA' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
