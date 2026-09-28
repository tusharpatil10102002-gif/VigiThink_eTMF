import React, { useState } from 'react';
import { useTMFData } from '../context/TMFDataContext';
import { Lock, Unlock, FileDiff, GitCompare, CheckCircle2 } from 'lucide-react';

export default function VersionControlView() {
  const { documents } = useTMFData();
  const lockedDocs = documents.filter(d => d.checkout_status === 'Checked Out');

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Version Control & Check-in / Check-out Lock Manager
          </h1>
          <p className="text-xs text-slate-500 font-mono">Prevents concurrent editing conflicts through exclusive document checkout locks & redline diff comparison</p>
        </div>
      </div>

      {/* Active Locks Panel */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-rose-600" />
          Active Document Checkout Locks ({lockedDocs.length})
        </h2>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase">
              <th className="p-3">Document Title</th>
              <th className="p-3">Version</th>
              <th className="p-3">Lock Holder User</th>
              <th className="p-3">Lock Acquired Time</th>
              <th className="p-3">Auto-Release Timer</th>
              <th className="p-3 text-right">Lock Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {lockedDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                  No active document locks. All documents checked in.
                </td>
              </tr>
            ) : (
              lockedDocs.map(d => (
                <tr key={d.document_id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{d.document_title}</td>
                  <td className="p-3 font-mono text-blue-700 font-bold">v{d.version_number}</td>
                  <td className="p-3 font-semibold text-rose-700">{d.uploaded_by_name || 'Active User'}</td>
                  <td className="p-3 font-mono text-slate-600">2026-08-16 10:15 UTC</td>
                  <td className="p-3 font-mono text-amber-700">Auto-expires in 45m</td>
                  <td className="p-3 text-right">
                    <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs">
                      Checked Out (Exclusive)
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Redline Version Diff Simulator */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-blue-600" />
          Side-by-Side Version Redline Diff Viewer (v0.1 vs v1.0)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <span className="text-slate-600 font-bold text-[11px] block border-b border-slate-200 pb-1">Version 0.1 (Draft Copy)</span>
            <p className="text-slate-600">Section 4.1 Subject Inclusion Criteria:</p>
            <p className="text-rose-800 bg-rose-50 p-2 rounded border border-rose-200">
              - Subjects must be aged 18 to 65 years old at time of consent.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <span className="text-emerald-700 font-bold text-[11px] block border-b border-slate-200 pb-1">Version 1.0 (Approved Effective Copy)</span>
            <p className="text-slate-600">Section 4.1 Subject Inclusion Criteria:</p>
            <p className="text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
              + Subjects must be aged 18 to 75 years old (Expanded per Protocol Amendment 1).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
