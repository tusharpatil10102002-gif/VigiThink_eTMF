import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTMFData } from '../context/TMFDataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  RefreshCw, 
  FileText, 
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderOpen,
  Eye,
  Upload,
  ShieldCheck,
  AlertTriangle,
  Building,
  Users,
  Archive,
  Layers,
  ArrowRight,
  Send,
  HelpCircle,
  Plus,
  Award
} from 'lucide-react';
import DocumentViewerDrawer from '../components/document/DocumentViewerDrawer';
import UploadWizardModal from '../components/document/UploadWizardModal';

export default function Dashboard() {
  const { documents, studies, fetchData, activeStudy, selectedStudyId } = useTMFData();
  const { currentUser, currentRole, isDocumentInScope, canUpload, canQcPass } = useAuth();
  const navigate = useNavigate();
  
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [tableSearch, setTableSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const roleId = currentUser?.roleId || currentRole?.id || 'system_admin';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (fetchData) await fetchData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Scoped documents for current user
  const scopedDocs = documents.filter(isDocumentInScope);

  // Common workflow counts
  const countApproved = scopedDocs.filter(d => d.status === 'Effective' || d.status === 'Approved').length;
  const countPendingQC = scopedDocs.filter(d => (d.status === 'Submitted' || d.status === 'Draft' || d.qc_status === 'In Progress' || d.qc_status === 'Not Started' || d.lifecycle_stage === 5 || d.lifecycle_stage === 6) && d.qc_status !== 'Passed').length;
  const countPendingReview = scopedDocs.filter(d => d.status === 'QC Passed' || (d.qc_status === 'Passed' && d.content_review_status !== 'Passed' && d.status !== 'Approved' && d.status !== 'Effective')).length;
  const countPendingApproval = scopedDocs.filter(d => d.status === 'Approval Pending' || (d.content_review_status === 'Passed' && d.status !== 'Effective' && d.status !== 'Approved') || d.lifecycle_stage === 8).length;
  const countRevisionRequired = scopedDocs.filter(d => d.status === 'Revision Required' || d.status === 'QC Rejected' || d.qc_status === 'Failed' || d.qc_status === 'Query Raised' || d.content_review_status === 'Revision Required').length;
  const countRejected = countRevisionRequired;
  const countQueries = scopedDocs.filter(d => d.qc_status === 'Query Raised').length;
  const countArchived = scopedDocs.filter(d => d.status === 'Archived' || d.lifecycle_stage === 11).length;
  const countSuperseded = scopedDocs.filter(d => d.status === 'Superseded').length;
  const countPendingFiling = scopedDocs.filter(d => d.lifecycle_stage === 8 || (d.qc_status === 'Passed' && d.lifecycle_stage < 9)).length;

  // Role-specific counts
  const myUploadedDocs = scopedDocs.filter(d => d.uploaded_by_id === currentUser?.id || d.submitted_by_id === currentUser?.id);
  const assignedToMeDocs = scopedDocs.filter(d => d.assigned_reviewer_id === currentUser?.id || d.assigned_reviewer_name === currentUser?.name);
  const activeStudiesCount = studies.filter(s => s.status !== 'Closed' && s.status !== 'Archived').length;
  const totalSitesCount = studies.reduce((acc, s) => acc + (s.sites ? s.sites.length : 0), 0);
  
  // TMF Completeness Estimate
  const completenessPct = scopedDocs.length > 0 ? Math.min(100, Math.round((countApproved / Math.max(1, scopedDocs.length)) * 100)) : 85;

  // Comprehensive Document Review & Approval Workflow Filter Tabs
  let filterTabs = [
    { id: "All", label: "All Records", count: scopedDocs.length },
    { id: "PendingQC", label: "Pending QC", count: countPendingQC },
    { id: "PendingReview", label: "Pending Reviews", count: countPendingReview },
    { id: "PendingApproval", label: "Pending Approvals", count: countPendingApproval },
    { id: "RevisionRequired", label: "Revision Required", count: countRevisionRequired },
    { id: "Approved", label: "Approved / Effective", count: countApproved }
  ];

  if (roleId === 'site_user' || roleId === 'investigator') {
    filterTabs = [
      { id: "All", label: "All Site Records", count: scopedDocs.length },
      { id: "Mine", label: "Uploaded by Me", count: myUploadedDocs.length },
      { id: "PendingQC", label: "Pending QC", count: countPendingQC },
      { id: "RevisionRequired", label: "Revision Required", count: countRevisionRequired },
      { id: "Approved", label: "Accepted / Filed", count: countApproved }
    ];
  } else if (roleId === 'tmf_manager') {
    filterTabs = [
      { id: "All", label: "All Trial Documents", count: scopedDocs.length },
      { id: "AssignedMe", label: "Assigned to Me", count: assignedToMeDocs.length },
      { id: "PendingQC", label: "Pending QC", count: countPendingQC },
      { id: "PendingReview", label: "Pending Reviews", count: countPendingReview },
      { id: "PendingApproval", label: "Pending Approvals", count: countPendingApproval },
      { id: "RevisionRequired", label: "Revision Required", count: countRevisionRequired },
      { id: "Approved", label: "Approved / Effective", count: countApproved }
    ];
  } else if (roleId === 'doc_controller') {
    filterTabs = [
      { id: "All", label: "Repository Master", count: scopedDocs.length },
      { id: "PendingQC", label: "Pending QC Queue", count: countPendingQC },
      { id: "PendingReview", label: "Content Reviews", count: countPendingReview },
      { id: "PendingApproval", label: "Pending Approvals", count: countPendingApproval },
      { id: "RevisionRequired", label: "Revision Required", count: countRevisionRequired },
      { id: "Approved", label: "Filed / Effective", count: countApproved }
    ];
  }

  // Filtered documents list
  const filteredDocs = scopedDocs.filter(d => {
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      const match = (
        (d.document_id || '').toLowerCase().includes(q) ||
        (d.document_title || '').toLowerCase().includes(q) ||
        (d.folder_path || '').toLowerCase().includes(q) ||
        (d.site_id || '').toLowerCase().includes(q) ||
        (d.uploaded_by_name || '').toLowerCase().includes(q)
      );
      if (!match) return false;
    }

    if (activeCategory === "PendingQC" || activeCategory === "Review") {
      return (d.status === 'Submitted' || d.status === 'Draft' || d.qc_status === 'In Progress' || d.qc_status === 'Not Started' || d.lifecycle_stage === 5 || d.lifecycle_stage === 6) && d.qc_status !== 'Passed';
    }
    if (activeCategory === "PendingReview") {
      return d.status === 'QC Passed' || (d.qc_status === 'Passed' && d.content_review_status !== 'Passed' && d.status !== 'Approved' && d.status !== 'Effective');
    }
    if (activeCategory === "PendingApproval") {
      return d.status === 'Approval Pending' || (d.content_review_status === 'Passed' && d.status !== 'Effective' && d.status !== 'Approved') || d.lifecycle_stage === 8;
    }
    if (activeCategory === "RevisionRequired" || activeCategory === "Rejected") {
      return d.status === 'Revision Required' || d.status === 'QC Rejected' || d.qc_status === 'Failed' || d.qc_status === 'Query Raised' || d.content_review_status === 'Revision Required';
    }
    if (activeCategory === "Approved") {
      return d.status === 'Effective' || d.status === 'Approved';
    }
    if (activeCategory === "Queries") return d.qc_status === 'Query Raised';
    if (activeCategory === "Mine") return d.uploaded_by_id === currentUser?.id || d.submitted_by_id === currentUser?.id;
    if (activeCategory === "AssignedMe") return d.assigned_reviewer_id === currentUser?.id || d.assigned_reviewer_name === currentUser?.name;
    if (activeCategory === "PendingFiling") return d.lifecycle_stage === 8 || (d.qc_status === 'Passed' && d.lifecycle_stage < 9);
    if (activeCategory === "Superseded") return d.status === 'Superseded';
    if (activeCategory === "Archived") return d.status === 'Archived' || d.lifecycle_stage === 11;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 font-sans text-xs">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {roleId === 'system_admin' ? 'System Administrator Control Center' :
               roleId === 'tmf_manager' ? 'TMF Lead Quality & Oversight Dashboard' :
               roleId === 'ctm' ? 'Clinical Trial Manager (CTM) Workspace' :
               roleId === 'cra' ? 'CRA Site Monitoring & Ingestion Hub' :
               roleId === 'investigator' ? 'Principal Investigator (PI) Workspace' :
               roleId === 'site_user' ? 'Site User / CRC Workspace' :
               roleId === 'doc_controller' ? 'Document Controller & Indexing Hub' :
               'Trial Master File Management'}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
              {currentRole?.name}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Active Study: {studies.length === 0 ? (
              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                None (Protocol Initialization Pending)
              </span>
            ) : (
              <strong className="text-slate-800">{activeStudy?.id}: {activeStudy?.shortName || activeStudy?.title}</strong>
            )}
            {currentUser?.siteScope && currentUser.siteScope !== 'ALL' && (
              <span className="ml-2 font-mono text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-[11px]">
                Facility: {currentUser.siteScope}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded transition-colors cursor-pointer"
            title="Refresh Repository Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* Protocol Initialization Required Banner */}
      {studies.length === 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-amber-950">
                No Active Clinical Studies Configured
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed max-w-3xl">
                An active clinical study protocol is required to initiate eTMF filing and operations. Create or configure a study protocol in Study Management to begin.
              </p>
            </div>
          </div>
          {(roleId === 'system_admin' || roleId === 'tmf_manager' || roleId === 'ctm') && (
            <button
              onClick={() => navigate('/studies')}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> + Initialize Study Protocol →
            </button>
          )}
        </div>
      )}

      {/* Role-Specific Action Banners */}
      {(roleId === 'site_user' || roleId === 'investigator') && countRejected > 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
            <div>
              <p className="font-bold text-xs">Action Required: {countRejected} Document(s) Returned for Rework</p>
              <p className="text-[11px] text-rose-800 mt-0.5">
                The TMF Lead has rejected document(s) with specific correction notes. Please review and re-submit.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveCategory('Rejected')}
            className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded font-semibold text-xs shrink-0 cursor-pointer"
          >
            Inspect Rejected
          </button>
        </div>
      )}

      {roleId === 'tmf_manager' && assignedToMeDocs.length > 0 && (
        <div className="bg-blue-50 border border-blue-300 rounded p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-blue-950">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
            <div>
              <p className="font-bold text-xs">Assigned Reviewer Queue: {assignedToMeDocs.length} Document(s) Waiting for Your QC</p>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Site staff have submitted records directly routing to you for 10-point Quality Control verification.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/qc-queue')}
            className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded font-semibold text-xs shrink-0 cursor-pointer"
          >
            Open QC Queue
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5-GATE CLINICAL DOCUMENT REVIEW & APPROVAL WORKFLOW HUB */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-xl p-4 text-white shadow-md border border-indigo-900/50 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold tracking-wide">Document Review &amp; Approval Pipeline</h2>
            <span className="text-[10px] text-blue-300 font-mono">21 CFR Part 11 &amp; ICH GCP E6</span>
          </div>
          <span className="text-[10px] bg-blue-900/60 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded font-mono">
            Maker-Checker &amp; Concurrency Control Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Gate 2: Pending QC */}
          <div 
            onClick={() => setActiveCategory('PendingQC')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeCategory === 'PendingQC' 
                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 shadow-md' 
                : 'bg-white/10 hover:bg-white/15 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Gate 2: Pending QC</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{countPendingQC}</p>
            <p className="text-[10px] text-amber-200/80 mt-0.5">Doc Controller Inspection</p>
          </div>

          {/* Gate 3: Pending Reviews */}
          <div 
            onClick={() => setActiveCategory('PendingReview')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeCategory === 'PendingReview' 
                ? 'bg-sky-500/20 border-sky-400 ring-2 ring-sky-400/40 shadow-md' 
                : 'bg-white/10 hover:bg-white/15 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-sky-300 font-bold uppercase tracking-wider">Gate 3: Content Review</span>
              <Eye className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{countPendingReview}</p>
            <p className="text-[10px] text-sky-200/80 mt-0.5">TMF Lead &amp; CRA Redlines</p>
          </div>

          {/* Gate 4: Pending Approvals */}
          <div 
            onClick={() => setActiveCategory('PendingApproval')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeCategory === 'PendingApproval' 
                ? 'bg-purple-500/20 border-purple-400 ring-2 ring-purple-400/40 shadow-md' 
                : 'bg-white/10 hover:bg-white/15 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Gate 4: Admin Approval</span>
              <Award className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{countPendingApproval}</p>
            <p className="text-[10px] text-purple-200/80 mt-0.5">Mandatory Admin E-Sign</p>
          </div>

          {/* Revision Required */}
          <div 
            onClick={() => setActiveCategory('RevisionRequired')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeCategory === 'RevisionRequired' 
                ? 'bg-rose-500/20 border-rose-400 ring-2 ring-rose-400/40 shadow-md' 
                : 'bg-white/10 hover:bg-white/15 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider">Revision Required</span>
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{countRevisionRequired}</p>
            <p className="text-[10px] text-rose-200/80 mt-0.5">Returned to Uploader</p>
          </div>

          {/* Gate 5: Approved / Effective */}
          <div 
            onClick={() => setActiveCategory('Approved')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeCategory === 'Approved' 
                ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/40 shadow-md' 
                : 'bg-white/10 hover:bg-white/15 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Gate 5: Effective</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{countApproved}</p>
            <p className="text-[10px] text-emerald-200/80 mt-0.5">Sealed &amp; TMF Filed</p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SAP FIORI / VEEVA VAULT KPI TILES */}
      {/* ============================================================== */}

      {/* 1. SYSTEM ADMIN TILES */}
      {roleId === 'system_admin' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-slate-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Total Studies</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{studies.length}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-blue-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Active Studies</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{activeStudiesCount}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-indigo-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Total Sites</p>
            <p className="text-2xl font-bold text-indigo-700 mt-1">{totalSitesCount}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-slate-700 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Total Docs</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{documents.length}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-amber-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Pending QC</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{countPendingQC}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-rose-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Rejected</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">{countRejected}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-purple-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Pending Filing</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{countPendingFiling}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-emerald-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Archived</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{countArchived}</p>
          </div>
        </div>
      )}

      {/* 2. TMF LEAD TILES */}
      {roleId === 'tmf_manager' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-slate-700 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Total Documents</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{scopedDocs.length}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-amber-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Pending QC</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{countPendingQC}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-blue-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">In Progress</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {scopedDocs.filter(d => d.qc_status === 'In Progress').length}
            </p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-rose-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">QC Rejected</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">{countRejected}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-emerald-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">QC Accepted</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{countApproved}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-slate-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Missing (EDL)</p>
            <p className="text-2xl font-bold text-slate-700 mt-1">
              {scopedDocs.filter(d => d.status === 'Placeholder').length}
            </p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-purple-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Pending Filing</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{countPendingFiling}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-blue-800 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Completeness</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">{completenessPct}%</p>
          </div>
        </div>
      )}

      {/* 3. CTM TILES */}
      {roleId === 'ctm' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-blue-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Assigned Studies</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">1</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-indigo-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Total Sites</p>
            <p className="text-2xl font-bold text-indigo-700 mt-1">{activeStudy?.sites?.length || 2}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-slate-700 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Total Docs</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{scopedDocs.length}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-purple-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Pending Approvals</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{countPendingFiling}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-amber-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Missing Docs</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{scopedDocs.filter(d => d.status === 'Placeholder').length}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-emerald-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Study Progress</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">78%</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-blue-800 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Completeness</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">{completenessPct}%</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-rose-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Pending Actions</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">{countPendingQC + countQueries}</p>
          </div>
        </div>
      )}

      {/* 4. CRA TILES */}
      {roleId === 'cra' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-blue-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Assigned Sites</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">2</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-slate-700 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Site Documents</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{scopedDocs.length}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-emerald-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Uploaded by Me</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{myUploadedDocs.length}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-amber-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Pending QC</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{countPendingQC}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-rose-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Returned for Rework</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">{countRejected}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-purple-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Open Queries</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{countQueries}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-blue-800 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Completeness</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">{completenessPct}%</p>
          </div>
        </div>
      )}

      {/* 5. SITE USER & INVESTIGATOR TILES */}
      {(roleId === 'site_user' || roleId === 'investigator') && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-emerald-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Facility Status</p>
            <p className="text-base font-bold text-emerald-800 mt-1 truncate">Active &amp; Initiated</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-slate-700 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Required Checklist</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">14</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-blue-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Uploaded Docs</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{myUploadedDocs.length}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-amber-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Pending QC</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{countPendingQC}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-rose-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Action Required</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">{countRejected}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-emerald-700 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Accepted &amp; Filed</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{countApproved}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-purple-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Resubmissions</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{countRejected + countQueries}</p>
          </div>
        </div>
      )}

      {/* 6. DOCUMENT CONTROLLER TILES */}
      {roleId === 'doc_controller' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-emerald-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Final / Effective</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{countApproved}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-blue-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Pending Filing</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{countPendingFiling}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-amber-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">In Review</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{countPendingQC}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-purple-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Superseded</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{countSuperseded}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-slate-700 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Archived</p>
            <p className="text-2xl font-bold text-slate-700 mt-1">{countArchived}</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-indigo-600 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Batch Scanning</p>
            <p className="text-2xl font-bold text-indigo-700 mt-1">2 Batches</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 border-t-2 border-t-blue-800 shadow-2xs">
            <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Daily Indexed</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">12</p>
          </div>
        </div>
      )}

      {/* Main Filterable Documents Table (SAS / Veeva Grid Style) */}
      <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden">
        
        {/* Filter Tabs & Search Header Bar */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === tab.id
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  activeCategory === tab.id ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table records..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded pl-8 pr-3 py-1 text-xs text-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Clean Responsive Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-2.5 px-3">Document ID</th>
                <th className="py-2.5 px-3">Document Title</th>
                <th className="py-2.5 px-3">Study / Site</th>
                <th className="py-2.5 px-3">Transmittal Routing</th>
                <th className="py-2.5 px-3">Status &amp; Stage</th>
                <th className="py-2.5 px-3">Filing Date</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-500 space-y-2">
                    <p className="font-medium">No clinical records found in this view.</p>
                    {canUpload && (
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-3 py-1.5 bg-blue-700 text-white hover:bg-blue-800 rounded font-semibold text-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload Document
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const isAssignedToMe = doc.assigned_reviewer_id === currentUser?.id || doc.assigned_reviewer_name === currentUser?.name;
                  const isUploadedByMe = doc.uploaded_by_id === currentUser?.id || doc.submitted_by_id === currentUser?.id;
                  
                  return (
                    <tr 
                      key={doc.document_id}
                      onClick={() => setSelectedDoc(doc)}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                        <div className="flex items-center gap-1.5">
                          <span>{doc.document_id}</span>
                          {isAssignedToMe && (
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 border border-blue-300 rounded text-[9px] font-bold">
                              Assigned
                            </span>
                          )}
                          {isUploadedByMe && (roleId === 'site_user' || roleId === 'investigator') && (
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[9px] font-bold">
                              Mine
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs">
                        <p className="truncate text-slate-900">{doc.document_title}</p>
                        <p className="text-[11px] text-slate-500 font-mono font-normal">v{doc.version_number} | {doc.file_name || 'Clinical File'}</p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">
                        <span className="font-bold text-slate-900">{doc.study_id}</span>
                        {doc.site_id && (
                          <span className="block text-[11px] text-slate-600 font-mono">{doc.site_id}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                        {doc.submitted_by_name || doc.assigned_reviewer_name ? (
                          <div>
                            <span className="text-slate-900 font-semibold">{doc.submitted_by_name || doc.uploaded_by_name || 'Uploader'}</span>
                            <span className="text-slate-500 block text-[10px]">
                              to {typeof doc.assigned_reviewer_name === 'string' ? doc.assigned_reviewer_name.split(' ')[0] : (doc.assigned_reviewer_name?.name || 'TMF Lead')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Central Ingestion</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            doc.status === 'Effective' || doc.status === 'Approved' || doc.qc_status === 'Passed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : doc.qc_status === 'Query Raised'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : doc.qc_status === 'Failed' || doc.status === 'Rejected/Correction'
                              ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}>
                            {doc.status}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            Stage {doc.lifecycle_stage || 5}/11
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {doc.filing_date || doc.document_date || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDoc(doc);
                          }}
                          className="px-2 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-300 rounded font-semibold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Viewer Drawer */}
      {selectedDoc && (
        <DocumentViewerDrawer doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}

      {/* Upload Wizard Modal */}
      {showUploadModal && (
        <UploadWizardModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  );
}
