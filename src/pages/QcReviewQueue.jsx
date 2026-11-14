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
  CheckSquare,
  ShieldAlert,
  ShieldCheck,
  Lock,
  ArrowRight,
  X
} from 'lucide-react';
import DocumentViewerDrawer from '../components/document/DocumentViewerDrawer';

const QC_CHECKLIST_SPECS = [
  { id: "correctStudy", label: "Correct Study", options: ["Pass", "Fail", "N/A"] },
  { id: "correctSite", label: "Correct Site", options: ["Pass", "Fail", "N/A"] },
  { id: "correctDocType", label: "Correct Document Type", options: ["Pass", "Fail", "N/A"] },
  { id: "documentLegible", label: "Document Legible", options: ["Pass", "Fail"] },
  { id: "completeDoc", label: "Complete Document", options: ["Pass", "Fail"] },
  { id: "requiredSignatures", label: "Required Signatures", options: ["Pass", "Fail", "N/A"] },
  { id: "signatureDates", label: "Signature Dates", options: ["Pass", "Fail", "N/A"] },
  { id: "correctVersion", label: "Correct Version", options: ["Pass", "Fail"] },
  { id: "correctMetadata", label: "Correct Metadata", options: ["Pass", "Fail"] },
  { id: "correctFilingLoc", label: "Correct Filing Location", options: ["Pass", "Fail"] }
];

export default function QcReviewQueue() {
  const { documents, selectedStudyId, activeStudy, performQcReview, raiseQuery } = useTMFData();
  const { 
    isDocumentInScope, 
    currentUser, 
    currentRole,
    hasPermission,
    canQcPass,
    canQcReject,
    canUpload
  } = useAuth();

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewerDefaultTab, setViewerDefaultTab] = useState("metadata");
  const [activeChecklistDoc, setActiveChecklistDoc] = useState(null);
  const [checklistAnswers, setChecklistAnswers] = useState(() => ({
    correctStudy: "Pass",
    correctSite: "Pass",
    correctDocType: "Pass",
    documentLegible: "Pass",
    completeDoc: "Pass",
    requiredSignatures: "Pass",
    signatureDates: "Pass",
    correctVersion: "Pass",
    correctMetadata: "Pass",
    correctFilingLoc: "Pass"
  }));
  const [qcOutcome, setQcOutcome] = useState("Accept"); // 'Accept' | 'Reject' | 'Request Correction'
  const [requiredCorrections, setRequiredCorrections] = useState("");
  const [reviewerRemarks, setReviewerRemarks] = useState("");
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

  const scopedDocs = documents.filter(d => {
    if (studyScopeMode === 'ACTIVE_STUDY' && d.study_id !== selectedStudyId) return false;
    return isDocumentInScope(d);
  });

  const assignedToMeCount = scopedDocs.filter(d =>
    (d.assigned_reviewer_id === currentUser?.id || d.assigned_reviewer_name === currentUser?.name) &&
    (d.qc_status === 'In Progress' || d.qc_status === 'Not Started' || d.status === 'Draft')
  ).length;

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
        (d.tmf_artifact_name || '').toLowerCase().includes(q) ||
        (d.submitted_by_name || '').toLowerCase().includes(q) ||
        (d.assigned_reviewer_name || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    if (statusFilter === 'ASSIGNED_TO_ME') {
      return (d.assigned_reviewer_id === currentUser?.id || d.assigned_reviewer_name === currentUser?.name) &&
        (d.qc_status === 'In Progress' || d.qc_status === 'Not Started' || d.status === 'Draft');
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

  const isDocSelfUploaded = (doc) => Boolean(
    (doc?.uploaded_by_id && currentUser?.id && doc.uploaded_by_id === currentUser.id) ||
    (doc?.submitted_by_id && currentUser?.id && doc.submitted_by_id === currentUser.id) ||
    (doc?.uploaded_by_name && currentUser?.name && doc.uploaded_by_name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
    (doc?.submitted_by_name && currentUser?.name && doc.submitted_by_name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
  );

  const openChecklistForDoc = (doc) => {
    if (isDocSelfUploaded(doc)) {
      showSuccessBanner('rose', 'Segregation of Duties Violation: You cannot QC a document you uploaded yourself (ICH GCP E6 / Maker-Checker Rule). Please assign an independent reviewer.');
      return;
    }
    setActiveChecklistDoc(doc);
    setChecklistAnswers({
      correctStudy: "Pass",
      correctSite: "Pass",
      correctDocType: "Pass",
      documentLegible: "Pass",
      completeDoc: "Pass",
      requiredSignatures: "Pass",
      signatureDates: "Pass",
      correctVersion: "Pass",
      correctMetadata: "Pass",
      correctFilingLoc: "Pass"
    });
    setQcOutcome("Accept");
    setRejectionReason("");
    setRequiredCorrections("");
    setReviewerRemarks("");
    setChecklistNotes(doc.qc_comments || "");
  };

  const handlePassQc = async (doc) => {
    if (!doc) return;
    if (isDocSelfUploaded(doc)) {
      showSuccessBanner('rose', 'Segregation of Duties Violation: You cannot approve a document you uploaded yourself (ICH GCP E6 / Maker-Checker Rule).');
      return;
    }
    if (!canQcPass) {
      showSuccessBanner('rose', `Authority Restriction: Your role (${currentRole?.name}) is not authorized to approve QC.`);
      return;
    }
    const passNotes = reviewerRemarks.trim() || checklistNotes.trim() || 'All 10 Quality Checks verified and accepted.';
    await performQcReview(doc.document_id, 'Passed', passNotes, null, currentUser);
    setActiveChecklistDoc(null);
    setChecklistNotes("");
    showSuccessBanner('emerald', `QC Passed & Approved: "${doc.document_title}" (${doc.document_id})`);
  };

  const handleExecuteQcDecision = async (decisionOutcome) => {
    if (!activeChecklistDoc) return;
    if (isDocSelfUploaded(activeChecklistDoc)) {
      showSuccessBanner('rose', 'Segregation of Duties Violation: You cannot render QC decisions on a document you uploaded yourself (ICH GCP E6 / Maker-Checker Rule).');
      return;
    }
    if (decisionOutcome === 'Accept') {
      await handlePassQc(activeChecklistDoc);
      return;
    }

    if (!canQcReject) {
      showSuccessBanner('rose', `Authority Restriction: Your role (${currentRole?.name}) is not authorized to reject or request corrections.`);
      return;
    }

    if (!rejectionReason.trim() && !requiredCorrections.trim()) {
      showSuccessBanner('rose', 'System Rule: QC Rejection or Correction requires a rejection category and required corrections comments.');
      return;
    }

    const finalNotes = `[${decisionOutcome}] Category: ${queryCategory} | Correction: ${requiredCorrections} | Remarks: ${reviewerRemarks || checklistNotes || 'Returned for rework'}`;
    const targetStatus = decisionOutcome === 'Reject' ? 'Rejected for Correction' : 'Correction Requested';

    await performQcReview(
      activeChecklistDoc.document_id,
      'Failed',
      finalNotes,
      targetStatus,
      currentUser
    );

    const title = activeChecklistDoc.document_title;
    const docId = activeChecklistDoc.document_id;
    setActiveChecklistDoc(null);
    showSuccessBanner('rose', `${decisionOutcome}: "${title}" (${docId}) returned to site team for remediation.`);
  };

  const handleConfirmReject = async () => {
    if (!activeChecklistDoc) return;
    if (!canQcReject) {
      showSuccessBanner('rose', `Authority Restriction: Your role (${currentRole?.name}) is not authorized to reject documents.`);
      return;
    }
    const finalReason = rejectionReason.trim() || checklistNotes.trim() || 'Document rejected during quality inspection and returned for correction.';
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
    showSuccessBanner('rose', `Rejected & Returned for Rework: "${docTitle}" (${docId})`);
  };

  const handleConfirmQuery = async () => {
    if (!activeChecklistDoc) return;
    if (!canQcReject) {
      showSuccessBanner('rose', `Authority Restriction: Your role (${currentRole?.name}) is not authorized to raise quality queries.`);
      return;
    }
    const finalComment = queryComment.trim() || checklistNotes.trim() || `Quality query raised under "${queryCategory}": please remediate and re-verify.`;
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
    showSuccessBanner('amber', `Formal Query Raised (${queryCategory}) on "${docTitle}" (${docId})`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 font-sans text-xs">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            {canQcPass ? 'Quality Control (QC) Clearance Queue & 14-Point Inspection' : 'Document QC Status & Quality Discrepancies'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            SOP-TMF-04 Quality Standard · 
            {canQcPass 
              ? ' You have Quality Approver authority to Pass, Reject, or Query clinical records.' 
              : ` Logged in as ${currentRole?.name}. Review document QC status, queries, and file resolutions.`}
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
              All In-Scope ({documents.filter(isDocumentInScope).length})
            </button>
            <button
              type="button"
              onClick={() => setStudyScopeMode('ACTIVE_STUDY')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                studyScopeMode === 'ACTIVE_STUDY' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {activeStudy?.id || 'Active Study'} Only
            </button>
          </div>
        </div>
      </div>

      {/* Role-Specific Regulatory Awareness Banner */}
      {!canQcPass && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start gap-3 text-amber-900 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">
              {currentUser?.roleId === 'site_user' ? 'Clinical Research Coordinator (CRC) / Site User View' : `${currentRole?.name} Workspace`}
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Under ICH-GCP E6(R2/R3) and SOP-TMF-04, <strong>QC Approval (Passing QC)</strong> and <strong>QC Rejection</strong> are restricted to Quality Assurance (QA) and TMF Management. As a <strong>{currentRole?.name}</strong>, you can inspect QC outcomes, view raised discrepancies, and submit revised file versions.
            </p>
          </div>
        </div>
      )}

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
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'PENDING', label: 'Pending QC Review', count: pendingCount },
              { id: 'ASSIGNED_TO_ME', label: 'Assigned to Me', count: assignedToMeCount },
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
                  statusFilter === tab.id ? 'bg-blue-700 text-white font-bold' : 'bg-white text-slate-500'
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
                <th className="p-3.5">Study & Site / Zone</th>
                <th className="p-3.5">Transmittal Routing</th>
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
                filteredDocs.map(d => {
                  const isAssignedToMe = d.assigned_reviewer_id === currentUser?.id || d.assigned_reviewer_name === currentUser?.name;
                  return (
                    <tr key={d.document_id} className={`hover:bg-slate-50/80 transition-colors ${isAssignedToMe ? 'bg-indigo-50/20' : ''}`}>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => { setViewerDefaultTab("qc"); setSelectedDoc(d); }}
                            className="font-bold text-blue-600 hover:underline cursor-pointer text-left block"
                          >
                            {d.document_title}
                          </button>
                          {isAssignedToMe && (
                            <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded text-[9px] font-bold">
                              Assigned to You
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {d.document_id} · v{d.version_number} {d.file_name ? `· ${d.file_name}` : ''}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <span className="font-semibold text-slate-800">{d.study_id}</span>
                        {d.site_id && (
                          <span className="text-[11px] text-slate-500 font-mono ml-1">· {d.site_id}</span>
                        )}
                        <span className="block text-[11px] text-slate-400">Zone {d.tmf_zone_id} → {d.tmf_artifact_id}</span>
                      </td>
                      <td className="p-3.5 text-slate-700 text-[11px]">
                        <div>
                          <span className="font-semibold text-slate-800">
                            {d.submitted_by_name || d.uploaded_by_name || 'Uploader'}
                          </span>
                          <span className="text-slate-400 text-[10px] block">
                            to {d.assigned_reviewer_name ? d.assigned_reviewer_name : 'TMF Lead'}
                          </span>
                          {d.submission_notes && (
                            <span className="text-[10px] text-slate-500 italic block truncate max-w-xs" title={d.submission_notes}>
                              "{d.submission_notes}"
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">{d.filing_date || 'N/A'}</td>
                      <td className="p-3.5">
                        <div className="flex flex-col items-start gap-1">
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
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Stage {d.lifecycle_stage || 6}/11
                          </span>
                        </div>
                      </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* QC Approver Buttons (QA, TMF Lead, CTM, Admin) */}
                        {canQcPass && (
                          <button
                            type="button"
                            onClick={() => handlePassQc(d)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-2xs cursor-pointer flex items-center gap-1 transition-colors"
                            title="One-Click Pass QC & Approve"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                          </button>
                        )}

                        {canQcReject && (
                          <>
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
                          </>
                        )}

                        {/* Non-Approver (CRC, CRA) Resolve Query Action */}
                        {!canQcPass && d.qc_status === 'Query Raised' && canUpload && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDoc(d);
                              setViewerDefaultTab("comments");
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-2xs cursor-pointer flex items-center gap-1 transition-colors"
                            title="View Query & Respond"
                          >
                            <HelpCircle className="w-3.5 h-3.5" /> Resolve Query
                          </button>
                        )}

                        {/* 14-Pt Checklist Button */}
                        <button
                          type="button"
                          onClick={() => openChecklistForDoc(d)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-semibold text-xs shadow-2xs cursor-pointer flex items-center gap-1 transition-colors"
                          title={canQcPass ? "Open 14-Point SOP-TMF-04 Checklist" : "Inspect 14-Point Checklist (Read-Only)"}
                        >
                          <ClipboardList className="w-3.5 h-3.5" /> {canQcPass ? '14-Pt QC' : 'Checklist'}
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
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QC Review Detailed Screen (Section 2.C: 3 Comprehensive Sections) */}
      {activeChecklistDoc && !showRejectDialog && !showQueryDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs font-sans my-auto">
            
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-sky-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">QC Review &amp; Quality Clearance Inspection</h3>
                  <p className="text-[10px] text-blue-200 font-mono">
                    SOP-TMF-04 Section 2.C Inspection Gate · {activeChecklistDoc.document_id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveChecklistDoc(null)}
                className="text-blue-200 hover:text-white cursor-pointer p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* SECTION 1: DOCUMENT INFORMATION (Exact fields from 2.C Section 1) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                  Section 1: Document Information
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Document ID</span>
                    <strong className="text-blue-700 font-mono">{activeChecklistDoc.document_id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Study ID</span>
                    <strong className="text-slate-800">{activeChecklistDoc.study_id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Site ID</span>
                    <strong className="text-slate-800">{activeChecklistDoc.site_id || 'Global'}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Document Name</span>
                    <strong className="text-slate-900 truncate block">{activeChecklistDoc.document_title}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Document Version</span>
                    <strong className="text-slate-800 font-mono">v{activeChecklistDoc.version_number}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Zone / Section / Artifact</span>
                    <span className="text-slate-700 font-mono text-[10px]">
                      Zone {activeChecklistDoc.tmf_zone_id} → {activeChecklistDoc.tmf_artifact_id} ({activeChecklistDoc.tmf_artifact_name})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Document Date</span>
                    <span className="text-slate-800 font-mono">{activeChecklistDoc.document_date || activeChecklistDoc.filing_date || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Uploaded By</span>
                    <strong className="text-slate-800">{activeChecklistDoc.uploaded_by_name || 'Site User'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Upload Timestamp</span>
                    <span className="text-slate-600 font-mono text-[10px]">
                      {activeChecklistDoc.filing_date ? activeChecklistDoc.filing_date : 'Registered'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: QC CHECKLIST (Exact 10 checks from 2.C Section 2) */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                      Section 2: 10-Point QC Verification Checklist
                    </span>
                    <p className="text-[11px] text-slate-500">
                      SOP-TMF-04 Mandatory quality inspection criteria for trial artifact acceptance
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const allPass = {};
                      QC_CHECKLIST_SPECS.forEach(item => { allPass[item.id] = "Pass"; });
                      setChecklistAnswers(allPass);
                    }}
                    className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Pass All 10
                  </button>
                </div>

                <div className="space-y-1.5 divide-y divide-slate-100">
                  {QC_CHECKLIST_SPECS.map((spec, idx) => {
                    const currentVal = checklistAnswers[spec.id] || "Pass";
                    return (
                      <div key={spec.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-800 font-medium">
                          <span className="text-slate-400 font-mono text-[10px] mr-1.5">#{idx + 1}</span>
                          {spec.label}
                        </span>

                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          {spec.options.map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setChecklistAnswers(prev => ({ ...prev, [spec.id]: opt }))}
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                currentVal === opt
                                  ? opt === 'Pass' ? 'bg-emerald-600 text-white shadow-xs' :
                                    opt === 'Fail' ? 'bg-rose-600 text-white shadow-xs' :
                                    'bg-slate-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: QC DECISION (Exact fields from 2.C Section 3) */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-slate-50/70">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                  Section 3: QC Review Decision &amp; Corrections
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">QC Reviewer</label>
                    <input
                      type="text"
                      disabled
                      value={`${currentUser.name} (${currentRole.name})`}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-800 font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">QC Review Date</label>
                    <input
                      type="text"
                      disabled
                      value={new Date().toISOString().split('T')[0]}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">QC Outcome *</label>
                    <select
                      value={qcOutcome}
                      onChange={(e) => setQcOutcome(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 focus:border-blue-500"
                    >
                      <option value="Accept">Accept (QC Clearance)</option>
                      <option value="Reject">Reject (Rework Required)</option>
                      <option value="Request Correction">Request Correction (Minor Clarification)</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Fields if Reject or Request Correction */}
                {qcOutcome !== 'Accept' && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-rose-700 uppercase mb-0.5">
                          Rejection Category *
                        </label>
                        <select
                          value={queryCategory}
                          onChange={(e) => setQueryCategory(e.target.value)}
                          className="w-full bg-white border border-rose-300 rounded px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-rose-500"
                        >
                          <option value="Missing Required Signature">Missing Required Signature</option>
                          <option value="Missing Document Pages / Incomplete Record">Missing Document Pages / Incomplete</option>
                          <option value="Incorrect Protocol or Site Assignment">Incorrect Protocol or Site Assignment</option>
                          <option value="Illegible OCR / Blurred Scanned Text">Illegible OCR / Blurred Scanned Text</option>
                          <option value="Incorrect DIA TMF Taxonomy Classification">Incorrect DIA TMF Classification</option>
                          <option value="Signature Dates Inconsistent / Post-Dated">Signature Dates Inconsistent</option>
                          <option value="Version Sequence Discrepancy">Version Sequence Discrepancy</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-rose-700 uppercase mb-0.5">
                          Required Corrections *
                        </label>
                        <input
                          type="text"
                          value={requiredCorrections}
                          onChange={(e) => setRequiredCorrections(e.target.value)}
                          placeholder="e.g. Please obtain Dr. Jenkins signature on page 3 and re-upload."
                          className="w-full bg-white border border-rose-300 rounded px-2.5 py-1 text-xs focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Reviewer Remarks / Notes</label>
                  <textarea
                    rows={2}
                    value={reviewerRemarks}
                    onChange={(e) => setReviewerRemarks(e.target.value)}
                    placeholder="Document quality review observations, ALCOA+ verification notes..."
                    className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Modal Actions (Save QC Draft, Submit QC, Accept, Reject, Request Correction) */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveChecklistDoc(null)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold cursor-pointer"
              >
                Close
              </button>

              {canQcPass || canQcReject ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      showSuccessBanner('blue', 'QC Draft state saved locally.');
                      setActiveChecklistDoc(null);
                    }}
                    className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold shadow-2xs cursor-pointer"
                  >
                    Save QC Draft
                  </button>

                  {qcOutcome === 'Reject' && canQcReject && (
                    <button
                      type="button"
                      onClick={() => handleExecuteQcDecision('Reject')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Confirm Reject &amp; Return
                    </button>
                  )}

                  {qcOutcome === 'Request Correction' && canQcReject && (
                    <button
                      type="button"
                      onClick={() => handleExecuteQcDecision('Request Correction')}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4" /> Request Correction
                    </button>
                  )}

                  {qcOutcome === 'Accept' && canQcPass && (
                    <button
                      type="button"
                      onClick={() => handleExecuteQcDecision('Accept')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Accept &amp; Pass QC
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-600 text-[11px] bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>QC Review actions restricted to Quality Assurance (QA) and TMF Management.</span>
                </div>
              )}
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
                <X className="w-4 h-4" />
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
                <X className="w-4 h-4" />
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
    </div>
  );
}
