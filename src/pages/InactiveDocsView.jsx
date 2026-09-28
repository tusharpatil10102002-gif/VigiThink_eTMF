import React, { useState } from 'react';
import { useTMFData } from '../context/TMFDataContext';
import { Ban, Search, Download, Eye, FileText, History } from 'lucide-react';
import DocumentViewerDrawer from '../components/document/DocumentViewerDrawer';

export default function InactiveDocsView() {
  const { documents, selectedStudyId, activeStudy, downloadDocumentFile } = useTMFData();
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const inactiveDocs = documents.filter(d => 
    d.study_id === selectedStudyId && (d.status === 'Superseded' || d.status === 'Inactive' || d.status === 'Expired')
  );

  const filteredDocs = inactiveDocs.filter(d => {
    if (search) {
      const q = search.toLowerCase();
      return d.document_id.toLowerCase().includes(q) || d.document_title.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full font-sans text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Ban className="w-5 h-5 text-slate-500" />
            Inactive & Superseded Document Vault
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Module 7 & 11: Past revisions, superseded protocol versions, and decommissioned clinical trial records
          </p>
        </div>

        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded border border-slate-300 font-mono font-bold">
          Inactive Records: {inactiveDocs.length}
        </span>
      </div>

      {/* Table */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="font-bold text-slate-900 text-xs">Superseded Records — {activeStudy.id}</h3>
          <span className="text-[11px] text-slate-500 font-mono">Preserved for 21 CFR Part 11 Audit Defense</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-mono text-[11px] uppercase border-b border-slate-200">
                <th className="p-3">Document ID</th>
                <th className="p-3">Title</th>
                <th className="p-3">Version</th>
                <th className="p-3">Lifecycle State</th>
                <th className="p-3">Superseded Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    No inactive or superseded documents in this study scope. All records are currently active or draft.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => (
                  <tr key={doc.document_id} className="hover:bg-slate-50/80 opacity-80 hover:opacity-100">
                    <td className="p-3 font-mono font-bold text-slate-700">{doc.document_id}</td>
                    <td className="p-3 font-semibold text-slate-800">{doc.document_title}</td>
                    <td className="p-3 font-mono text-center font-bold text-slate-600">v{doc.version_number}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-500">{doc.filing_date}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300"
                          title="View Historical Record"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => downloadDocumentFile(doc)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300"
                          title="Download Historical Copy"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDoc && (
        <DocumentViewerDrawer doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </div>
  );
}
