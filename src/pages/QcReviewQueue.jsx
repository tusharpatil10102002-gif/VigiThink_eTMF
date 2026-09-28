import React, { useState } from 'react';
import { useTMFData } from '../context/TMFDataContext';
import { useAuth } from '../context/AuthContext';
import { 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  FileText, 
  Search,
  Eye,
  Upload,
  CheckSquare
} from 'lucide-react';
import DocumentViewerDrawer from '../components/document/DocumentViewerDrawer';
import UploadWizardModal from '../components/document/UploadWizardModal';

const QC_CHECKLIST_ITEMS = [
  "Correct Study & Protocol Number",
  "Correct Country & Site Assignment",
  "Correct DIA TMF Zone & Artifact Classification",
  "Correct Essential Document Tag",
  "Correct Version Sequence (v1.0, v2.0)",
  "Correct Document Generation & Filing Date",
  "Complete Record (No missing pages or attachments)",
  "Full Legibility & Clear OCR Text",
  "Required Investigator & Sponsor Signatures",
  "Mandatory Clinical Metadata Populated",
  "Duplicate Check Verified (Unique SHA-256)",
  "Correct Filing Repository Path",
  "Subject Privacy Redaction (No PHI/PII)",
  "Certified True Copy Verified (If scanned paper)"
];

export default function QcReviewQueue() {
  const { documents, selectedStudyId, activeStudy, performQcReview, raiseQuery } = useTMFData();
  const { isDocumentInScope, currentUser, hasPermission } = useAuth();

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewerDefaultTab, setViewerDefaultTab] = useState("metadata");
  const [activeChecklistDoc, setActiveChecklistDoc] = useState(null);
  const [checkedItems, setCheckedItems] = useState(() => QC_CHECKLIST_ITEMS.map(() => true));
  const [checklistNotes, setChecklistNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showQueryDialog, setShowQueryDialog] = useState(false);
  const [queryCategory, setQueryCategory] = useState("Missing Required Signature");
  const [queryComment, setQueryComment] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING"); // 'PENDING' | 'PASSED' | 'QUERY' | 'REJECTED' | 'ALL'
  const [studyScopeMode, setStudyScopeMode] = useState("ALL"); // 'ALL' | 'ACTIVE_STUDY'
  const [searchText, setSearchText] = useState("");
  const [feedbackBanner, setFeedbackBanner] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const scopedDocs = documents.filter(d => {
    if (studyScopeMode === 'ACTIVE_STUDY' && d.study_id !== selectedStudyId) return false;
    return isDocumentInScope(d);
  });

  const pendingCount = scopedDocs.filter(d =>
    d.qc_status === 'In Progress' || d.qc_status === 'Not Started' || d.status === 'Draft'
  ).length;
  const queryCount = scopedDocs.filter(d => d.qc_status === 'Query Raised').length;
  const passedCount = scopedDocs.filter(d => d.qc_status === 'Passed' || d.status === 'Approved' || d.status === 'Effective').length;
  const rejectedCount = scopedDocs.filter(d => d.qc_status === 'Failed' || d.status === 'Rejected/Correction').length;

  const filteredDocs = scopedDocs.filter(d => {
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const match =
        (d.document_id || '').toLowerCase().includes(q) ||
        (d.document_title || '').toLowerCase().includes(q) ||
        (d.tmf_artifact_name || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    if (statusFilter === 'PENDING') {
      return d.qc_status === 'In Progress' || d.qc_status === 'Not Started' || d.status === 'Draft';
    }
    if (statusFilter === 'QUERY') {
      return d.qc_status === 'Query Raised';
    }
    if (statusFilter === 'PASSED') {
      return d.qc_status === 'Passed' || d.status === 'Approved' || d.status === 'Effective';
    }
    if (statusFilter === 'REJECTED') {
      return d.qc_status === 'Failed' || d.status === 'Rejected/Correction';
    }
    return true;
  });

  const showSuccessBanner = (type, text) => {
    setFeedbackBanner({ type, text });
    setTimeout(() => setFeedbackBanner(null), 5000);
  };

  const openChecklistForDoc = (doc) => {
    setActiveChecklistDoc(doc);
    setCheckedItems(QC_CHECKLIST_ITEMS.map(() => true));
    setChecklistNotes(doc.qc_comments || "");
  };

  const handlePassQc = async (doc) => {
    if (!doc) return;
    const passNotes = checklistNotes.trim() || 'All 14 SOP-TMF-04 Quality Checks passed and verified successfully.';
    await performQcReview(doc.document_id, 'Passed', passNotes, null, currentUser);
    setActiveChecklistDoc(null);
    setChecklistNotes("");
    showSuccessBanner('emerald', `✓ QC Passed & Approved: "${doc.document_title}" (${doc.document_id})`);
  };

  const handleConfirmReject = async () => {
    if (!activeChecklistDoc) return;
    const finalReason = rejectionReason.trim() || checklistNotes.trim() || 'Document rejected during SOP-TMF-04 quality inspection and returned for correction.';
    await performQcReview(
      activeChecklistDoc.document_id, 
      'Failed', 
      `Rejected & Returned for Rework: ${finalReason}`, 
      'Rejected for Correction', 
      currentUser
    );
    const docTitle = activeChecklistDoc.document_title;
    const docId = activeChecklistDoc.document_id;
    setShowRejectDialog(false);
    setActiveChecklistDoc(null);
    setRejectionReason("");
    setChecklistNotes("");
    showSuccessBanner('rose', `✕ Rejected & Returned for Rework: "${docTitle}" (${docId})`);
  };

  const handleConfirmQuery = async () => {
    if (!activeChecklistDoc) return;
    const finalComment = queryComment.trim() || checklistNotes.trim() || `Quality query raised under "${queryCategory}" — please remediate and re-verify.`;
    await raiseQuery({
      document_id: activeChecklistDoc.document_id,
      study_id: activeChecklistDoc.study_id || selectedStudyId,
      issue_type: queryCategory,
      comment: finalComment
    }, currentUser);
    const docTitle = activeChecklistDoc.document_title;
    const docId = activeChecklistDoc.document_id;
    setShowQueryDialog(false);
    setActiveChecklistDoc(null);
    setQueryComment("");
    setChecklistNotes("");
    showSuccessBanner('amber', `⚠️ Formal Query Raised (${queryCategory}) on "${docTitle}" (${docId})`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 font-sans text-xs">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Quality Control (QC) Review Queue & 14-Point Inspection
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            SOP-TMF-04 Quality Clearance · Pass, Query, or Reject uploaded documents with 21 CFR Part 11 audit logging
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setStudyScopeMode('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                studyScopeMode === 'ALL' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Studies ({documents.filter(isDocumentInScope).length})
            </button>
            <button
              type="button"
              onClick={() => setStudyScopeMode('ACTIVE_STUDY')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                studyScopeMode === 'ACTIVE_STUDY' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {activeStudy.id} Only
            </button>
          </div>

          {hasPermission('upload') && (
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Document for QC
            </button>
          )}
        </div>
      </div>

      {/* Live Feedback Toast / Banner */}
      {feedbackBanner && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-2xs ${
          feedbackBanner.type === 'emerald'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : feedbackBanner.type === 'amber'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{feedbackBanner.text}</span>
          <button onClick={() => setFeedbackBanner(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'PENDING', label: 'Pending QC Review', count: pendingCount },
              { id: 'QUERY', label: 'Queries Raised', count: queryCount },
              { id: 'PASSED', label: 'Passed / Approved', count: passedCount },
              { id: 'REJECTED', label: 'Rejected / Rework', count: rejectedCount },
              { id: 'ALL', label: 'All Documents', count: scopedDocs.length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  statusFilter === tab.id ? 'bg-blue-700 text-white' : 'bg-white text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search QC queue..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-3.5">Document Title & ID</th>
                <th className="p-3.5">Study & Zone</th>
                <th className="p-3.5">Uploaded By</th>
                <th className="p-3.5">Filing Date</th>
                <th className="p-3.5">Current QC Status</th>
                <th className="p-3.5 text-right">QC Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 space-y-3">
                    <p>No documents found in this QC filter view.</p>
                    {scopedDocs.length > 0 && statusFilter !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => setStatusFilter('ALL')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-blue-600 rounded-lg font-semibold text-xs cursor-pointer"
                      >
                        Show All {scopedDocs.length} Documents
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredDocs.map(d => (
                  <tr key={d.document_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() => { setViewerDefaultTab("qc"); setSelectedDoc(d); }}
                        className="font-bold text-blue-600 hover:underline cursor-pointer text-left block"
                      >
                        {d.document_title}
                      </button>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {d.document_id} · v{d.version_number} {d.file_name ? `· ${d.file_name}` : ''}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <span className="font-semibold text-slate-800">{d.study_id}</span>
                      <span className="block text-[11px] text-slate-400">Zone {d.tmf_zone_id} → {d.tmf_artifact_id}</span>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">
                      {d.uploaded_by_name || 'Clinidea User'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{d.filing_date || '—'}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        d.qc_status === 'Passed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : d.qc_status === 'Query Raised'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : d.qc_status === 'Failed'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {d.qc_status || 'In Progress'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Quick 1-Click Pass Button */}
                        <button
                          type="button"
                          onClick={() => handlePassQc(d)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-2xs cursor-pointer flex items-center gap-1 transition-colors"
                          title="One-Click Pass QC & Approve"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                        </button>

                        {/* Quick Query Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveChecklistDoc(d);
                            setShowQueryDialog(true);
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-xs shadow-2xs cursor-pointer flex items-center gap-1 transition-colors"
                          title="Raise Quality Query"
                        >
                          <HelpCircle className="w-3.5 h-3.5" /> Query
                        </button>

                        {/* Quick Reject Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveChecklistDoc(d);
                            setShowRejectDialog(true);
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs shadow-2xs cursor-pointer flex items-center gap-1 transition-colors"
                          title="Reject & Return for Rework"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>

                        {/* Full 14-Pt Checklist Modal Button */}
                        <button
                          type="button"
                          onClick={() => openChecklistForDoc(d)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-2xs cursor-pointer flex items-center gap-1 transition-colors"
                          title="Open 14-Point SOP-TMF-04 Checklist"
                        >
                          <ClipboardList className="w-3.5 h-3.5" /> 14-Pt QC
                        </button>

                        {/* View File Button */}
                        <button
                          type="button"
                          onClick={() => { setViewerDefaultTab("qc"); setSelectedDoc(d); }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 text-xs font-medium cursor-pointer flex items-center gap-1 transition-colors"
                          title="Open Document Viewer & QC Panel"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
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

      {/* 14-Point QC Review Checklist Modal */}
      {activeChecklistDoc && !showRejectDialog && !showQueryDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden text-xs font-sans">
            
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">SOP-TMF-04 Mandatory 14-Point QC Inspection</h3>
                  <p className="text-[11px] text-slate-500">
                    {activeChecklistDoc.document_id} — {activeChecklistDoc.document_title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveChecklistDoc(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div><span className="text-slate-400 block">Protocol:</span> <strong className="text-slate-800">{activeChecklistDoc.study_id}</strong></div>
                <div><span className="text-slate-400 block">Site / Country:</span> <strong className="text-slate-800">{activeChecklistDoc.site_id} ({activeChecklistDoc.country_code})</strong></div>
                <div><span className="text-slate-400 block">TMF Artifact:</span> <strong className="text-slate-800">{activeChecklistDoc.tmf_artifact_id}</strong></div>
                <div><span className="text-slate-400 block">Version:</span> <strong className="text-slate-800">v{activeChecklistDoc.version_number}</strong></div>
                <div><span className="text-slate-400 block">Uploaded By:</span> <strong className="text-slate-800">{activeChecklistDoc.uploaded_by_name || 'User'}</strong></div>
                <div><span className="text-slate-400 block">Current QC:</span> <strong className="text-blue-600">{activeChecklistDoc.qc_status}</strong></div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">
                    Verify All 14 Quality Criteria ({checkedItems.filter(Boolean).length}/14 Checked):
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const allOn = checkedItems.every(Boolean);
                      setCheckedItems(QC_CHECKLIST_ITEMS.map(() => !allOn));
                    }}
                    className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    {checkedItems.every(Boolean) ? 'Uncheck All' : 'Select All 14'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {QC_CHECKLIST_ITEMS.map((item, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        checkedItems[idx]
                          ? 'bg-blue-50/50 border-blue-200 text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems[idx]}
                        onChange={() => setCheckedItems(prev => prev.map((v, i) => (i === idx ? !v : v)))}
                        className="accent-blue-600 rounded cursor-pointer"
                      />
                      <span className="text-[11px] font-medium">#{idx + 1}: {item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">QC Inspection Notes (Optional):</label>
                <textarea
                  rows={2}
                  value={checklistNotes}
                  onChange={(e) => setChecklistNotes(e.target.value)}
                  placeholder="Add optional reviewer notes or observations..."
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveChecklistDoc(null)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowRejectDialog(true)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject & Return
                </button>
                <button
                  type="button"
                  onClick={() => setShowQueryDialog(true)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" /> Raise Query
                </button>
                <button
                  type="button"
                  onClick={() => handlePassQc(activeChecklistDoc)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Pass QC & Approve
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Reject Reason Dialog (z-[60] so it always renders on top) */}
      {showRejectDialog && activeChecklistDoc && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                Reject Document & Return for Rework
              </h3>
              <button
                type="button"
                onClick={() => setShowRejectDialog(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-600">
              Document: <strong className="text-slate-900">{activeChecklistDoc.document_title}</strong> ({activeChecklistDoc.document_id})
            </p>
            
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Rejection Rationale / Defect Finding:</label>
              <textarea
                rows={3}
                placeholder="e.g. Missing PI signature on page 2; incorrect site number..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-rose-500 rounded-lg p-2.5 text-xs focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRejectDialog(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-2xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Query Category Dialog (z-[60] so it always renders on top) */}
      {showQueryDialog && activeChecklistDoc && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                Raise Formal Quality Query
              </h3>
              <button
                type="button"
                onClick={() => setShowQueryDialog(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-600">
              Document: <strong className="text-slate-900">{activeChecklistDoc.document_title}</strong> ({activeChecklistDoc.document_id})
            </p>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Query Category:</label>
              <select
                value={queryCategory}
                onChange={(e) => setQueryCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:border-amber-500 text-xs focus:outline-none"
              >
                <option value="Missing Required Signature">Missing Required Signature</option>
                <option value="Incorrect Site Number">Incorrect Site Number</option>
                <option value="Illegible Document Scan">Illegible Document Scan</option>
                <option value="Unredacted Subject Information (PHI)">Unredacted Subject Information (PHI)</option>
                <option value="Incorrect TMF Artifact Classification">Incorrect TMF Artifact Classification</option>
                <option value="Duplicate File Upload Detected">Duplicate File Upload Detected</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Detailed Findings / Action Required:</label>
              <textarea
                rows={3}
                placeholder="Specify what the CRA or site user needs to remediate..."
                value={queryComment}
                onChange={(e) => setQueryComment(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-amber-500 rounded-lg p-2.5 text-xs focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowQueryDialog(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmQuery}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold shadow-2xs cursor-pointer"
              >
                Submit Query
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Drawer */}
      {selectedDoc && (
        <DocumentViewerDrawer
          doc={selectedDoc}
          defaultTab={viewerDefaultTab}
          onClose={() => setSelectedDoc(null)}
        />
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <UploadWizardModal
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={(uploadedDoc) => {
            setShowUploadModal(false);
            showSuccessBanner('emerald', `✓ Document "${uploadedDoc.document_title}" uploaded and added to QC Queue!`);
          }}
        />
      )}
    </div>
  );
}
