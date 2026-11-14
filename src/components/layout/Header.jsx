import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Upload, 
  Bell, 
  User, 
  HelpCircle, 
  LogOut, 
  Menu, 
  X,
  CheckCircle2,
  Database,
  Trash2,
  ChevronDown,
  Building,
  Shield,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTMFData } from '../../context/TMFDataContext';
import UploadWizardModal from '../document/UploadWizardModal';
import DocumentViewerDrawer from '../document/DocumentViewerDrawer';
import SystemDocumentationModal from './SystemDocumentationModal';
import logoImg from '../../assets/vigithink_logo.png';

export default function Header({ toggleSidebar, isSidebarOpen = true }) {
  const navigate = useNavigate();
  const { currentUser, currentRole, logout, demoUsers, switchRole, switchUserPersona, hasPermission } = useAuth();
  const isSystemAdmin = currentUser?.roleId === 'system_admin' || currentUser?.role === 'system_admin';
  const canSwitchPersona = isSystemAdmin || currentUser?.roleId === 'tmf_manager' || currentUser?.role === 'tmf_manager';
  const { 
    searchQuery, 
    setSearchQuery, 
    studies, 
    selectedStudyId, 
    setSelectedStudyId,
    activeStudy,
    documents,
    clearAllTestData
  } = useTMFData();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showStudySelector, setShowStudySelector] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDataMgmtModal, setShowDataMgmtModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [mgmtSuccessMsg, setMgmtSuccessMsg] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const studyDocs = documents.filter(d => d.study_id === selectedStudyId);
  const pendingQc = studyDocs.filter(d => d.qc_status === 'In Progress' || d.qc_status === 'Query Raised');
  const missingPlaceholders = studyDocs.filter(d => d.status === 'Placeholder');

  const alertsList = [
    ...pendingQc.map(d => ({
      id: `alt-qc-${d.document_id}`,
      type: "QC Review Pending",
      message: `${d.document_id} (${d.document_title}) is awaiting Quality Clearance.`,
      date: d.filing_date || 'Today',
      severity: "amber"
    })),
    ...missingPlaceholders.map(d => ({
      id: `alt-gap-${d.document_id}`,
      type: "Missing Essential Record",
      message: `${d.document_title} is marked as missing in Active File Plan.`,
      date: "Immediate",
      severity: "rose"
    }))
  ];

  const handleExecuteSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    }
  };

  const matchingSearchResults = documents.filter(d => {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase().replace(/%/g, '');
    return (
      (d.document_id || '').toLowerCase().includes(q) ||
      (d.document_title || '').toLowerCase().includes(q) ||
      (d.study_id || '').toLowerCase().includes(q) ||
      (d.folder_path || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* Veeva Vault / SAP Fiori Enterprise Shell Bar */}
      <header className="bg-[#0B2240] text-white border-b border-[#1A365D] px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shadow-md">
        
        {/* Left: Hamburger, Brand Identity & Study Selector */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button 
            onClick={toggleSidebar}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="VigiThink Logo" className="h-6 sm:h-7 w-auto object-contain bg-white/95 rounded px-1 py-0.5" />
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight leading-none">VigiThink eTMF</span>
              <span className="text-[10px] text-blue-200 font-medium tracking-wide">Enterprise Clinical Vault</span>
            </div>
          </Link>

          <div className="h-5 w-px bg-white/20 hidden md:block" />

          {/* Active Study Pill / Switcher */}
          {currentUser?.studyScope && currentUser.studyScope !== 'ALL' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-white border border-white/15 rounded text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-bold">{activeStudy?.id || 'CLI-001'}</span>
              <span className="text-slate-300 hidden lg:inline truncate max-w-[150px]">({activeStudy?.shortName})</span>
            </div>
          ) : (
            <button 
              onClick={() => setShowStudySelector(!showStudySelector)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded text-xs font-medium transition-colors cursor-pointer"
              title="Select Active Study"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-bold">{activeStudy?.id || 'CLI-001'}</span>
              <span className="text-slate-300 hidden lg:inline truncate max-w-[150px]">({activeStudy?.shortName})</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
            </button>
          )}
        </div>

        {/* Center: Global Document Search */}
        <form onSubmit={handleExecuteSearch} className="flex-1 max-w-sm lg:max-w-md hidden md:flex items-center">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search clinical records by ID, title, artifact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#132E52] focus:bg-[#183965] border border-white/15 focus:border-blue-400 rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>
        </form>

        {/* Right Actions: Upload CTA, Notifications, SOP Guide & Profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {hasPermission('upload') && (
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          )}

          <button 
            onClick={() => setShowAlerts(true)}
            title="Quality Alerts & Notifications" 
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            {alertsList.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>

          {isSystemAdmin && (
            <button 
              onClick={() => setShowDataMgmtModal(true)}
              title="Database Administration" 
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4" />
            </button>
          )}

          <button 
            onClick={() => setShowHelpModal(true)}
            title="TMF SOP Guidelines & Help" 
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-white/20 mx-0.5 hidden sm:block" />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowRoleSelector(!showRoleSelector)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-white/10 rounded transition-colors cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded bg-blue-700 text-white font-bold text-xs flex items-center justify-center border border-white/20">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:block leading-tight">
                <p className="text-xs font-semibold text-white truncate max-w-[120px]">{currentUser?.name}</p>
                <p className="text-[10px] text-blue-200 truncate">{currentRole?.name}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-300 hidden lg:block" />
            </button>

            {showRoleSelector && (
              <div className="absolute right-0 mt-2 w-72 bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-200 z-50 p-3 space-y-2.5 text-xs font-sans">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 truncate">{currentUser?.name}</p>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {currentUser?.roleId === 'site_user' ? 'Site CRC' : currentRole?.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">{currentUser?.designation || currentRole?.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Scope: {currentUser?.studyScope || 'CLI-001'} | {currentUser?.siteScope || 'All Sites'}
                  </p>
                  <div className="text-[10px] text-slate-600 border-t border-slate-200 pt-1 leading-snug">
                    {currentUser?.roleId === 'site_user' && "Site User: Permitted to upload site trial records, enter metadata, and remediate rejected files."}
                    {currentUser?.roleId === 'tmf_manager' && "TMF Lead: Full oversight, 10-point QC verification, approvals, and filing authority."}
                    {currentUser?.roleId === 'ctm' && "Clinical Trial Manager: Study oversight, approvals, and milestone management."}
                    {currentUser?.roleId === 'cra' && "CRA: Monitoring visit reporting, site file verification, and collection."}
                    {currentUser?.roleId === 'system_admin' && "System Administrator: Enterprise configuration, user management, and system governance."}
                    {currentUser?.roleId === 'doc_controller' && "Document Controller: Scanning intake, central indexing, and repository validation."}
                  </div>
                </div>

                {/* Supervisor Switcher (For Demo & Admin) */}
                {canSwitchPersona && (
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Switch Role Workspace:</p>
                    <div className="max-h-36 overflow-y-auto space-y-0.5">
                      {(demoUsers || []).filter(u => u.id !== currentUser.id).map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            switchUserPersona(u.id);
                            setShowRoleSelector(false);
                          }}
                          className="w-full text-left px-2 py-1 hover:bg-slate-100 rounded text-[11px] text-slate-700 hover:text-blue-700 flex items-center justify-between cursor-pointer"
                        >
                          <span className="truncate">{u.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{u.roleId}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-rose-700 hover:bg-rose-50 rounded font-semibold cursor-pointer transition-colors text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Select Active Study Modal */}
      {showStudySelector && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 max-w-md w-full p-4 space-y-3 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Select Active Clinical Study</h3>
              <button onClick={() => setShowStudySelector(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {studies.map(study => (
                <button
                  key={study.id}
                  onClick={() => {
                    setSelectedStudyId(study.id);
                    setShowStudySelector(false);
                  }}
                  className={`w-full text-left p-2.5 rounded border transition-colors cursor-pointer ${
                    study.id === selectedStudyId ? 'bg-blue-50 border-blue-400 text-blue-950 font-semibold' : 'hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs text-slate-900">{study.id}: {study.shortName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{study.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global Search Results Modal */}
      {showSearchResults && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden text-xs font-sans">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-sm">Search Results for "{searchQuery}" ({matchingSearchResults.length})</h3>
              </div>
              <button onClick={() => setShowSearchResults(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {matchingSearchResults.length === 0 ? (
                <p className="p-8 text-center text-slate-500">No matching clinical records found in repository.</p>
              ) : (
                matchingSearchResults.map(d => (
                  <div key={d.document_id} className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between hover:bg-blue-50/50 transition-colors">
                    <div>
                      <button 
                        onClick={() => { setShowSearchResults(false); setSelectedDoc(d); }}
                        className="font-bold text-blue-700 hover:underline text-xs cursor-pointer block text-left"
                      >
                        {d.document_id}: {d.document_title}
                      </button>
                      <p className="text-[11px] text-slate-500 mt-0.5">Study: {d.study_id} | Zone {d.tmf_zone_id} | {d.folder_path}</p>
                    </div>
                    <button 
                      onClick={() => { setShowSearchResults(false); setSelectedDoc(d); }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs cursor-pointer"
                    >
                      View Record
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showAlerts && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden text-xs font-sans">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Quality Alerts &amp; Notifications ({alertsList.length})</h3>
              </div>
              <button onClick={() => setShowAlerts(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {alertsList.length === 0 ? (
                <p className="p-6 text-center text-slate-500">All clear! No pending quality review notifications.</p>
              ) : (
                alertsList.map(a => (
                  <div 
                    key={a.id} 
                    onClick={() => {
                      setShowAlerts(false);
                      if (a.type === "QC Review Pending") {
                        navigate('/qc-queue');
                      } else if (a.type === "Missing Essential Record") {
                        navigate('/edl');
                      } else {
                        navigate('/explorer');
                      }
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded space-y-1 cursor-pointer transition-colors group"
                  >
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${a.severity === 'rose' ? 'bg-rose-50 text-rose-800 border border-rose-300' : 'bg-amber-50 text-amber-800 border border-amber-300'}`}>
                        {a.type}
                      </span>
                      <span className="text-[10px] text-slate-500 group-hover:text-blue-600 font-medium">{a.date} · Resolve →</span>
                    </div>
                    <p className="text-slate-800 text-xs">{a.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Documentation & Compliance Reference Modal */}
      {showHelpModal && (
        <SystemDocumentationModal onClose={() => setShowHelpModal(false)} />
      )}

      {/* Upload Wizard Modal */}
      {isUploadOpen && (
        <UploadWizardModal onClose={() => setIsUploadOpen(false)} />
      )}

      {/* Document Viewer Drawer */}
      {selectedDoc && (
        <DocumentViewerDrawer doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}

      {/* Database Management Modal */}
      {showDataMgmtModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-lg w-full max-w-lg shadow-2xl overflow-hidden text-xs font-sans">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-sm">Database &amp; Repository Administration</h3>
              </div>
              <button 
                onClick={() => { setShowDataMgmtModal(false); setMgmtSuccessMsg(""); }} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <p className="text-lg font-bold text-blue-700">{documents.length}</p>
                  <p className="text-[11px] text-slate-600">Documents</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <p className="text-lg font-bold text-slate-800">{studies.length}</p>
                  <p className="text-[11px] text-slate-600">Studies</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <p className="text-lg font-bold text-emerald-700">Online</p>
                  <p className="text-[11px] text-slate-600">Repository</p>
                </div>
              </div>

              {mgmtSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded flex items-center gap-2 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{mgmtSuccessMsg}</span>
                </div>
              )}

              <div className="border border-rose-300 bg-rose-50/50 p-3 rounded space-y-2">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <Trash2 className="w-4 h-4 text-rose-700 shrink-0" />
                  Reset Working Documents &amp; Test Logs
                </div>
                <p className="text-[11px] text-slate-600">
                  Removes uploaded test documents and custom folders while preserving study protocols and site master setups.
                </p>
                <button
                  disabled={isClearing}
                  onClick={async () => {
                    setIsClearing(true);
                    const ok = await clearAllTestData(false, currentUser);
                    setIsClearing(false);
                    if (ok) {
                      setMgmtSuccessMsg("Repository cleared successfully (0 documents).");
                    }
                  }}
                  className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded transition-colors cursor-pointer disabled:opacity-50 text-xs"
                >
                  Clear Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
