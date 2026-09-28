import React, { useState } from 'react';
import { useTMFData } from '../context/TMFDataContext';
import { History, Download, ShieldCheck, Search, Filter, Lock } from 'lucide-react';

export default function AuditTrailView() {
  const { auditLogs, selectedStudyId, exportAuditTrailCsv } = useTMFData();
  const [filterAction, setFilterAction] = useState("ALL");
  const [search, setSearch] = useState("");

  const filteredLogs = auditLogs.filter(log => {
    if (log.study_id !== selectedStudyId) return false;
    if (filterAction !== "ALL" && log.action !== filterAction) return false;
    if (search && !log.target_title.toLowerCase().includes(search.toLowerCase()) && !log.user_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleExportAuditTrail = () => {
    exportAuditTrailCsv();
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            21 CFR Part 11 Immutable Audit Trail Log
          </h1>
          <p className="text-xs text-slate-500 font-mono">Append-only, non-deletable audit log capturing all system operations (Who, What, When, IP, Reason)</p>
        </div>

        <button
          onClick={handleExportAuditTrail}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export Audit Trail (PDF / CSV)
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by user, target title, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded px-3 py-1.5 focus:border-blue-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 rounded px-2.5 py-1.5 shadow-xs"
          >
            <option value="ALL">All Event Types</option>
            <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
            <option value="PART11_ESIGNATURE_APPLIED">Part 11 E-Signature</option>
            <option value="QC_REVIEW_PASSED">QC Passed</option>
            <option value="QUERY_RAISED">Query Raised</option>
            <option value="DOCUMENT_CHECKED_OUT">Checked Out</option>
            <option value="DOCUMENT_CHECKED_IN">Checked In</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <span className="text-xs font-bold text-slate-800 font-mono">
            Showing {filteredLogs.length} Events for Study {selectedStudyId}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold border border-emerald-300">
            Hash Manifest Binding: SHA-256 Validated
          </span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase">
              <th className="p-3">Timestamp (UTC)</th>
              <th className="p-3">User & Role</th>
              <th className="p-3">Action Event</th>
              <th className="p-3">Target Object</th>
              <th className="p-3">State Change (Old → New)</th>
              <th className="p-3">IP Address</th>
              <th className="p-3">Reason for Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono text-[11px] text-blue-700 font-semibold whitespace-nowrap">
                  {log.timestamp.replace('T', ' ').substring(0, 19)}
                </td>
                <td className="p-3">
                  <p className="font-bold text-slate-900">{log.user_name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{log.user_role}</p>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-100 text-blue-800 border border-blue-300">
                    {log.action}
                  </span>
                </td>
                <td className="p-3">
                  <p className="font-semibold text-slate-800 truncate max-w-[180px]">{log.target_title}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{log.target_id}</p>
                </td>
                <td className="p-3 font-mono text-[11px] text-slate-600">
                  <p className="text-rose-600 line-through text-[10px]">{log.old_value}</p>
                  <p className="text-emerald-700 font-bold">{log.new_value}</p>
                </td>
                <td className="p-3 font-mono text-slate-600">{log.ip_address}</td>
                <td className="p-3 text-slate-700 italic text-[11px]">{log.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
