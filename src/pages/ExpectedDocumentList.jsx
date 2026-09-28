import React, { useState } from 'react';
import { useTMFData } from '../context/TMFDataContext';
import { FileSpreadsheet, CheckCircle2, AlertTriangle, Plus, Sparkles, Filter, Search, Eye, Upload } from 'lucide-react';
import AddPlaceholderModal from '../components/document/AddPlaceholderModal';
import DocumentViewerDrawer from '../components/document/DocumentViewerDrawer';
import UploadWizardModal from '../components/document/UploadWizardModal';

export default function ExpectedDocumentList() {
  const { documents, activeStudy, selectedStudyId } = useTMFData();
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showAddPlaceholder, setShowAddPlaceholder] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const studyDocs = documents.filter(d => d.study_id === selectedStudyId);
  const effectiveDocs = studyDocs.filter(d => d.status === 'Effective' || d.status === 'Approved');
  const missingPlaceholders = studyDocs.filter(d => d.status === 'Placeholder');
  const inReviewDocs = studyDocs.filter(d => d.status === 'Draft' || d.qc_status === 'In Progress');

  const filteredDocs = studyDocs.filter(d => {
    if (statusFilter === 'MISSING' && d.status !== 'Placeholder') return false;
    if (statusFilter === 'EFFECTIVE' && d.status !== 'Effective' && d.status !== 'Approved') return false;
    if (statusFilter === 'IN_REVIEW' && d.status !== 'Draft' && d.qc_status !== 'In Progress') return false;
    
    if (levelFilter === 'STUDY' && (d.site_id && d.site_id !== 'CENTRAL' && d.site_id !== 'SITE-01')) return false;
    if (levelFilter === 'SITE' && (!d.site_id || d.site_id === 'CENTRAL')) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        d.document_id.toLowerCase().includes(q) ||
        d.document_title.toLowerCase().includes(q) ||
        (d.tmf_artifact_name || '').toLowerCase().includes(q) ||
        (d.site_id || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full font-sans text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-700" />
            Expected Document List (EDL), File Plan & Gap Analysis Engine
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Module 6, 8 & 11: Dynamic tracking of Study-Level, Country-Level, and Site-Level required artifacts vs filed records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddPlaceholder(true)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Expected Placeholder
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3 py-1.5 bg-clinevo-blue hover:bg-blue-700 text-white rounded font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> Upload File to Fulfill Gap
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl space-y-1 border-l-4 border-l-blue-600">
          <span className="text-slate-500 text-xs font-mono">Total Expected Artifacts</span>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">{studyDocs.length + 12}</p>
          <span className="text-[10px] text-slate-500 font-mono">Based on Active File Plan</span>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 border-l-4 border-l-emerald-500">
          <span className="text-slate-500 text-xs font-mono">Filed & Effective</span>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono">{effectiveDocs.length}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">
            {Math.round((effectiveDocs.length / (studyDocs.length || 1)) * 100)}% Milestone Completeness
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 border-l-4 border-l-rose-500">
          <span className="text-slate-500 text-xs font-mono">Missing Placeholders (Gaps)</span>
          <p className="text-2xl font-extrabold text-rose-600 font-mono">{missingPlaceholders.length}</p>
          <span className="text-[10px] text-rose-700 font-semibold">Immediate Action Required</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-amber-500 space-y-1">
          <span className="text-slate-500 text-xs font-mono">Drafts / In Review</span>
          <p className="text-2xl font-extrabold text-amber-700 font-mono">{inReviewDocs.length}</p>
          <span className="text-[10px] text-amber-700 font-semibold">QC Pending</span>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search EDL artifacts by Title, ID, or Site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded pl-9 pr-3 py-1.5 focus:border-blue-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-semibold">Level Scope:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
            >
              <option value="ALL">All Levels</option>
              <option value="STUDY">Study-Level Only</option>
              <option value="SITE">Site-Level Only</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-semibold">EDL Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="MISSING">Missing Gaps (Placeholders)</option>
              <option value="EFFECTIVE">Filed & Effective</option>
              <option value="IN_REVIEW">In Review / QC</option>
            </select>
          </div>
        </div>
      </div>

      {/* EDL Table */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            Expected Document Gap Matrix — {activeStudy.id} ({activeStudy.shortName})
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">Showing {filteredDocs.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-mono text-[11px] uppercase">
                <th className="p-3">Expected Artifact Name</th>
                <th className="p-3">TMF Zone</th>
                <th className="p-3">Level Scope</th>
                <th className="p-3">Milestone Binding</th>
                <th className="p-3">Current Lifecycle Status</th>
                <th className="p-3">EDL Gap Compliance</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredDocs.map(d => (
                <tr key={d.document_id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <button
                      onClick={() => setSelectedDoc(d)}
                      className="font-bold text-slate-900 hover:text-blue-700 text-left block"
                    >
                      {d.document_title}
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">{d.document_id}</span>
                  </td>
                  <td className="p-3 font-mono text-slate-600">
                    Zone {d.tmf_zone_id} → {d.tmf_artifact_id}
                  </td>
                  <td className="p-3 font-mono text-slate-600">
                    {d.site_id ? `Site: ${d.site_id}` : 'Study Central'}
                  </td>
                  <td className="p-3 text-slate-600">
                    {d.regulatory_binding_flag ? 'Site Activation (Mandatory)' : 'Routine Trial Monitoring'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      d.status === 'Effective' || d.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      d.status === 'Placeholder' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                      'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-xs">
                    {d.status === 'Effective' || d.status === 'Approved' ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% (Filed)
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> 0% (Missing Gap)
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedDoc(d)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 text-xs font-semibold cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddPlaceholder && <AddPlaceholderModal onClose={() => setShowAddPlaceholder(false)} />}
      {showUploadModal && <UploadWizardModal onClose={() => setShowUploadModal(false)} />}
      {selectedDoc && <DocumentViewerDrawer doc={selectedDoc} onClose={() => setSelectedDoc(null)} />}
    </div>
  );
}
