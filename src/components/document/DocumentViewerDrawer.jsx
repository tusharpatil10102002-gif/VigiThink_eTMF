import React, { useState } from 'react';
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
  Eye
} from 'lucide-react';
import { useTMFData } from '../../context/TMFDataContext';
import { useAuth } from '../../context/AuthContext';
import ESignatureModal from './ESignatureModal';
import NewVersionModal from './NewVersionModal';

export default function DocumentViewerDrawer({ doc: initialDoc, onClose, defaultTab = "metadata" }) {
  const { 
    documents,
    updateDocumentMetadata, 
    performQcReview, 
    toggleDocumentLock, 
    addDocumentComment, 
    downloadDocumentFile,
    renameDocument,
    deleteDocument,
    auditLogs 
  } = useTMFData();

  const { currentUser, currentRole, hasPermission, isInspectorMode } = useAuth();

  const doc = documents.find(d => d.document_id === initialDoc?.document_id) || initialDoc;
  const previewFileUrl = doc?.local_blob_url || doc?.file_path || null;
  const [viewerMode, setViewerMode] = useState(previewFileUrl ? 'actual_file' : 'certificate'); // 'actual_file' | 'certificate'
  const [activeTab, setActiveTab] = useState(defaultTab || "metadata");
  const [qcCommentsInput, setQcCommentsInput] = useState(doc?.qc_comments || "");
  const [qcIssueCategory, setQcIssueCategory] = useState("Missing Required Signature");
  const [qcFeedback, setQcFeedback] = useState(null);
  const [checklistState, setChecklistState] = useState([true, true, true, true]);
  const [newComment, setNewComment] = useState("");
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameTitleInput, setRenameTitleInput] = useState(doc?.document_title || "");
  const [renameFileInput, setRenameFileInput] = useState(doc?.file_name || "");

  if (!doc) return null;

  const filteredAuditLogs = auditLogs.filter(a => a.target_id === doc.document_id);
  const canManageUploadedFile = hasPermission('upload') || hasPermission('editMetadata') || hasPermission('delete');

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
    if (window.confirm(`Are you sure you want to delete "${doc.document_title}" (${doc.document_id})?`)) {
      deleteDocument(doc.document_id, currentUser);
      onClose();
    }
  };

  const handleQcAction = async (qcStatus) => {
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
          ? '✓ QC Passed! Document status updated to Approved (Green).'
          : qcStatus === 'Query Raised'
          ? `⚠️ Formal Quality Query raised (${qcIssueCategory}) and logged in Queries Queue.`
          : '✕ Document marked as Failed / Returned for Correction.'
    });
    setTimeout(() => setQcFeedback(null), 5000);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addDocumentComment(doc.document_id, currentUser, newComment);
    setNewComment("");
  };

  const isLocked = doc.checkout_status === 'Checked Out';
  const isLockedByMe = doc.locked_by_user_id === currentUser.id;

  return (
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
                    📄 Actual Uploaded File
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewerMode('certificate')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                      viewerMode === 'certificate' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🛡️ ALCOA+ Sheet
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

              <button 
                onClick={() => downloadDocumentFile(doc)}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 text-[11px] font-semibold cursor-pointer"
                title="Download Uploaded File"
              >
                <Download className="w-3 h-3 text-blue-600" /> Download
              </button>

              {canManageUploadedFile && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRenameTitleInput(doc.document_title || "");
                      setRenameFileInput(doc.file_name || "");
                      setIsRenaming(!isRenaming);
                    }}
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 text-[11px] font-bold cursor-pointer"
                    title="Rename Document / File"
                  >
                    ✏️ Rename
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCurrentDoc}
                    className="px-2 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded border border-rose-200 text-[11px] font-bold cursor-pointer"
                    title="Delete Uploaded Document"
                  >
                    🗑️ Delete
                  </button>
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

          {/* Document Content Box: Actual Uploaded File OR ALCOA+ Certificate */}
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
                      This file format ({doc.file_name?.split('.').pop()?.toUpperCase() || 'DOCX/XLSX'}) is stored in the eTMF repository. Click below to open or download the exact uploaded file:
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
                className="w-full max-w-xl bg-white text-slate-900 p-8 rounded-lg shadow-xl min-h-[600px] border border-slate-300 relative font-sans text-xs transition-transform"
              >
                {/* Dynamic Confidentiality Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none rotate-45 text-4xl font-extrabold text-slate-900 uppercase">
                  {isInspectorMode ? "INSPECTION COPY — FDA AUDIT" : "CONFIDENTIAL — CLINIDEA eTMF"}
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
                  <div className="text-right font-mono text-[10px] text-slate-600">
                    <p>Status: <span className="font-bold text-slate-900">{doc.status}</span></p>
                    <p>Version: {doc.version_number}</p>
                    <p>Date: {doc.document_date || 'N/A'}</p>
                  </div>
                </div>

                {/* Document Body Simulation */}
                <div className="space-y-4 text-slate-800 leading-relaxed text-justify">
                  <div className="bg-slate-50 p-3 rounded border border-slate-200 text-[11px]">
                    <p className="font-semibold text-slate-900 mb-1">ALCOA+ Compliance Proof:</p>
                    <p>Attributable: Uploaded by {doc.uploaded_by_name} ({doc.uploaded_by_id})</p>
                    <p>Original/Certified: {doc.is_certified_copy ? 'Certified Copy (Verified)' : 'Original'}</p>
                    <p>Checksum SHA-256: {doc.checksum_hash || 'e3b0c44298fc1c149afbf4c8996'}</p>
                  </div>

                  <p className="font-medium text-slate-900">1. PURPOSE AND SCOPE</p>
                  <p>
                    This official trial document forms an integral part of the Electronic Trial Master File (eTMF) for Protocol {doc.study_id}. 
                    It is maintained under 21 CFR Part 11 and ICH GCP E6(R3) guidelines to ensure inspection readiness.
                  </p>

                  <p className="font-medium text-slate-900">2. EXPOSED EXTRACTED OCR TEXT</p>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded font-mono text-[10px] text-slate-700">
                    {doc.ocr_text || "No OCR text extracted."}
                  </div>

                  {/* E-Signature Manifest Box */}
                  {doc.signature_type === 'Electronic (Part 11)' && (
                    <div className="mt-8 border-t-2 border-dashed border-emerald-600 pt-4 bg-emerald-50 p-3 rounded">
                      <p className="font-bold text-emerald-900 flex items-center gap-1 text-xs">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        21 CFR Part 11 Cryptographic E-Signature Applied
                      </p>
                      <p className="text-[10px] text-emerald-800 font-mono mt-1">
                        Signed By: {doc.approver_name || 'Authorized Signatory'} | Date: {doc.approval_date || doc.effective_date}
                      </p>
                      <p className="text-[10px] text-slate-600 font-mono">
                        Signature Hash Manifest: {doc.checksum_hash?.substring(0, 32)}...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Tabbed Metadata & Control Panel */}
        <div className="w-full md:w-96 bg-white flex flex-col h-1/2 md:h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${doc.qc_score === 'Green' ? 'bg-emerald-500' : doc.qc_score === 'Amber' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
              <h2 className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{doc.document_title}</h2>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50 text-xs overflow-x-auto">
            {['metadata', 'versioning', 'qc', 'esign', 'audit', 'comments'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 border-b-2 font-semibold capitalize whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'esign' ? 'E-Sign' : tab}
              </button>
            ))}
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-4 text-xs space-y-4">
            
            {/* TAB 1: METADATA */}
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
                  <h3 className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Lifecycle & ALCOA+</h3>
                  <p><span className="text-slate-500">Status:</span> <span className="text-slate-900 font-bold">{doc.status}</span></p>
                  <p><span className="text-slate-500">Version:</span> v{doc.version_number}</p>
                  <p><span className="text-slate-500">Certified Copy:</span> {doc.is_certified_copy ? 'YES (Verified)' : 'NO'}</p>
                  <p><span className="text-slate-500">Source Type:</span> {doc.source_type}</p>
                  <p><span className="text-slate-500">Essential Document:</span> {doc.is_essential_document ? 'YES' : 'NO'}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <h3 className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Dates & Personnel</h3>
                  <p><span className="text-slate-500">Document Date:</span> {doc.document_date || 'N/A'}</p>
                  <p><span className="text-slate-500">Filing Date:</span> {doc.filing_date || 'N/A'}</p>
                  <p><span className="text-slate-500">Uploaded By:</span> {doc.uploaded_by_name || 'System'}</p>
                  <p><span className="text-slate-500">QC Reviewer:</span> {doc.qc_reviewer_name || 'Pending'}</p>
                  <p><span className="text-slate-500">Retention Expiry:</span> {doc.retention_end_date || '2051-01-01'}</p>
                </div>
              </div>
            )}

            {/* TAB 2: VERSIONING & LOCKING */}
            {activeTab === 'versioning' && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Checkout Lock Status:</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isLocked ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'}`}>
                      {isLocked ? 'Checked Out (Locked)' : 'Checked In (Available)'}
                    </span>
                  </div>

                  {!isInspectorMode && (
                    <button
                      onClick={() => toggleDocumentLock(doc.document_id, currentUser)}
                      className={`w-full py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 ${
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
                        <p className="text-[10px] text-slate-500">{doc.upload_date_time?.split('T')[0]} by {doc.uploaded_by_name}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold border border-emerald-300">Effective</span>
                    </div>

                    <div className="flex items-center justify-between opacity-60">
                      <div>
                        <p className="font-bold text-slate-700">Version 0.1 (Draft)</p>
                        <p className="text-[10px] text-slate-500">Initial submission</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-mono border border-slate-300">Superseded</span>
                    </div>
                  </div>

                  {!isInspectorMode && (
                    <button
                      onClick={() => setIsVersionModalOpen(true)}
                      className="w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer text-xs"
                    >
                      <History className="w-3.5 h-3.5" /> Author New Version (v{parseFloat(doc.version_number || '1.0') + 1}.0)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: QC REVIEW CHECKLIST */}
            {activeTab === 'qc' && (
              <div className="space-y-4">
                {/* Live QC Status Summary Box */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current QC Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      doc.qc_status === 'Passed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : doc.qc_status === 'Query Raised' || doc.qc_status === 'Failed'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {doc.qc_status || 'In Progress'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200/70">
                    <p><span className="text-slate-400">Document State:</span> <strong className="text-slate-800">{doc.status}</strong></p>
                    <p><span className="text-slate-400">Reviewer:</span> <strong className="text-slate-800">{doc.qc_reviewer_name || 'Pending Review'}</strong> {doc.qc_review_date ? `(${doc.qc_review_date})` : ''}</p>
                    {doc.qc_comments && (
                      <p className="p-2 bg-white rounded border border-slate-200 text-slate-700 text-[11px]">
                        <span className="font-semibold text-slate-500 block text-[10px]">Last QC Note:</span>
                        {doc.qc_comments}
                      </p>
                    )}
                  </div>
                </div>

                {qcFeedback && (
                  <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                    qcFeedback.status === 'Passed'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : qcFeedback.status === 'Query Raised'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <span>{qcFeedback.message}</span>
                    <button onClick={() => setQcFeedback(null)} className="text-slate-400 hover:text-slate-700 ml-2 cursor-pointer">✕</button>
                  </div>
                )}

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-slate-900 font-bold">QC Review Checklist (SOP-TMF-04)</h3>
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

                {!isInspectorMode && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Issue Category (if Raising Query / Failing):</label>
                      <select
                        value={qcIssueCategory}
                        onChange={(e) => setQcIssueCategory(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Missing Required Signature">Missing Required Signature</option>
                        <option value="Incorrect Site Number">Incorrect Site Number</option>
                        <option value="Illegible Document Scan">Illegible Document Scan</option>
                        <option value="Incorrect TMF Artifact Classification">Incorrect TMF Artifact Classification</option>
                        <option value="Unredacted Subject Information (PHI)">Unredacted Subject Information (PHI)</option>
                        <option value="Duplicate File Upload Detected">Duplicate File Upload Detected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">QC Reviewer Comments / Query Details</label>
                      <textarea
                        rows={3}
                        value={qcCommentsInput}
                        onChange={(e) => setQcCommentsInput(e.target.value)}
                        placeholder="Enter quality findings, approval notes, or query remediation details..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none shadow-xs"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleQcAction('Passed')}
                        className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pass QC
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQcAction('Query Raised')}
                        className="py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> Query
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQcAction('Failed')}
                        className="py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Fail
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: E-SIGNATURE */}
            {activeTab === 'esign' && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                  <h3 className="text-slate-900 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    21 CFR Part 11 Signature Binding
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Signature Type: <span className="text-slate-900 font-semibold">{doc.signature_type}</span>
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Status: <span className={`font-bold ${doc.status === 'Effective' ? 'text-emerald-700' : 'text-amber-700'}`}>{doc.status}</span>
                  </p>

                  {!isInspectorMode && doc.status !== 'Effective' && (
                    <button
                      onClick={() => setIsSignModalOpen(true)}
                      className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" /> Execute Part 11 E-Signature
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: AUDIT TRAIL */}
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
                          <span className="text-[10px] text-slate-400 font-mono">{log.timestamp.split('T')[0]}</span>
                        </div>
                        <p className="text-slate-700">By: {log.user_name} ({log.user_role})</p>
                        <p className="text-slate-500 font-mono text-[10px]">Reason: {log.reason}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: COMMENTS */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {(doc.comments || []).map(c => (
                    <div key={c.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                      <div className="flex justify-between font-semibold text-blue-700 mb-1">
                        <span>{c.user}</span>
                        <span className="text-[10px] text-slate-400">{c.date}</span>
                      </div>
                      <p className="text-slate-800">{c.text}</p>
                    </div>
                  ))}
                </div>

                {!isInspectorMode && (
                  <form onSubmit={handleCommentSubmit} className="space-y-2">
                    <input
                      type="text"
                      placeholder="Add a comment or note..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-blue-500 shadow-xs"
                    />
                    <button
                      type="submit"
                      className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
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
  );
}
