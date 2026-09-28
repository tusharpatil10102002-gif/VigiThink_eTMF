import React, { useState } from 'react';
import { useTMFData } from '../context/TMFDataContext';
import { useAuth } from '../context/AuthContext';
import { Inbox, CheckCircle2, Clock, AlertCircle, ArrowRight, FileText } from 'lucide-react';
import DocumentViewerDrawer from '../components/document/DocumentViewerDrawer';

export default function TaskInbox() {
  const { documents, selectedStudyId } = useTMFData();
  const { currentUser, currentRole } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Filter tasks relevant to active user persona role
  const tasks = documents.filter(d => d.study_id === selectedStudyId && d.status !== 'Effective');

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Workflow & Task Inbox</h1>
          <p className="text-xs text-slate-500 font-mono">Assigned document approvals, signatures, and SLA tracking for {currentUser.name} ({currentRole.name})</p>
        </div>

        <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs font-bold shadow-xs">
          Active Tasks: {tasks.length}
        </span>
      </div>

      {/* Task List Table */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Inbox className="w-4 h-4 text-blue-600" />
          My Assigned Document Workflows & Approvals
        </h2>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase">
              <th className="p-3">Workflow Task Name</th>
              <th className="p-3">Target Document</th>
              <th className="p-3">Assigned Role</th>
              <th className="p-3">SLA Due Date</th>
              <th className="p-3">Workflow Stage</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {tasks.map(d => (
              <tr key={d.document_id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedDoc(d)}>
                <td className="p-3">
                  <p className="font-bold text-slate-900">Review & Approve Document</p>
                  <p className="text-[10px] text-slate-500 font-mono">SOP Gate #03 — Approval Stage</p>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800">{d.document_title}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{d.document_id} (v{d.version_number})</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-mono text-blue-700 font-bold">{currentRole.name}</td>
                <td className="p-3 font-mono text-amber-700 font-bold">2026-08-20 (In 4 Days)</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    {d.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 ml-auto shadow-xs">
                    Execute Workflow <ArrowRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedDoc && (
        <DocumentViewerDrawer doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </div>
  );
}
