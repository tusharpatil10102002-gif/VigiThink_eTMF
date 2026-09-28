import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  BarChart3, 
  PieChart, 
  FileSpreadsheet, 
  Copy, 
  Clock, 
  ShieldAlert, 
  Search, 
  Download, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { useTMFData } from '../context/TMFDataContext';

export default function ReportsView() {
  const [searchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'completeness';

  const { studies, activeStudy, documents, selectedStudyId, setSelectedStudyId } = useTMFData();
  const [selectedClassification, setSelectedClassification] = useState("DIA TMF Reference Model v3.1");
  const [currentStudyId, setCurrentStudyId] = useState(selectedStudyId);

  // Dynamic calculations for selected study
  const studyDocs = documents.filter(d => d.study_id === currentStudyId);
  const completedCount = studyDocs.filter(d => d.status === 'Effective' || d.status === 'Approved').length;
  const inQcCount = studyDocs.filter(d => d.qc_status === 'In Progress' || d.qc_status === 'Query Raised').length;
  const missingCount = studyDocs.filter(d => d.status === 'Placeholder').length;
  const inProgressCount = studyDocs.filter(d => d.status === 'Draft').length;
  const totalBase = studyDocs.length || 1;
  const expectedCount = totalBase + (missingCount === 0 ? 15 : 0);

  const completedPct = Math.round((completedCount / expectedCount) * 100);
  const missingPct = Math.round((missingCount / expectedCount) * 100);
  const inQcPct = Math.round((inQcCount / expectedCount) * 100);
  const expectedPct = Math.max(0, 100 - (completedPct + missingPct + inQcPct));

  // Copy Log records
  const copyLogs = [
    { id: "AP-003-A_ACRED_0000072088", version: 1, source: `CM Folder > ${currentStudyId} > 08 Central and Local Testing`, target: `CM Folder > ${currentStudyId} > INDIA > 08 Central and Local Testing`, copiedOn: "2026-09-10 11:31:26", copiedBy: "Veepra Singh" },
    { id: "AP-003-A_IPAD_0000072148", version: 1, source: `CM Folder > ${currentStudyId} > 06 IP and Trial Supplies`, target: `CM Folder > ${currentStudyId} > INDIA > 06 IP and Trial Supplies`, copiedOn: "2026-09-11 11:19:45", copiedBy: "Amit Nakhe" },
    { id: "ETO-011-08_PROTO_0000081022", version: 1, source: `CM Folder > ${currentStudyId} > 02 Central Trial Documents`, target: `CM Folder > ${currentStudyId} > INDIA > 02 Central Trial Documents`, copiedOn: "2026-09-12 11:53:00", copiedBy: "Veepra Singh" }
  ];

  const handleExportCopyLogCsv = () => {
    const headers = ['Document ID', 'Version', 'Source Folder Path', 'Target Folder Path', 'Copied On', 'Copied By User'];
    const rows = copyLogs.map(c => [
      `"${c.id}"`,
      `"${c.version}"`,
      `"${c.source}"`,
      `"${c.target}"`,
      `"${c.copiedOn}"`,
      `"${c.copiedBy}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VigiThink_eTMF_CopyLog_${currentStudyId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCompletenessCsv = () => {
    const headers = ['Metric', 'Count', 'Percentage'];
    const rows = [
      ['Expected Documents', expectedCount, `${expectedPct}%`],
      ['Missing Placeholders', missingCount, `${missingPct}%`],
      ['In QC / Review', inQcCount, `${inQcPct}%`],
      ['Completed / Effective', completedCount, `${completedPct}%`]
    ];
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VigiThink_eTMF_Completeness_${currentStudyId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4 bg-slate-100 min-h-full text-xs font-sans">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-700" /> Reports & Oversight Analytics Engine
          </h1>
          <p className="text-[11px] text-slate-500 font-mono">Module 9 & 13: 21 CFR Part 11 Audit Trail & TMF Quality Metrics</p>
        </div>

        <span className="px-2.5 py-1 bg-sky-100 text-blue-900 rounded font-mono font-bold text-xs border border-sky-300">
          Module: {activeTabParam.toUpperCase()}
        </span>
      </div>

      {/* 1. COMPLETENESS REPORT */}
      {activeTabParam === 'completeness' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded p-4 space-y-4 shadow-xs">
            <h2 className="font-bold text-slate-900 text-xs border-b pb-2">Completeness Report Filters</h2>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-semibold">Classification:</span>
                <select
                  value={selectedClassification}
                  onChange={(e) => setSelectedClassification(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800"
                >
                  <option>DIA TMF Reference Model v3.1</option>
                  <option>Clinidea Education Standard Model</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-semibold">Choose Study:</span>
                <select
                  value={currentStudyId}
                  onChange={(e) => setCurrentStudyId(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 font-bold text-blue-900"
                >
                  {studies.map(s => (
                    <option key={s.id} value={s.id}>{s.id} ({s.shortName})</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleExportCompletenessCsv}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export Report (CSV)
              </button>
            </div>
          </div>

          {/* Dynamic 3D-styled SVG Pie Chart */}
          <div className="bg-white border border-slate-200 rounded p-6 flex flex-col items-center justify-center space-y-6 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm">Overall Document Status — {currentStudyId}</h3>
            
            <div className="relative w-64 h-64">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* Expected Slice - Sky Blue */}
                <circle 
                  cx="18" cy="18" r="15.9155" fill="transparent" 
                  stroke="#38bdf8" strokeWidth="7" 
                  strokeDasharray={`${expectedPct || 60} ${100 - (expectedPct || 60)}`} 
                  strokeDashoffset="0"
                />
                {/* Missing Slice - Rose/Red */}
                <circle 
                  cx="18" cy="18" r="15.9155" fill="transparent" 
                  stroke="#f87171" strokeWidth="7" 
                  strokeDasharray={`${missingPct || 20} ${100 - (missingPct || 20)}`} 
                  strokeDashoffset={`-${expectedPct || 60}`}
                />
                {/* In QC Slice - Amber */}
                <circle 
                  cx="18" cy="18" r="15.9155" fill="transparent" 
                  stroke="#fbbf24" strokeWidth="7" 
                  strokeDasharray={`${inQcPct || 10} ${100 - (inQcPct || 10)}`} 
                  strokeDashoffset={`-${(expectedPct || 60) + (missingPct || 20)}`}
                />
                {/* Completed Slice - Emerald */}
                <circle 
                  cx="18" cy="18" r="15.9155" fill="transparent" 
                  stroke="#34d399" strokeWidth="7" 
                  strokeDasharray={`${completedPct || 10} ${100 - (completedPct || 10)}`} 
                  strokeDashoffset={`-${(expectedPct || 60) + (missingPct || 20) + (inQcPct || 10)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center font-bold text-slate-800 font-mono text-center">
                <span className="text-sm">{currentStudyId}</span>
                <span className="text-xs text-emerald-700 font-bold">{completedPct}% Complete</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-sky-400 rounded-sm"></span> Expected - {expectedCount} ({expectedPct}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-400 rounded-sm"></span> Missing - {missingCount} ({missingPct}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-400 rounded-sm"></span> In QC - {inQcCount} ({inQcPct}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-400 rounded-sm"></span> Completed - {completedCount} ({completedPct}%)</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. BLINDED / UNBLINDED REPORT */}
      {activeTabParam === 'blinded' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4 shadow-xs">
          <h2 className="font-bold text-slate-900 text-xs border-b pb-2">Blinded vs Unblinded Document Segregation</h2>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-700 font-semibold">Choose Study:</span>
              <select 
                value={currentStudyId} 
                onChange={(e) => setCurrentStudyId(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs"
              >
                {studies.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-clinevo-table-header text-white font-bold text-[11px]">
                  <th className="p-2 border border-blue-800">Document ID</th>
                  <th className="p-2 border border-blue-800">Title</th>
                  <th className="p-2 border border-blue-800">Blinding Status</th>
                  <th className="p-2 border border-blue-800">Authorized Roles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {studyDocs.map(d => (
                  <tr key={d.document_id} className="hover:bg-sky-50/60">
                    <td className="p-2 border border-slate-200 font-bold text-blue-900">{d.document_id}</td>
                    <td className="p-2 border border-slate-200">{d.document_title}</td>
                    <td className="p-2 border border-slate-200">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.blinding_status === 'Unblinded' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {d.blinding_status || 'Blinded'}
                      </span>
                    </td>
                    <td className="p-2 border border-slate-200 font-mono text-[11px] text-slate-600">
                      {d.blinding_status === 'Unblinded' ? 'Unblinded CRA, Independent Statistician' : 'All Study Personnel'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. DOCUMENT COPY LOG */}
      {activeTabParam === 'copy-log' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <Copy className="w-4 h-4 text-blue-700" /> Document Copy Log
            </h2>
            <button 
              onClick={handleExportCopyLogCsv}
              className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1 rounded font-semibold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" /> To Excel / CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-clinevo-table-header text-white font-bold text-[11px]">
                  <th className="p-2 border border-blue-800">Document ID</th>
                  <th className="p-2 border border-blue-800 text-center">Version</th>
                  <th className="p-2 border border-blue-800">Source Folder Path</th>
                  <th className="p-2 border border-blue-800">Target Folder Path</th>
                  <th className="p-2 border border-blue-800">Copied On</th>
                  <th className="p-2 border border-blue-800">Copied By User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-sans">
                {copyLogs.map(log => (
                  <tr key={log.id} className="hover:bg-sky-50/60">
                    <td className="p-2 border border-slate-200 font-bold text-blue-900">{log.id}</td>
                    <td className="p-2 border border-slate-200 text-center font-mono font-bold">{log.version}</td>
                    <td className="p-2 border border-slate-200 text-[11px] text-slate-600 max-w-xs truncate">{log.source}</td>
                    <td className="p-2 border border-slate-200 text-[11px] text-slate-600 max-w-xs truncate">{log.target}</td>
                    <td className="p-2 border border-slate-200 font-mono text-[10px]">{log.copiedOn}</td>
                    <td className="p-2 border border-slate-200 font-semibold">{log.copiedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DOCUMENT WORKFLOWS */}
      {activeTabParam === 'workflows' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-3 shadow-xs">
          <h2 className="font-bold text-slate-900 text-xs border-b pb-2">Document Workflow Status Report</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-clinevo-table-header text-white font-bold text-[11px]">
                  <th className="p-2 border border-blue-800">Document ID</th>
                  <th className="p-2 border border-blue-800">Title</th>
                  <th className="p-2 border border-blue-800 text-center">Version</th>
                  <th className="p-2 border border-blue-800">Document Status</th>
                  <th className="p-2 border border-blue-800">QC Status</th>
                  <th className="p-2 border border-blue-800">Assigned Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-sans">
                {studyDocs.map(d => (
                  <tr key={d.document_id} className="hover:bg-sky-50/60">
                    <td className="p-2 border border-slate-200 font-bold text-blue-900">{d.document_id}</td>
                    <td className="p-2 border border-slate-200 font-semibold">{d.document_title}</td>
                    <td className="p-2 border border-slate-200 text-center font-mono font-bold">v{d.version_number}</td>
                    <td className="p-2 border border-slate-200 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        d.status === 'Effective' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-2 border border-slate-200">{d.qc_status}</td>
                    <td className="p-2 border border-slate-200 font-mono text-[11px] text-slate-600">
                      Author → QC Review → Part 11 Approval
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
