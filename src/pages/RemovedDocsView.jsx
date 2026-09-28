import React, { useState } from 'react';
import { useTMFData } from '../context/TMFDataContext';
import { Trash2, Search, AlertTriangle, ShieldCheck, History } from 'lucide-react';
import DocumentViewerDrawer from '../components/document/DocumentViewerDrawer';

export default function RemovedDocsView() {
  const { auditLogs, selectedStudyId, activeStudy } = useTMFData();
  const [search, setSearch] = useState("");

  // Decommissioned/deleted records captured in Part 11 audit log
  const removedLogs = auditLogs.filter(l => 
    (l.action.includes('REMOVED') || l.action.includes('DELETED') || l.action.includes('DECOMMISSIONED')) &&
    (l.study_id === selectedStudyId || selectedStudyId === 'ALL')
  );

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full font-sans text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            Decommissioned & Removed Documents Audit Vault
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            21 CFR Part 11 Non-Destructive Storage: Documents removed from active filing remain perpetually recorded with regulatory justification
          </p>
        </div>

        <span className="px-3 py-1 bg-rose-50 text-rose-800 rounded border border-rose-300 font-mono font-bold">
          Decommissioned Records: {removedLogs.length}
        </span>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-[11px] flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-xs">ICH GCP E6(R3) & 21 CFR Part 11 Regulatory Principle:</h4>
          <p className="mt-0.5 leading-relaxed">
            In electronic Trial Master Files, records cannot be permanently purged or destroyed during the active trial or statutory retention period. When a document is decommissioned (e.g. accidental wrong filing or duplicate), its metadata, cryptographic hash, and removal justification are permanently retained for audit defense.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Regulatory Removal Event History — {activeStudy.id}</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-mono text-[11px] uppercase border-b border-slate-200">
                <th className="p-3">Timestamp (UTC)</th>
                <th className="p-3">Target Object ID</th>
                <th className="p-3">Document Title</th>
                <th className="p-3">Decommissioned By</th>
                <th className="p-3">User Role</th>
                <th className="p-3">Regulatory Deletion Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {removedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    No documents have been decommissioned or removed from this study. Perfect integrity record maintained.
                  </td>
                </tr>
              ) : (
                removedLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono text-blue-700">{log.timestamp.replace('T', ' ').substring(0, 19)}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{log.target_id}</td>
                    <td className="p-3 font-semibold text-slate-800 max-w-xs truncate">{log.target_title}</td>
                    <td className="p-3 text-slate-800 font-medium">{log.user_name}</td>
                    <td className="p-3 font-mono text-slate-600">{log.user_role}</td>
                    <td className="p-3 text-rose-800 italic">{log.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
