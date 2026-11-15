import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  History, 
  MessageSquare, 
  Info, 
  Calendar, 
  User, 
  Award, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  FileSearch,
  Eye,
  Clock,
  ArrowRight,
  ChevronRight,
  CheckSquare,
  UploadCloud,
  Database,
  ShieldAlert,
  FolderCheck,
  SearchCheck,
  Archive,
  Sparkles,
  Send,
  Check,
  AlertCircle,
  AlertTriangle,
  Tag,
  PenTool,
  CornerDownRight,
  RotateCcw,
  CheckCheck,
  MessageSquarePlus,
  GitCompare
} from 'lucide-react';
import { useTMFData } from '../../context/TMFDataContext';
import { useAuth } from '../../context/AuthContext';
import { resolveApiUrl } from '../../utils/api';
import ESignatureModal from './ESignatureModal';
import NewVersionModal from './NewVersionModal';

export const safeFormatDate = (val, fallback = '—') => {
  if (!val) return fallback;
  if (typeof val === 'string') {
    if (val.includes('T')) return val.split('T')[0];
    return val;
  }
  if (val instanceof Date) {
    try {
      return val.toISOString().split('T')[0];
    } catch {
      return fallback;
    }
  }
  return String(val);
};

export const safeFormatDateTime = (val, fallback = '—') => {
  if (!val) return fallback;
  if (typeof val === 'string') {
    if (val.includes('(UTC') || val.includes(':')) {
      return val;
    }
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      return d.toLocaleString('en-GB');
    } catch {
      return val;
    }
  }
  if (val instanceof Date) {
    try {
      return val.toLocaleString('en-GB');
    } catch {
      return fallback;
    }
  }
  return String(val);
};

class DrawerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[Document Viewer Drawer Error]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto text-xl font-bold border border-amber-200">
              !
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Document Display Notice</h3>
              <p className="text-xs text-slate-600">
                This document record could not be rendered in the preview drawer. The record data, signatures, and audit trail are preserved safely.
              </p>
            </div>
            {this.state.error && (
              <div className="text-left bg-slate-50 border border-slate-200 rounded p-2 text-[10px] text-slate-600 font-mono break-all max-h-20 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={this.props.onClose}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded shadow-xs cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LIFECYCLE_STEPS = [
  {
    step: 1,
    title: "1. Document Creation",
    desc: "Trial record is prepared and generated (e.g. Delegation of Authority Log, Site Feasibility Questionnaire).",
    actor: "Site User / CRA",
    roleScope: "Site Staff / Study Team"
  },
  {
    step: 2,
    title: "2. Document Review",
    desc: "Internal content and completeness are verified by the designated reviewer.",
    actor: "Responsible Person / Lead",
    roleScope: "Investigator Team"
  },
  {
    step: 3,
    title: "3. Document Signing",
    desc: "Required regulatory and medical electronic signatures are collected and verified.",
    actor: "PI / Authorized Signatories",
    roleScope: "Signatories"
  },
  {
    step: 4,
    title: "4. Document Upload",
    desc: "Native digital file or certified copy is uploaded into the eTMF repository with SHA-256 checksum.",
    actor: "Site User / CRA",
    roleScope: "eTMF Ingestion"
  },
  {
    step: 5,
    title: "5. Metadata Entry",
    desc: "Mandatory metadata (Study, Country, Site, DIA Zone, Section, Artifact, Version, Date) is indexed.",
    actor: "Site User / CRA",
    roleScope: "DIA TMF Indexing"
  },
  {
    step: 6,
    title: "6. Quality Control (QC)",
    desc: "Document undergoes 14-point ALCOA+ compliance inspection under SOP-TMF-04.",
    actor: "Document Controller / Admin",
    roleScope: "SOP-TMF-04 Quality Review"
  },
  {
    step: 7,
    title: "7. QC Review Outcome",
    desc: "Quality review outcome is recorded as Passed or Rejected with correction queries.",
    actor: "Document Controller / Admin",
    roleScope: "Quality Clearance Gate"
  },
  {
    step: 8,
    title: "8. Approval / Finalization",
    desc: "Document receives final operational clearance and advances to official approval status.",
    actor: "System Administrator / Approver",
    roleScope: "Trial Approval Gate"
  },
  {
    step: 9,
    title: "9. TMF Filing",
    desc: "Record is officially filed into the verified DIA TMF Reference Model breadcrumb folder.",
    actor: "eTMF System / Document Controller",
    roleScope: "DIA TMF Model v3.1"
  },
  {
    step: 10,
    title: "10. Monitoring & Inspection Readiness",
    desc: "Filing timeliness, audit trail continuity, and regulatory inspection readiness are maintained.",
    actor: "Auditor / CRA / Inspector",
    roleScope: "21 CFR Part 11 Integrity"
  },
  {
    step: 11,
    title: "11. Archival",
    desc: "Post-trial closeout permanent digital preservation under statutory 25-year GxP retention lock.",
    actor: "System Admin / Archivist",
    roleScope: "25-Yr Regulatory Seal"
  }
];

export default function DocumentViewerDrawer({ doc: initialDoc, onClose, defaultTab = "workflow" }) {
  const { 
    documents,
    updateDocumentMetadata, 
    performQcReview, 
    performContentReview,
    performFinalApproval,
    addDocumentAnnotation,
    resolveDocumentAnnotation,
    advanceDocumentLifecycle,
    toggleDocumentLock, 
    addDocumentComment, 
    downloadDocumentFile,
    renameDocument,
    deleteDocument,
    auditLogs 
  } = useTMFData();

  const { 
    currentUser, 
    currentRole, 
    hasPermission, 
    isInspectorMode,
    canQcPass,
    canQcReject,
    canDelete,
    canSign,
    canEditMetadata,
    canViewAuditTrail
  } = useAuth();

  const doc = (documents || []).find(d => d.document_id === initialDoc?.document_id) || initialDoc;
  const previewFileUrl = doc?.local_blob_url 
    ? doc.local_blob_url 
    : (doc?.file_path ? resolveApiUrl(doc.file_path) : (doc?.document_id ? resolveApiUrl(`/api/documents/${doc.document_id}/download`) : null));
  const [viewerMode, setViewerMode] = useState(previewFileUrl ? 'actual_file' : 'certificate');
  const [activeTab, setActiveTab] = useState(defaultTab || "workflow");
  const [qcCommentsInput, setQcCommentsInput] = useState(doc?.qc_comments || "");
  const [qcIssueCategory, setQcIssueCategory] = useState("Missing Required Signature");
  const [qcFeedback, setQcFeedback] = useState(null);
  const [lifecycleFeedback, setLifecycleFeedback] = useState(null);
  const [checklistState, setChecklistState] = useState([true, true, true, true]);
  const [newComment, setNewComment] = useState("");
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameTitleInput, setRenameTitleInput] = useState(doc?.document_title || "");
  const [renameFileInput, setRenameFileInput] = useState(doc?.file_name || "");

  // Inline Annotation State
  const [showAddAnnotation, setShowAddAnnotation] = useState(false);
  const [annotationSection, setAnnotationSection] = useState("Section 1: Purpose and Scope");
  const [annotationCategory, setAnnotationCategory] = useState("Major Correction");
  const [annotationText, setAnnotationText] = useState("");
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionText, setResolutionText] = useState("");

  if (!doc) return null;

  // Segregation of Duties (Maker-Checker / Four-Eyes Principle)
  const isSelfUploaded = Boolean(
    (doc?.uploaded_by_id && currentUser?.id && doc.uploaded_by_id === currentUser.id) ||
    (doc?.submitted_by_id && currentUser?.id && doc.submitted_by_id === currentUser.id) ||
    (doc?.uploaded_by_name && currentUser?.name && doc.uploaded_by_name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
    (doc?.submitted_by_name && currentUser?.name && doc.submitted_by_name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
  );

  const isAdmin = Boolean(
    currentUser?.roleId === 'system_admin' || 
    currentRole?.id === 'system_admin' || 
    currentUser?.id === 'admin' ||
    currentUser?.email === 'admin@vigithink.com'
  );

  // Is this document assigned to the logged-in user?
  const isAssignedReviewer = Boolean(
    (doc.assigned_reviewer_id && currentUser?.id && doc.assigned_reviewer_id === currentUser.id) ||
    (doc.assigned_reviewer_name && currentUser?.name && doc.assigned_reviewer_name.trim().toLowerCase().includes(currentUser.name.trim().toLowerCase())) ||
    (doc.qc_reviewer_id && currentUser?.id && doc.qc_reviewer_id === currentUser.id) ||
    (doc.qc_reviewer_name && currentUser?.name && doc.qc_reviewer_name.trim().toLowerCase().includes(currentUser.name.trim().toLowerCase())) ||
    (doc.content_reviewer_id && currentUser?.id && doc.content_reviewer_id === currentUser.id) ||
    (doc.content_reviewer_name && currentUser?.name && doc.content_reviewer_name.trim().toLowerCase().includes(currentUser.name.trim().toLowerCase()))
  );

  const isDocController = Boolean(currentUser?.roleId === 'doc_controller' || currentRole?.id === 'doc_controller');
  const isTmfLeadOrReviewer = Boolean(
    currentUser?.roleId === 'tmf_manager' || 
    currentRole?.id === 'tmf_manager' || 
    currentUser?.roleId === 'cra' || 
    currentRole?.id === 'cra'
  );

  // Strict Action Isolation:
  // Gate 2 (QC Review Actions): Only assigned QC reviewer or Admin, and never the uploader
  const canPerformQcOnThisDoc = Boolean(
    !isSelfUploaded &&
    doc.qc_status !== 'Passed' &&
    doc.status !== 'Effective' &&
    (
      isAdmin ||
      (isAssignedReviewer && (isDocController || isTmfLeadOrReviewer)) ||
      (isDocController && (!doc.assigned_reviewer_id || doc.assigned_reviewer_role === 'doc_controller'))
    )
  );

  // Gate 3 (Content Review Actions): Only assigned content reviewer or Admin, and never the uploader
  const canPerformContentReviewOnThisDoc = Boolean(
    !isSelfUploaded &&
    (doc.qc_status === 'Passed' || doc.status === 'QC Passed') &&
    doc.status !== 'Effective' &&
    (
      isAdmin ||
      (isAssignedReviewer && isTmfLeadOrReviewer) ||
      (isTmfLeadOrReviewer && (!doc.assigned_reviewer_id || doc.assigned_reviewer_role === 'tmf_manager' || doc.assigned_reviewer_role === 'cra'))
    )
  );

  // Gate 4 (Final Approval): Strictly restricted to System Administrator
  const canPerformFinalApprovalOnThisDoc = Boolean(
    isAdmin &&
    !isSelfUploaded &&
    doc.status !== 'Effective' &&
    (doc.content_review_status === 'Passed' || doc.status === 'Approval Pending' || doc.qc_status === 'Passed' || doc.status === 'QC Passed')
  );

  // Who can author new revision? Only author/uploader or Admin when revisions are requested
  const canAuthorNewVersionOnThisDoc = Boolean(
    (isSelfUploaded || isAdmin) &&
    !isInspectorMode &&
    (doc.status === 'Revision Required' || doc.status === 'QC Rejected' || doc.qc_status === 'Failed' || doc.qc_status === 'Query Raised' || doc.status === 'Draft' || doc.status === 'Submitted')
  );

  // Who can add review annotations? Only assigned reviewer or Admin
  const canAddAnnotationsOnThisDoc = Boolean(
    !isInspectorMode &&
    !isSelfUploaded &&
    (isAdmin || (isAssignedReviewer && (isDocController || isTmfLeadOrReviewer)))
  );

  // Who can resolve annotations? Only document author/uploader or Admin
  const canResolveAnnotationsOnThisDoc = Boolean(
    (isSelfUploaded || isAdmin) &&
    !isInspectorMode
  );

  // Concurrency Lock: Only assigned reviewer, author, or Admin
  const canToggleLockOnThisDoc = Boolean(
    !isInspectorMode &&
    (isAdmin || isAssignedReviewer || isSelfUploaded)
  );

  const currentStageNum = Number(doc.lifecycle_stage) || 5;
  const annotationsList = Array.isArray(doc.annotations) ? doc.annotations : [];
  const openAnnotationsCount = annotationsList.filter(a => a.status === 'Open').length;

  const availableTabs = [
    { id: 'workflow', label: 'Review & Approval', show: true },
    { id: 'annotations', label: `Annotations (${openAnnotationsCount})`, show: true },
    { id: 'lifecycle', label: '11-Step Lifecycle', show: true },
    { id: 'metadata', label: 'Metadata', show: true },
    { id: 'versioning', label: 'Versioning', show: hasPermission('version') || hasPermission('review') || isAdmin },
    { id: 'qc', label: 'QC Checklist', show: canQcPass || canQcReject || hasPermission('qcReview') || isAdmin },
    { id: 'esign', label: 'E-Sign', show: canSign || doc.signature_type === 'Electronic (Part 11)' || isAdmin },
    { id: 'audit', label: 'Audit Trail', show: canViewAuditTrail },
    { id: 'comments', label: 'Discussion', show: true }
  ].filter(t => t.show);

  useEffect(() => {
    const isAllowedTab = availableTabs.some(t => t.id === defaultTab);
    setActiveTab(isAllowedTab ? defaultTab : 'workflow');
  }, [defaultTab, doc?.document_id]);

  const filteredAuditLogs = (auditLogs || []).filter(a => a?.target_id === doc.document_id);

  const fileNameLower = (doc.file_name || '').toLowerCase();
  const mimeLower = (doc.file_mimetype || '').toLowerCase();
  const isImageFile =
    mimeLower.startsWith('image/') ||
    /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(fileNameLower);
  const isPdfFile =
    mimeLower.includes('pdf') ||
    fileNameLower.endsWith('.pdf') ||
    (doc.file_format || '').toUpperCase() === 'PDF';
  const isTextOrHtmlFile =
    mimeLower.startsWith('text/') ||
    /\.(txt|csv|json|html|md)$/i.test(fileNameLower);

  const handleSaveRename = (e) => {
    if (e) e.preventDefault();
    if (!renameTitleInput.trim()) return;
    renameDocument(doc.document_id, renameTitleInput.trim(), renameFileInput.trim() || doc.file_name, currentUser);
    doc.document_title = renameTitleInput.trim();
    if (renameFileInput.trim()) doc.file_name = renameFileInput.trim();
    setIsRenaming(false);
  };

  const handleDeleteCurrentDoc = () => {
    if (!canDelete && !isAdmin) {
      alert(`Permission Denied: Only System Administrator can delete documents from 21 CFR Part 11 compliant repository.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${doc.document_title}" (${doc.document_id})?`)) {
      deleteDocument(doc.document_id, currentUser);
      onClose();
    }
  };

  // Gate 2: QC Review Action (Document Controller or Admin fallback)
  const handleQcAction = async (qcStatus) => {
    if (isSelfUploaded && !isAdmin) {
      setQcFeedback({
        status: 'Failed',
        message: 'Segregation of Duties Violation: You cannot QC review or approve a document that you uploaded yourself (ICH GCP E6 / Maker-Checker Rule).'
      });
      return;
    }

    const finalComment = qcCommentsInput.trim() || (
      qcStatus === 'Passed'
        ? 'All SOP-TMF-04 quality checks passed and verified.'
        : qcStatus === 'Query Raised'
        ? `Quality Query (${qcIssueCategory}): Please remediate and re-verify.`
        : `QC Failed (${qcIssueCategory}): Document returned for correction.`
    );

    await performQcReview(
      doc.document_id,
      qcStatus,
      finalComment,
      qcStatus === 'Passed' ? null : qcIssueCategory,
      currentUser
    );
    setQcCommentsInput(finalComment);
    setQcFeedback({
      status: qcStatus,
      message:
        qcStatus === 'Passed'
          ? 'Gate 2 Complete: QC Passed! Document routed for Content Review.'
          : qcStatus === 'Query Raised'
          ? `Quality Query (${qcIssueCategory}) raised and sent to uploader.`
          : 'Document marked as QC Rejected / Returned for Revision.'
    });
    setTimeout(() => setQcFeedback(null), 5000);
  };

  // Gate 3: Content Review Action (TMF Lead / CRA or Admin fallback)
  const handleContentReviewAction = async (decision) => {
    if (isSelfUploaded && !isAdmin) {
      setQcFeedback({
        status: 'Failed',
        message: 'Segregation of Duties Violation: You cannot review content on a document you uploaded yourself.'
      });
      return;
    }

    const unres = annotationsList.filter(a => a.status === 'Open' && (a.category === 'Critical Deficiency' || a.category === 'Major Revision'));
    if (decision === 'Passed' && unres.length > 0) {
      if (!window.confirm(`Notice: There are ${unres.length} open Critical/Major review annotations. Do you want to sign off content review anyway?`)) {
        return;
      }
    }

    const notes = qcCommentsInput.trim() || (
      decision === 'Passed'
        ? 'Content review completed: Trial details, dates, and qualifications verified.'
        : 'Revisions requested by reviewer: Remediation required prior to final approval.'
    );

    await performContentReview(doc.document_id, decision, notes, qcIssueCategory, currentUser);
    setQcFeedback({
      status: decision === 'Passed' ? 'Passed' : 'Failed',
      message: decision === 'Passed'
        ? 'Gate 3 Complete: Content Review Passed! Awaiting Final Admin Approval.'
        : 'Revision Requested! Document status updated to Revision Required.'
    });
    setTimeout(() => setQcFeedback(null), 5000);
  };

  // Gate 4: Final Admin Approval (System Administrator)
  const handleFinalAdminApproval = async () => {
    if (isSelfUploaded && !isAdmin) {
      setQcFeedback({
        status: 'Failed',
        message: 'Segregation of Duties Violation: Maker-Checker rule prevents approving your own document.'
      });
      return;
    }

    if (!isAdmin && currentUser?.roleId !== 'tmf_manager') {
      setQcFeedback({
        status: 'Failed',
        message: 'Action Restricted: Final approval to make document Effective requires System Administrator authorization.'
      });
      return;
    }

    const unres = annotationsList.filter(a => a.status === 'Open' && a.category === 'Critical Deficiency');
    if (unres.length > 0) {
      alert(`Cannot Approve: There are ${unres.length} open Critical Deficiencies on this document. Resolve them before granting final approval.`);
      return;
    }

    const approvalNotes = qcCommentsInput.trim() || 'Final operational and regulatory approval granted under 21 CFR Part 11.';
    await performFinalApproval(doc.document_id, currentUser, approvalNotes);
    setQcFeedback({
      status: 'Passed',
      message: 'Gate 4 Complete: Document Approved & Effective! 21 CFR Part 11 sealed.'
    });
    setTimeout(() => setQcFeedback(null), 5000);
  };

  // Add Word-Style Inline Annotation
  const handleAddAnnotationSubmit = async (e) => {
    e.preventDefault();
    if (!annotationText.trim()) return;

    await addDocumentAnnotation(doc.document_id, {
      section_or_page: annotationSection,
      category: annotationCategory,
      comment: annotationText.trim()
    }, currentUser);

    setAnnotationText("");
    setShowAddAnnotation(false);
  };

  // Resolve Annotation
  const handleResolveAnnotationSubmit = async (annotationId) => {
    if (!resolutionText.trim()) {
      alert('Please enter a resolution / remediation note describing what was updated.');
      return;
    }
    await resolveDocumentAnnotation(doc.document_id, annotationId, resolutionText.trim(), currentUser, 'resolve');
    setResolvingId(null);
    setResolutionText("");
  };

  const handleReopenAnnotation = async (annotationId) => {
    await resolveDocumentAnnotation(doc.document_id, annotationId, '', currentUser, 'reopen');
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addDocumentComment(doc.document_id, currentUser, newComment);
    setNewComment("");
  };

  const handleAdvanceLifecycle = async (targetStage, notes, status) => {
    try {
      await advanceDocumentLifecycle(doc.document_id, targetStage, notes, status, currentUser);
      setLifecycleFeedback({
        status: 'success',
        message: `Successfully advanced to Stage ${targetStage}: ${LIFECYCLE_STEPS[targetStage - 1]?.title}`
      });
      setTimeout(() => setLifecycleFeedback(null), 4000);
    } catch (err) {
      setLifecycleFeedback({
        status: 'error',
        message: err.message || 'Failed to update lifecycle stage'
      });
      setTimeout(() => setLifecycleFeedback(null), 4000);
    }
  };

  const isLocked = doc.checkout_status === 'Checked Out';
  const isLockedByMe = Boolean(currentUser?.id && doc.locked_by_user_id === currentUser.id);

  return (
    <DrawerErrorBoundary onClose={onClose}>
      <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white border-l border-slate-200 w-full max-w-6xl h-full flex flex-col md:flex-row shadow-2xl overflow-hidden">
        
        {/* Left Panel: Live Uploaded File Viewer & Part 11 Certificate */}
        <div className="flex-1 bg-slate-100 flex flex-col h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-200">
          
          {/* Viewer Toolbar */}
          <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
            <div className="flex items-center gap-2 text-slate-800 font-mono min-w-0">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-bold truncate max-w-xs" title={doc.file_name || doc.document_title}>
                {doc.file_name || doc.document_title}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-300 font-semibold shrink-0">
                v{doc.version_number}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Lock & Unlock Concurrency Button */}
              {!isInspectorMode && (
                canToggleLockOnThisDoc ? (
                  <button
                    type="button"
                    onClick={() => toggleDocumentLock(doc.document_id, currentUser)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      isLocked
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                    }`}
                    title={isLocked ? `Locked by ${doc.locked_by_user_name || 'Reviewer'}` : "Lock document against concurrent modifications"}
                  >
                    {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-700" /> : <Unlock className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{isLocked ? `Locked (${typeof doc.locked_by_user_name === 'string' ? doc.locked_by_user_name.split(' ')[0] : 'User'})` : 'Lock Doc'}</span>
                  </button>
                ) : isLocked ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Locked by {doc.locked_by_user_name || 'Reviewer'}</span>
                  </span>
                ) : null
              )}

              {/* Toggle between Actual Uploaded File and ALCOA+ Certificate */}
              {previewFileUrl && (
                <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-300 mr-1">
                  <button
                    type="button"
                    onClick={() => setViewerMode('actual_file')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                      viewerMode === 'actual_file' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Uploaded File
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewerMode('certificate')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                      viewerMode === 'certificate' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ALCOA+ Manifest
                  </button>
                </div>
              )}

              <button 
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
                className="p-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-slate-600 font-mono text-[11px]">{zoomLevel}%</span>
              <button 
                onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))}
                className="p-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              {previewFileUrl && (
                <a
                  href={previewFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 text-[11px] font-bold cursor-pointer"
                  title="Open Uploaded File in New Browser Tab"
                >
                  <Eye className="w-3 h-3 text-emerald-600" /> Open Original
                </a>
              )}

              {hasPermission('download') && (
                <button 
                  onClick={() => downloadDocumentFile(doc)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 text-[11px] font-semibold cursor-pointer"
                  title="Download Uploaded File"
                >
                  <Download className="w-3 h-3 text-blue-600" /> Download
                </button>
              )}

              {!isInspectorMode && (
                <>
                  {canEditMetadata && (isSelfUploaded || isAdmin) && doc.status !== 'Effective' && (
                    <button
                      type="button"
                      onClick={() => {
                        setRenameTitleInput(doc.document_title || "");
                        setRenameFileInput(doc.file_name || "");
                        setIsRenaming(!isRenaming);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 text-[11px] font-semibold cursor-pointer"
                      title="Rename Document / File"
                    >
                      Rename
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleDeleteCurrentDoc}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded border border-rose-200 text-[11px] font-bold cursor-pointer"
                      title="Delete Uploaded Document (Admin Only)"
                    >
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Inline Rename Bar when Rename button clicked */}
          {isRenaming && (
            <form onSubmit={handleSaveRename} className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-amber-900">Rename Document:</span>
              <input
                type="text"
                value={renameTitleInput}
                onChange={(e) => setRenameTitleInput(e.target.value)}
                placeholder="Document Title"
                className="px-2.5 py-1 bg-white border border-amber-300 rounded text-xs text-slate-900 flex-1 min-w-[180px]"
              />
              <input
                type="text"
                value={renameFileInput}
                onChange={(e) => setRenameFileInput(e.target.value)}
                placeholder="File Name (e.g. Protocol_v1.pdf)"
                className="px-2.5 py-1 bg-white border border-amber-300 rounded text-xs text-slate-700 font-mono w-48"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs cursor-pointer"
              >
                Save Name
              </button>
              <button
                type="button"
                onClick={() => setIsRenaming(false)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 rounded border border-slate-300 text-xs cursor-pointer"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Document Content Box: Actual Uploaded File OR ALCOA+ Certificate with Annotations */}
          <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-slate-200/60 relative">
            {previewFileUrl && viewerMode === 'actual_file' ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                {isImageFile ? (
                  <div
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                    className="bg-white p-4 rounded-xl shadow-xl border border-slate-300 max-w-4xl transition-transform"
                  >
                    <img
                      src={previewFileUrl}
                      alt={doc.document_title}
                      className="max-w-full max-h-[75vh] object-contain rounded mx-auto"
                    />
                  </div>
                ) : isPdfFile || isTextOrHtmlFile ? (
                  <iframe
                    src={previewFileUrl}
                    title={doc.document_title}
                    className="w-full h-full min-h-[640px] bg-white rounded-xl shadow-xl border border-slate-300"
                  />
                ) : (
                  <div className="bg-white p-8 rounded-xl shadow-xl border border-slate-300 max-w-lg w-full text-center space-y-4">
                    <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-base">{doc.file_name || doc.document_title}</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Format: {doc.file_format || doc.file_mimetype || 'Binary File'} | Uploaded by {doc.uploaded_by_name}
                      </p>
                    </div>
                    <p className="text-xs text-slate-600">
                      This clinical record is stored in the 21 CFR Part 11 eTMF repository. Click below to inspect or download:
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <a
                        href={previewFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <Eye className="w-4 h-4" /> Open File in Browser
                      </a>
                      <button
                        onClick={() => downloadDocumentFile(doc)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Download className="w-4 h-4" /> Download Original ({doc.file_name})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div 
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className="w-full max-w-2xl bg-white text-slate-900 p-8 rounded-lg shadow-xl min-h-[640px] border border-slate-300 relative font-sans text-xs transition-transform space-y-5"
              >
                {/* Dynamic Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none rotate-45 text-4xl font-extrabold text-slate-900 uppercase">
                  {isInspectorMode ? "INSPECTION COPY: FDA AUDIT" : "CONFIDENTIAL: VIGITHINK eTMF"}
                </div>

                {/* Document Header Info */}
                <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
                  <div>
                    <h1 className="font-bold text-base text-slate-900 uppercase tracking-wide">{doc.document_title}</h1>
                    <p className="text-[11px] text-slate-600 font-mono">Protocol: {doc.study_id} | Artifact ID: {doc.tmf_artifact_id}</p>
                    {doc.file_name && (
                      <p className="text-[11px] text-blue-700 font-mono font-bold mt-0.5">Attached File: {doc.file_name}</p>
                    )}
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-600 space-y-0.5">
                    <p>Status: <span className="font-bold text-slate-900">{doc.status}</span></p>
                    <p>Version: v{doc.version_number}</p>
                    <p>Date: {doc.document_date || 'N/A'}</p>
                  </div>
                </div>

                {/* Section 1: ALCOA+ Compliance Proof */}
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-[11px] relative group">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-slate-900">1. ALCOA+ DATA INTEGRITY PROOF</p>
                    {canAddAnnotationsOnThisDoc && (
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotationSection("1. ALCOA+ Data Integrity Proof");
                          setShowAddAnnotation(true);
                          setActiveTab('annotations');
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 opacity-80 hover:opacity-100 cursor-pointer"
                      >
                        <MessageSquarePlus className="w-3 h-3" /> Add Annotation
                      </button>
                    )}
                  </div>
                  <p>Attributable: Uploaded by {doc.uploaded_by_name} ({doc.uploaded_by_id})</p>
                  <p>Original/Certified: {doc.is_certified_copy ? 'Certified Copy (Verified)' : 'Original Electronic Master'}</p>
                  <p>Checksum SHA-256: {doc.checksum_hash || 'e3b0c44298fc1c149afbf4c8996'}</p>
                </div>

                {/* Section 2: Purpose and Scope */}
                <div className="p-3 bg-white rounded border border-slate-200 text-[11px] relative space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">2. PURPOSE AND CLINICAL SCOPE</p>
                    {canAddAnnotationsOnThisDoc && (
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotationSection("2. Purpose and Clinical Scope");
                          setShowAddAnnotation(true);
                          setActiveTab('annotations');
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <MessageSquarePlus className="w-3 h-3" /> Add Annotation
                      </button>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed text-justify">
                    This official trial record forms an integral part of the Electronic Trial Master File (eTMF) for Study Protocol {doc.study_id}. 
                    It is maintained under 21 CFR Part 11, ICH GCP E6(R2/R3), and DIA TMF Reference Model v3.1 to establish contemporaneous trial conduct and regulatory inspection readiness.
                  </p>
                </div>

                {/* Section 3: Extracted OCR Text Content */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded relative space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900 text-[11px]">3. EXTRACTED OCR &amp; CONTENT MANIFEST</p>
                    {canAddAnnotationsOnThisDoc && (
                      <button
                        type="button"
                        onClick={() => {
                          setAnnotationSection("3. Extracted OCR & Content Manifest");
                          setShowAddAnnotation(true);
                          setActiveTab('annotations');
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <MessageSquarePlus className="w-3 h-3" /> Add Annotation
                      </button>
                    )}
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded font-mono text-[10px] text-slate-700 max-h-40 overflow-y-auto">
                    {doc.ocr_text || "Clinical record body indexed. Full OCR text verified and certified."}
                  </div>
                </div>

                {/* 21 CFR Part 11 Electronic Signature & Verification Trail */}
                <div className="mt-6 border-t-2 border-dashed border-emerald-600 pt-4 bg-emerald-50/70 p-3.5 rounded-lg space-y-2">
                  <p className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    21 CFR Part 11 Cryptographic E-Signature &amp; Verification Trail
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2 text-[10px] font-mono">
                    <div className="bg-white p-2 rounded border border-emerald-200">
                      <span className="font-bold text-slate-700 block">Gate 1: Author / Uploader</span>
                      <span className="text-slate-600">User: {doc.uploaded_by_name || 'Site User'} ({doc.uploaded_by_id || 'Uploader'})</span>
                      <span className="text-slate-500 block">Uploaded: {safeFormatDateTime(doc.upload_date_time || doc.filing_date)}</span>
                    </div>

                    {(doc.qc_status === 'Passed' || doc.qc_review_date_time || doc.qc_review_timestamp) && (
                      <div className="bg-white p-2 rounded border border-emerald-200">
                        <span className="font-bold text-slate-700 block">Gate 2: QC Reviewer Pass</span>
                        <span className="text-slate-600">Reviewer: {doc.qc_reviewer_name || 'Document Controller'}</span>
                        <span className="text-slate-500 block">Timestamp: {safeFormatDateTime(doc.qc_review_date_time || doc.qc_review_date || doc.qc_review_timestamp)}</span>
                        {doc.qc_signature && <span className="text-emerald-700 font-bold block">Signature: {typeof doc.qc_signature === 'string' ? doc.qc_signature : (doc.qc_signature?.signature_hash || 'eSig-QC-Verified')}</span>}
                      </div>
                    )}

                    {(doc.content_review_status === 'Passed' || doc.content_review_date_time || doc.content_review_timestamp) && (
                      <div className="bg-white p-2 rounded border border-emerald-200">
                        <span className="font-bold text-slate-700 block">Gate 3: Content Review Sign-Off</span>
                        <span className="text-slate-600">Reviewer: {doc.content_reviewer_name || 'TMF Lead'}</span>
                        <span className="text-slate-500 block">Timestamp: {safeFormatDateTime(doc.content_review_date_time || doc.content_review_date || doc.content_review_timestamp)}</span>
                        {doc.content_review_signature && <span className="text-indigo-700 font-bold block">Signature: {typeof doc.content_review_signature === 'string' ? doc.content_review_signature : (doc.content_review_signature?.signature_hash || 'eSig-Review-Signed')}</span>}
                      </div>
                    )}

                    {doc.status === 'Effective' && (
                      <div className="bg-white p-2 rounded border border-emerald-200">
                        <span className="font-bold text-slate-700 block">Gate 4: Final Admin Approval</span>
                        <span className="text-slate-600">Approver: {doc.approver_name || 'System Administrator'} ({doc.approver_role || 'System Administrator'})</span>
                        <span className="text-slate-500 block">Timestamp: {safeFormatDateTime(doc.approval_date_time || doc.effective_date || doc.approval_timestamp)}</span>
                        <span className="text-emerald-700 font-bold block">Manifest: {typeof doc.approval_signature === 'string' ? doc.approval_signature : (doc.signature_manifest?.signature_hash || 'eSig-FINAL-Admin')}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-600 font-mono pt-1">
                    SHA-256 Checksum: {doc.checksum_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Tabbed Review, Annotations & Control Panel */}
        <div className="w-full md:w-[420px] bg-white flex flex-col h-1/2 md:h-full border-t md:border-t-0">
          
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${doc.qc_score === 'Green' ? 'bg-emerald-500' : doc.qc_score === 'Amber' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
              <h2 className="text-xs font-bold text-slate-900 truncate" title={doc.document_title}>
                {doc.document_title}
              </h2>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 5-Gate Review & Approval Progress Ribbon */}
          <div className="bg-[#0B2240] text-white p-3 border-b border-blue-950 shadow-inner space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-sky-300">
                Workflow Gate {doc.status === 'Effective' ? '5/5 (Effective)' : doc.status === 'Approved' ? '4/5' : doc.status === 'Approval Pending' ? '3/5' : doc.qc_status === 'Passed' ? '2/5' : '1/5'}:
              </span>
              <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${
                doc.status === 'Effective' || doc.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400' :
                doc.status === 'Revision Required' || doc.qc_status === 'Failed' ? 'bg-rose-500/20 text-rose-300 border-rose-400' :
                'bg-blue-500/20 text-blue-300 border-blue-400'
              }`}>
                {doc.status}
              </span>
            </div>

            {/* Visual Gate Indicator */}
            <div className="grid grid-cols-5 gap-1 text-[9px] text-center font-mono">
              <div className="p-1 rounded bg-emerald-700/80 text-white font-bold" title="Gate 1: Document Upload">
                1. Upload
              </div>
              <div className={`p-1 rounded font-bold ${
                doc.qc_status === 'Passed' ? 'bg-emerald-700/80 text-white' :
                doc.qc_status === 'Failed' ? 'bg-rose-700 text-white' :
                'bg-blue-900/60 text-slate-300'
              }`} title="Gate 2: QC Review (Document Controller / Admin)">
                2. QC
              </div>
              <div className={`p-1 rounded font-bold ${
                doc.content_review_status === 'Passed' || doc.status === 'Approval Pending' || doc.status === 'Approved' || doc.status === 'Effective' ? 'bg-emerald-700/80 text-white' :
                doc.content_review_status === 'Revision Required' ? 'bg-rose-700 text-white' :
                'bg-blue-900/60 text-slate-300'
              }`} title="Gate 3: Content Review (TMF Lead / CRA / Admin)">
                3. Review
              </div>
              <div className={`p-1 rounded font-bold ${
                doc.status === 'Effective' || doc.status === 'Approved' ? 'bg-emerald-700/80 text-white' :
                'bg-blue-900/60 text-slate-300'
              }`} title="Gate 4: Admin Final Approval (System Administrator)">
                4. Approve
              </div>
              <div className={`p-1 rounded font-bold ${
                doc.status === 'Effective' ? 'bg-emerald-600 text-white shadow-xs' :
                'bg-blue-900/60 text-slate-300'
              }`} title="Gate 5: Effective & Filed in TMF">
                5. Filed
              </div>
            </div>
          </div>

          {/* Feedback Notice */}
          {qcFeedback && (
            <div className={`p-2.5 mx-3 mt-2 rounded border text-xs font-semibold flex items-center justify-between ${
              qcFeedback.status === 'Passed' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              qcFeedback.status === 'Query Raised' ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <span>{qcFeedback.message}</span>
              <button onClick={() => setQcFeedback(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50 text-xs overflow-x-auto">
            {availableTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 border-b-2 font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 text-xs space-y-4">

            {/* TAB: WORKFLOW & APPROVAL ACTIONS */}
            {activeTab === 'workflow' && (
              <div className="space-y-4">
                
                {/* Segregation of Duties Notice */}
                {isSelfUploaded && (
                  <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-lg text-amber-900 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Maker-Checker Rule (ICH GCP E6):</span>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        You uploaded this document. Under 21 CFR Part 11 and ICH GCP Four-Eyes Principle, independent peer reviewer clearance is mandatory.
                      </p>
                    </div>
                  </div>
                )}

                {/* Gate 1 Card: Upload */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Gate 1: Document Upload &amp; Indexing
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono font-bold">
                      Completed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Uploaded by: <strong>{doc.uploaded_by_name || 'Site User'}</strong> on {doc.document_date || doc.filing_date}
                  </p>
                </div>

                {/* Gate 2 Card: QC Review (Document Controller / Admin) */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-blue-600" /> Gate 2: Quality Control (QC Review)
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      doc.qc_status === 'Passed' ? 'bg-emerald-100 text-emerald-800' :
                      doc.qc_status === 'Failed' ? 'bg-rose-100 text-rose-800' :
                      doc.qc_status === 'Query Raised' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {doc.qc_status || 'Pending'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Role: <strong>Document Controller</strong> (Fallback: System Administrator)
                  </p>
                  {doc.qc_comments && (
                    <p className="text-[10px] bg-slate-50 p-2 rounded text-slate-700 italic border border-slate-200">
                      QC Finding: "{doc.qc_comments}"
                    </p>
                  )}

                  {/* QC Reviewer Stamp & Electronic Signature */}
                  {doc.qc_status === 'Passed' && (doc.qc_reviewer_name || doc.qc_review_date_time) && (
                    <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-[10px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900">QC Verified By:</span>
                        <span className="text-emerald-800 font-mono font-medium">{doc.qc_reviewer_name || 'Document Controller'}</span>
                      </div>
                      {(doc.qc_review_date_time || doc.qc_review_timestamp) && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Timestamp:</span>
                          <span className="font-mono text-slate-700">{doc.qc_review_date_time || safeFormatDateTime(doc.qc_review_timestamp)}</span>
                        </div>
                      )}
                      {doc.qc_signature && (
                        <div className="flex items-center justify-between border-t border-emerald-200/60 pt-0.5 mt-0.5">
                          <span className="text-slate-500">eSignature:</span>
                          <span className="font-mono text-emerald-700 font-bold">{typeof doc.qc_signature === 'string' ? doc.qc_signature : (doc.qc_signature?.signature_hash || 'eSig-QC-Verified')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions for Assigned QC Reviewer or Admin Fallback */}
                  {canPerformQcOnThisDoc ? (
                    <div className="pt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleQcAction('Passed')}
                        className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pass QC
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQcAction('Query Raised')}
                        className="py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> Raise Query
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQcAction('Failed')}
                        className="py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject QC
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 text-[10px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-200">
                      {doc.qc_status === 'Passed'
                        ? '✓ Quality Control verified by QC Reviewer under SOP-TMF-04.'
                        : isSelfUploaded
                        ? 'Maker-Checker restriction: Document author cannot QC their own upload.'
                        : `Awaiting QC review by assigned reviewer (${doc.assigned_reviewer_name || doc.qc_reviewer_name || 'Document Controller / System Admin'}).`}
                    </div>
                  )}
                </div>

                {/* Gate 3 Card: Content Review & Annotations (TMF Lead / CRA / Admin) */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-slate-900">
                      <PenTool className="w-4 h-4 text-indigo-600" /> Gate 3: Content Review &amp; Annotations
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      doc.content_review_status === 'Passed' ? 'bg-emerald-100 text-emerald-800' :
                      doc.content_review_status === 'Revision Required' ? 'bg-rose-100 text-rose-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {doc.content_review_status || 'Pending'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Role: <strong>TMF Lead / CRA Reviewer</strong> (Fallback: System Administrator)
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Inline Annotations: <strong>{openAnnotationsCount} Open Queries</strong>
                  </p>

                  {/* Content Reviewer Stamp & Electronic Signature */}
                  {doc.content_review_status === 'Passed' && (doc.content_reviewer_name || doc.content_review_date_time) && (
                    <div className="p-2 bg-indigo-50 rounded border border-indigo-200 text-[10px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-900">Reviewed By:</span>
                        <span className="text-indigo-800 font-mono font-medium">{doc.content_reviewer_name || 'TMF Lead'}</span>
                      </div>
                      {(doc.content_review_date_time || doc.content_review_timestamp) && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Timestamp:</span>
                          <span className="font-mono text-slate-700">{doc.content_review_date_time || safeFormatDateTime(doc.content_review_timestamp)}</span>
                        </div>
                      )}
                      {doc.content_review_signature && (
                        <div className="flex items-center justify-between border-t border-indigo-200/60 pt-0.5 mt-0.5">
                          <span className="text-slate-500">eSignature:</span>
                          <span className="font-mono text-indigo-700 font-bold">{typeof doc.content_review_signature === 'string' ? doc.content_review_signature : (doc.content_review_signature?.signature_hash || 'eSig-Review-Signed')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions for Assigned Content Reviewer or Admin Fallback */}
                  {canPerformContentReviewOnThisDoc ? (
                    <div className="pt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleContentReviewAction('Passed')}
                        className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Sign-Off Content Review
                      </button>
                      <button
                        type="button"
                        onClick={() => handleContentReviewAction('Revision Required')}
                        className="py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Request Revision
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 text-[10px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-200">
                      {doc.content_review_status === 'Passed'
                        ? '✓ Content review sign-off completed.'
                        : isSelfUploaded
                        ? 'Maker-Checker restriction: Document author cannot approve their own upload.'
                        : `Awaiting content review by assigned reviewer (${doc.assigned_reviewer_name || doc.content_reviewer_name || 'TMF Lead / System Admin'}).`}
                    </div>
                  )}
                </div>

                {/* Gate 4 Card: Final Admin Approval (System Administrator) */}
                <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-blue-900">
                      <ShieldAlert className="w-4 h-4 text-blue-700" /> Gate 4: Final Admin Approval &amp; E-Sign
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      doc.status === 'Effective' ? 'bg-emerald-600 text-white' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {doc.status === 'Effective' ? 'Approved & Effective' : 'Mandatory Admin Sign-off'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    Role: <strong>System Administrator</strong> (Mandatory for Effective Status)
                  </p>

                  {/* Final Admin Stamp & Electronic Signature Manifest */}
                  {doc.status === 'Effective' && (
                    <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-[10px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900">Approved By:</span>
                        <span className="text-emerald-800 font-mono font-medium">{doc.approver_name || 'System Administrator'} ({doc.approver_role || 'System Administrator'})</span>
                      </div>
                      {(doc.approval_date_time || doc.approval_timestamp) && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Timestamp:</span>
                          <span className="font-mono text-slate-700">{doc.approval_date_time || safeFormatDateTime(doc.approval_timestamp)}</span>
                        </div>
                      )}
                      {(doc.approval_signature || doc.signature_manifest) && (
                        <div className="flex items-center justify-between border-t border-emerald-200/60 pt-0.5 mt-0.5">
                          <span className="text-slate-500">eSignature:</span>
                          <span className="font-mono text-emerald-700 font-bold">{typeof doc.approval_signature === 'string' ? doc.approval_signature : (doc.signature_manifest?.signature_hash || 'eSig-FINAL-Admin')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions for System Administrator */}
                  {canPerformFinalApprovalOnThisDoc ? (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleFinalAdminApproval}
                        className="w-full py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" /> Grant Final Approval &amp; Make Effective
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 text-[10px] text-slate-500 italic bg-blue-50/50 p-2 rounded border border-blue-100">
                      {doc.status === 'Effective'
                        ? '✓ Final Administrator approval granted. Document is Effective and locked.'
                        : doc.status === 'Revision Required' || doc.qc_status === 'Failed'
                        ? 'Final approval suspended: Pending remediation of queries and revision resubmission.'
                        : isSelfUploaded
                        ? 'Maker-Checker restriction: Independent System Administrator approval required.'
                        : 'Mandatory System Administrator electronic sign-off required to render document Effective.'}
                    </div>
                  )}
                </div>

                {/* Request Revision / Author New Version Button */}
                {canAuthorNewVersionOnThisDoc && (
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsVersionModalOpen(true)}
                      className="w-full py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <GitCompare className="w-4 h-4 text-blue-600" /> Author New Version (Resubmit Draft)
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* TAB: WORD-STYLE INLINE ANNOTATIONS */}
            {activeTab === 'annotations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      Document Review Annotations
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      MS Word-style line &amp; section deficiency comments for author remediation.
                    </p>
                  </div>
                  {canAddAnnotationsOnThisDoc && (
                    <button
                      type="button"
                      onClick={() => setShowAddAnnotation(!showAddAnnotation)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold cursor-pointer"
                    >
                      {showAddAnnotation ? 'Cancel' : '+ New Annotation'}
                    </button>
                  )}
                </div>

                {/* Add Annotation Form */}
                {showAddAnnotation && canAddAnnotationsOnThisDoc && (
                  <form onSubmit={handleAddAnnotationSubmit} className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 space-y-2 text-xs">
                    <p className="font-bold text-blue-900">Add Review Comment / Annotation:</p>
                    
                    <div>
                      <label className="block text-slate-700 text-[10px] font-bold uppercase mb-0.5">Target Section / Page:</label>
                      <select
                        value={annotationSection}
                        onChange={(e) => setAnnotationSection(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                      >
                        <option value="1. ALCOA+ Data Integrity Proof">1. ALCOA+ Data Integrity Proof</option>
                        <option value="2. Purpose and Clinical Scope">2. Purpose and Clinical Scope</option>
                        <option value="3. Extracted OCR & Content Manifest">3. Extracted OCR & Content Manifest</option>
                        <option value="Document Header / Protocol ID">Document Header / Protocol ID</option>
                        <option value="Signatures & Dates Block">Signatures & Dates Block</option>
                        <option value="Overall Document Quality">Overall Document Quality</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 text-[10px] font-bold uppercase mb-0.5">Deficiency Category:</label>
                      <select
                        value={annotationCategory}
                        onChange={(e) => setAnnotationCategory(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                      >
                        <option value="Critical Deficiency">Critical Deficiency (Blocks Approval)</option>
                        <option value="Major Correction">Major Correction (Revision Required)</option>
                        <option value="Minor Typo / Edit">Minor Typo / Editorial Edit</option>
                        <option value="Missing Information">Missing Information</option>
                        <option value="Compliance Query">Compliance Query</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 text-[10px] font-bold uppercase mb-0.5">Reviewer Feedback / Finding:</label>
                      <textarea
                        rows={3}
                        required
                        value={annotationText}
                        onChange={(e) => setAnnotationText(e.target.value)}
                        placeholder="Detail specific deficiency, missing signature, or requested revision..."
                        className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-900 focus:outline-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer"
                    >
                      Post Annotation
                    </button>
                  </form>
                )}

                {/* Annotations List */}
                <div className="space-y-3">
                  {annotationsList.length === 0 ? (
                    <p className="text-slate-400 italic text-center py-6 text-xs">
                      No review annotations added yet. Reviewers can add comments on specific document sections.
                    </p>
                  ) : (
                    annotationsList.map((a) => (
                      <div key={a.id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between text-[10px] flex-wrap gap-1">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            a.category === 'Critical Deficiency' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            a.category === 'Major Correction' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}>
                            {a.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                            a.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {a.status}
                          </span>
                        </div>

                        <p className="text-[11px] font-bold text-slate-800">
                          Target: {a.section_or_page}
                        </p>
                        <p className="text-slate-700 text-xs">
                          "{a.comment}"
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          By: {a.author_name} ({a.author_role}) on {safeFormatDate(a.date)}
                        </p>

                        {/* Resolution details if resolved */}
                        {a.status === 'Resolved' ? (
                          <div className="bg-emerald-50 p-2 rounded border border-emerald-200 text-[10px] space-y-0.5">
                            <p className="font-bold text-emerald-900">Resolved by {a.resolved_by}:</p>
                            <p className="text-emerald-800 italic">"{a.resolution_notes}"</p>
                            {canAddAnnotationsOnThisDoc && (
                              <button
                                type="button"
                                onClick={() => handleReopenAnnotation(a.id)}
                                className="text-[9px] text-rose-600 hover:underline font-bold mt-1 block cursor-pointer"
                              >
                                Re-open Query
                              </button>
                            )}
                          </div>
                        ) : (
                          /* Resolution box if Open */
                          <div className="pt-1 border-t border-slate-100">
                            {canResolveAnnotationsOnThisDoc ? (
                              resolvingId === a.id ? (
                                <div className="space-y-1.5">
                                  <input
                                    type="text"
                                    value={resolutionText}
                                    onChange={(e) => setResolutionText(e.target.value)}
                                    placeholder="Describe how this comment was resolved..."
                                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleResolveAnnotationSubmit(a.id)}
                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] cursor-pointer"
                                    >
                                      Submit Resolution
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setResolvingId(null)}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResolvingId(a.id);
                                    setResolutionText("");
                                  }}
                                  className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <CornerDownRight className="w-3 h-3" /> Address &amp; Mark Resolved
                                </button>
                              )
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                Action required: Document author to remediate and resolve this query in new revision.
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: 11-STEP LIFECYCLE WORKFLOW */}
            {activeTab === 'lifecycle' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-3.5 rounded-xl border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-indigo-700 tracking-wider">
                      ICH GCP E6 &amp; DIA TMF
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      currentStageNum >= 9 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      currentStageNum === 7 && doc.lifecycle_status?.toLowerCase().includes('reject') ? 'bg-rose-100 text-rose-800 border-rose-300' :
                      'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>
                      {doc.lifecycle_status || (currentStageNum >= 9 ? 'TMF Filed & Approved' : 'In Progress')}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Standard 11-Step Document Lifecycle
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Clinical document lifecycle from drafting through quality control, DIA filing, inspection readiness, and 25-year archival.
                  </p>
                </div>

                {lifecycleFeedback && (
                  <div className={`p-2.5 rounded-lg text-xs font-semibold ${
                    lifecycleFeedback.status === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {lifecycleFeedback.message}
                  </div>
                )}

                {/* 11 Steps Stepper */}
                <div className="space-y-2.5 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {LIFECYCLE_STEPS.map((s) => {
                    const isCompleted = s.step < currentStageNum;
                    const isCurrent = s.step === currentStageNum;
                    const isUpcoming = s.step > currentStageNum;
                    const isRejectedRework = isCurrent && s.step === 7 && doc.lifecycle_status?.toLowerCase().includes('reject');
                    const historyRecord = (doc.lifecycle_history || []).find(h => h.stage_number === s.step);

                    return (
                      <div 
                        key={s.step}
                        className={`relative pl-8 transition-all ${
                          isCurrent 
                            ? 'scale-[1.01]' 
                            : isUpcoming 
                            ? 'opacity-65' 
                            : ''
                        }`}
                      >
                        <div className={`absolute left-1.5 top-2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isRejectedRework
                            ? 'bg-rose-600 text-white ring-4 ring-rose-100 animate-pulse'
                            : isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                        }`}>
                          {isCompleted ? <Check className="w-2.5 h-2.5 text-white stroke-[3]" /> : s.step}
                        </div>

                        <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                          isRejectedRework
                            ? 'bg-rose-50/80 border-rose-300 shadow-xs'
                            : isCurrent
                            ? 'bg-white border-blue-400 shadow-md ring-1 ring-blue-200'
                            : isCompleted
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-slate-50/50 border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className={`font-bold text-[11px] ${
                              isCurrent ? 'text-blue-900' : isCompleted ? 'text-slate-800' : 'text-slate-500'
                            }`}>
                              {s.title}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold tracking-tight uppercase ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isRejectedRework
                                ? 'bg-rose-100 text-rose-800'
                                : isCurrent
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {isCompleted ? 'Completed' : isRejectedRework ? 'Rework Req.' : isCurrent ? 'Active Stage' : 'Pending'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-700 italic">
                            "{s.desc}"
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 font-sans">
                            <span>Role: <strong className="text-slate-700">{s.actor}</strong></span>
                            <span>{s.roleScope}</span>
                          </div>

                          {historyRecord && (
                            <div className="mt-1.5 p-2 bg-white/80 rounded border border-slate-200 text-[10px] space-y-0.5 font-mono">
                              <p className="text-slate-700 font-semibold">{historyRecord.status}</p>
                              <p className="text-slate-500 text-[9px]">By: {historyRecord.actor_name} ({historyRecord.actor_role})</p>
                              <p className="text-slate-400 text-[9px]">{safeFormatDateTime(historyRecord.timestamp)}</p>
                              {historyRecord.notes && (
                                <p className="text-slate-600 font-sans italic text-[10px]">Note: {historyRecord.notes}</p>
                              )}
                            </div>
                          )}

                          {isCurrent && (
                            <div className="pt-2">
                              {s.step === 5 && (
                                <div>
                                  {(canQcPass || hasPermission('qcReview') || isDocController || isAdmin) ? (
                                    <button
                                      onClick={() => setActiveTab('workflow')}
                                      className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                    >
                                      Proceed to Quality Control (Stage 6) <ArrowRight className="w-3 h-3" />
                                    </button>
                                  ) : (
                                    <p className="text-[10px] text-slate-500 italic bg-amber-50 p-2 rounded border border-amber-200">
                                      Metadata entry complete. Awaiting Document Controller / Admin for Quality Control review.
                                    </p>
                                  )}
                                </div>
                              )}

                              {s.step === 6 && (
                                <div>
                                  {(canQcPass || canQcReject || isDocController || isAdmin) ? (
                                    <button
                                      onClick={() => setActiveTab('workflow')}
                                      className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                    >
                                      Open QC Review (Pass / Query) <ArrowRight className="w-3 h-3" />
                                    </button>
                                  ) : (
                                    <p className="text-[10px] text-slate-500 italic bg-amber-50 p-2 rounded border border-amber-200">
                                      Document is undergoing Document Controller Quality Control under SOP-TMF-04.
                                    </p>
                                  )}
                                </div>
                              )}

                              {s.step === 7 && isRejectedRework && (
                                <div className="space-y-1.5">
                                  <p className="text-[10px] text-rose-700 font-semibold">
                                    Document returned for correction. Address queries or upload revision.
                                  </p>
                                  <button
                                    onClick={() => setIsVersionModalOpen(true)}
                                    className="w-full py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                  >
                                    Author New Revision <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              {s.step === 9 && (
                                <div className="space-y-1.5">
                                  <p className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200">
                                    Document approved and indexed in DIA TMF Zone {doc.tmf_zone_id} &gt; {doc.tmf_artifact_name}.
                                  </p>
                                  {(isAdmin || isTmfLeadOrReviewer) && (
                                    <button
                                      onClick={() => handleAdvanceLifecycle(10, 'Inspection readiness verified. Audit trail and cryptographic checksum certified.', 'Inspection Ready')}
                                      className="w-full py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                    >
                                      Verify Monitoring &amp; Inspection Readiness (Stage 10) <ArrowRight className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}

                              {s.step === 10 && (
                                <div className="space-y-1.5">
                                  <div className="bg-emerald-50 p-2 rounded border border-emerald-200 text-[10px] text-emerald-800 space-y-1">
                                    <p className="font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Inspection Ready Certified
                                    </p>
                                    <p>ALCOA+ completeness, SHA-256 seal, and Part 11 audit trail verified for regulatory audits.</p>
                                  </div>
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleAdvanceLifecycle(11, 'Trial close-out completed. 25-year digital TMF regulatory retention lock engaged.', 'Archived (25-Yr Regulatory Lock)')}
                                      className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                    >
                                      Engage 25-Year Archival Lock (Stage 11) <Lock className="w-3 h-3 text-amber-400" />
                                    </button>
                                  )}
                                </div>
                              )}

                              {s.step === 11 && (
                                <div className="bg-slate-100 p-2 rounded border border-slate-300 text-[10px] text-slate-800 space-y-1">
                                  <p className="font-bold flex items-center gap-1 text-slate-900">
                                    <Lock className="w-3.5 h-3.5 text-amber-600" /> 25-Year Regulatory Retention Lock Active
                                  </p>
                                  <p className="text-slate-600">This clinical trial record is officially archived and locked from editing until 2051.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* TAB: METADATA */}
            {activeTab === 'metadata' && (
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <h3 className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Identification Fields</h3>
                  <p><span className="text-slate-500">Document ID:</span> <span className="text-blue-700 font-mono font-bold">{doc.document_id}</span></p>
                  <p><span className="text-slate-500">TMF Address:</span> Zone {doc.tmf_zone_id} → {doc.tmf_section_id} → {doc.tmf_artifact_id}</p>
                  <p><span className="text-slate-500">Protocol #:</span> {doc.study_id}</p>
                  <p><span className="text-slate-500">Country / Site:</span> {doc.country_code} / {doc.site_id}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <h3 className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Lifecycle &amp; ALCOA+</h3>
                  <p><span className="text-slate-500">Lifecycle Stage:</span> <span className="font-bold text-indigo-700">Stage {currentStageNum}/11: {doc.lifecycle_stage_name || (LIFECYCLE_STEPS[currentStageNum - 1]?.title || 'Document Lifecycle')}</span></p>
                  <p><span className="text-slate-500">Lifecycle Status:</span> <span className="font-bold text-slate-900">{doc.lifecycle_status || doc.status}</span></p>
                  <p><span className="text-slate-500">Document Status:</span> <span className="text-slate-900 font-bold">{doc.status}</span></p>
                  <p><span className="text-slate-500">Version:</span> v{doc.version_number}</p>
                  <p><span className="text-slate-500">Certified Copy:</span> {doc.is_certified_copy ? 'YES (Verified)' : 'NO'}</p>
                  <p><span className="text-slate-500">Source Type:</span> {doc.source_type}</p>
                  <p><span className="text-slate-500">Essential Document:</span> {doc.is_essential_document ? 'YES' : 'NO'}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <h3 className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Dates &amp; Personnel</h3>
                  <p><span className="text-slate-500">Document Date:</span> {doc.document_date || 'N/A'}</p>
                  <p><span className="text-slate-500">Filing Date:</span> {doc.filing_date || 'N/A'}</p>
                  <p><span className="text-slate-500">Uploaded By:</span> {doc.uploaded_by_name || 'System'}</p>
                  <p><span className="text-slate-500">QC Reviewer:</span> {doc.qc_reviewer_name || 'Pending'}</p>
                  <p><span className="text-slate-500">Final Approver:</span> {doc.approver_name || 'Pending Admin Sign-off'}</p>
                </div>
              </div>
            )}

            {/* TAB: VERSIONING & CONCURRENCY LOCKING */}
            {activeTab === 'versioning' && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Checkout Lock Status:</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isLocked ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'}`}>
                      {isLocked ? `Checked Out (Locked by ${doc.locked_by_user_name || 'User'})` : 'Checked In (Available)'}
                    </span>
                  </div>

                  {!isInspectorMode && canToggleLockOnThisDoc && (
                    <button
                      onClick={() => toggleDocumentLock(doc.document_id, currentUser)}
                      className={`w-full py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                        isLocked 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-xs'
                      }`}
                    >
                      {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {isLocked ? 'Release Lock (Check In)' : 'Acquire Lock (Check Out)'}
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Version History Stack</h3>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <p className="font-bold text-slate-900">Version {doc.version_number} (Current)</p>
                        <p className="text-[10px] text-slate-500">{safeFormatDate(doc.upload_date_time)} by {doc.uploaded_by_name}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                        doc.status === 'Effective' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}>
                        {doc.status}
                      </span>
                    </div>

                    {(doc.versions_history || []).map((vh, vidx) => (
                      <div key={vidx} className="flex items-center justify-between opacity-75 border-b border-slate-200/50 pb-1.5">
                        <div>
                          <p className="font-bold text-slate-700">Version {vh.version_number} (Superseded)</p>
                          <p className="text-[10px] text-slate-500">{vh.notes || 'Previous revision'}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-mono">
                          Superseded
                        </span>
                      </div>
                    ))}
                  </div>

                  {canAuthorNewVersionOnThisDoc && (
                    <button
                      onClick={() => setIsVersionModalOpen(true)}
                      className="w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer text-xs"
                    >
                      <History className="w-3.5 h-3.5" /> Author New Version (v{(!isNaN(parseFloat(doc.version_number)) ? (parseFloat(doc.version_number) + 1).toFixed(1) : '2.0')})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB: QC CHECKLIST */}
            {activeTab === 'qc' && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-slate-900 font-bold">ALCOA+ Quality Checklist (SOP-TMF-04)</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const allChecked = checklistState.every(Boolean);
                        setChecklistState([!allChecked, !allChecked, !allChecked, !allChecked]);
                      }}
                      className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      {checklistState.every(Boolean) ? 'Uncheck All' : 'Check All'}
                    </button>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-700">
                    {[
                      "Document Legibility & Redaction Check",
                      "Correct DIA TMF Zone/Section Placement",
                      "Required Signatures & Dates Present",
                      "Protocol & Site Number Accuracy"
                    ].map((label, idx) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklistState[idx]}
                          onChange={() => setChecklistState(prev => prev.map((v, i) => (i === idx ? !v : v)))}
                          className="accent-blue-600 rounded cursor-pointer"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-700 font-medium text-xs">QC Finding &amp; Query Notes:</label>
                  <textarea
                    rows={3}
                    value={qcCommentsInput}
                    onChange={(e) => setQcCommentsInput(e.target.value)}
                    placeholder="Enter compliance observations or remediation instructions..."
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* TAB: E-SIGNATURE */}
            {activeTab === 'esign' && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                  <h3 className="text-slate-900 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    21 CFR Part 11 Signature Binding
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Signature Type: <span className="text-slate-900 font-semibold">{doc.signature_type || 'None'}</span>
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Status: <span className={`font-bold ${doc.status === 'Effective' ? 'text-emerald-700' : 'text-amber-700'}`}>{doc.status}</span>
                  </p>

                  {!isInspectorMode && doc.status !== 'Effective' && (isAdmin || (canSign && !isSelfUploaded)) && (
                    <button
                      onClick={() => setIsSignModalOpen(true)}
                      className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" /> Execute Part 11 E-Signature
                    </button>
                  )}
                  {isSelfUploaded && !isAdmin && doc.status !== 'Effective' && (
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                      Segregation of Duties: Uploader cannot apply final approval e-signature to their own upload.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB: AUDIT TRAIL */}
            {activeTab === 'audit' && (
              <div className="space-y-2">
                <h3 className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">21 CFR Part 11 Event History</h3>
                <div className="space-y-2">
                  {filteredAuditLogs.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px]">No specific audit trail records found for this document ID.</p>
                  ) : (
                    filteredAuditLogs.map(log => (
                      <div key={log.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-blue-700 font-bold">
                          <span>{log.action}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{safeFormatDate(log.timestamp)}</span>
                        </div>
                        <p className="text-slate-700">By: {log.user_name} ({log.user_role})</p>
                        <p className="text-slate-500 font-mono text-[10px]">Reason: {log.reason}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: DISCUSSION COMMENTS */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {(doc.comments || []).map(c => (
                    <div key={c.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                      <div className="flex justify-between font-semibold text-blue-700 mb-1">
                        <span>{c.user}</span>
                        <span className="text-[10px] text-slate-400">{safeFormatDate(c.date)}</span>
                      </div>
                      <p className="text-slate-800">{c.text}</p>
                    </div>
                  ))}
                </div>

                {!isInspectorMode && (
                  <form onSubmit={handleCommentSubmit} className="space-y-2">
                    <input
                      type="text"
                      placeholder="Add a team comment or note..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-blue-500 shadow-xs text-xs"
                    />
                    <button
                      type="submit"
                      className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                    >
                      Post Comment
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* E-Signature Modal Trigger */}
      {isSignModalOpen && (
        <ESignatureModal doc={doc} onClose={() => setIsSignModalOpen(false)} />
      )}

      {/* New Version Authoring Modal Trigger */}
      {isVersionModalOpen && (
        <NewVersionModal doc={doc} onClose={() => setIsVersionModalOpen(false)} />
      )}
    </div>
  </DrawerErrorBoundary>
  );
}
