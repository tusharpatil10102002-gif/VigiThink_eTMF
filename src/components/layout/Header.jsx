import React, { useState } from 'react';
import { 
  Search, 
  Upload, 
  Bell, 
  User, 
  Home, 
  HelpCircle, 
  LogOut, 
  Menu, 
  Eye, 
  X,
  CheckCircle2,
  Download,
  Database,
  Trash2,
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTMFData } from '../../context/TMFDataContext';
import UploadWizardModal from '../document/UploadWizardModal';
import DocumentViewerDrawer from '../document/DocumentViewerDrawer';
import TrainingCurriculumModal from '../training/TrainingCurriculumModal';
import logoImg from '../../assets/vigithink_logo.png';

export default function Header({ toggleSidebar }) {
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
    downloadDocumentFile,
    clearAllTestData,
    resetDemoData
  } = useTMFData();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showStudySelector, setShowStudySelector] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
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
      message: `${d.document_id} (${d.document_title}) is awaiting SOP-TMF-04 Quality Clearance.`,
      date: d.filing_date,
      severity: "amber"
    })),
    ...missingPlaceholders.map(d => ({
      id: `alt-gap-${d.document_id}`,
      type: "Missing Essential Record",
      message: `${d.document_title} is flagged as missing placeholder gap in Active File Plan.`,
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
      {/* Clean Single-Row SaaS Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
        
        {/* Left: Sidebar Toggle, Brand Logo & Study Selector Pill */}
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebar}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          <a href="/" className="flex items-center gap-2.5">
            <img src={logoImg} alt="VigiThink Logo" className="h-7 w-auto object-contain" />
            <div className="hidden sm:block">
              <span className="text-sm font-bold text-slate-900 tracking-tight">VigiThink</span>
              <span className="text-sm font-semibold text-blue-600 ml-1">eTMF</span>
            </div>
          </a>

          <div className="h-4 w-px bg-slate-200 hidden md:block" />

          {/* Study Selector Button */}
          <button 
            onClick={() => setShowStudySelector(!showStudySelector)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-900">{activeStudy.id}</span>
            <span className="text-slate-500 hidden lg:inline truncate max-w-[160px]">— {activeStudy.shortName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Center: Clean Search Input */}
        <form onSubmit={handleExecuteSearch} className="flex-1 max-w-md hidden md:flex items-center">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents by ID, title, or folder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>
        </form>

        {/* Right: Upload CTA, Notifications & User Profile */}
        <div className="flex items-center gap-2">
          {hasPermission('upload') && (
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Document</span>
            </button>
          )}

          <button 
            onClick={() => setShowAlerts(true)}
            title="Notifications" 
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            {alertsList.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>

          {isSystemAdmin && (
            <button 
              onClick={() => setShowDataMgmtModal(true)}
              title="Database Management" 
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4" />
            </button>
          )}

          <button 
            onClick={() => setShowHelpModal(true)}
            title="Training & SOP Guide" 
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* User Profile Pill */}
          <div className="relative">
            <button 
              onClick={() => setShowRoleSelector(!showRoleSelector)}
              className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-slate-800 leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-none">{currentRole.name}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {showRoleSelector && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 z-50 p-3 space-y-2.5 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <p className="font-bold text-slate-900 text-xs">{currentUser.name}</p>
                  <p className="text-[11px] text-blue-600 font-medium">{currentRole.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Scope: {currentUser.studyScope || 'CLIN-001'} · {currentUser.siteScope || 'All Sites'}
                  </p>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Study Modal */}
      {showStudySelector && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-3 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Select Active Clinical Study</h3>
              <button onClick={() => setShowStudySelector(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {studies.map(study => (
                <button
                  key={study.id}
                  onClick={() => {
                    setSelectedStudyId(study.id);
                    setShowStudySelector(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                    study.id === selectedStudyId ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-semibold' : 'hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs">{study.id} — {study.shortName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{study.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Results Modal */}
      {showSearchResults && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden text-xs font-sans">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Search Results for "{searchQuery}" ({matchingSearchResults.length})</h3>
              </div>
              <button onClick={() => setShowSearchResults(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {matchingSearchResults.length === 0 ? (
                <p className="p-8 text-center text-slate-400">No matching documents found.</p>
              ) : (
                matchingSearchResults.map(d => (
                  <div key={d.document_id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-blue-50/40 transition-colors">
                    <div>
                      <button 
                        onClick={() => { setShowSearchResults(false); setSelectedDoc(d); }}
                        className="font-bold text-blue-600 hover:underline text-xs cursor-pointer block text-left"
                      >
                        {d.document_id} — {d.document_title}
                      </button>
                      <p className="text-[11px] text-slate-500 mt-0.5">Study: {d.study_id} · Zone {d.tmf_zone_id} · {d.folder_path}</p>
                    </div>
                    <button 
                      onClick={() => { setShowSearchResults(false); setSelectedDoc(d); }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications / Quality Alerts Modal */}
      {showAlerts && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden text-xs font-sans">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Notifications ({alertsList.length})</h3>
              </div>
              <button onClick={() => setShowAlerts(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {alertsList.length === 0 ? (
                <p className="p-6 text-center text-slate-400">All clear! No pending quality alerts.</p>
              ) : (
                alertsList.map(a => (
                  <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${a.severity === 'rose' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {a.type}
                      </span>
                      <span className="text-[10px] text-slate-400">{a.date}</span>
                    </div>
                    <p className="text-slate-700 text-xs">{a.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Training & SOP Modal */}
      {showHelpModal && (
        <TrainingCurriculumModal onClose={() => setShowHelpModal(false)} />
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden text-xs font-sans">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Database & Test Data Management</h3>
              </div>
              <button 
                onClick={() => { setShowDataMgmtModal(false); setMgmtSuccessMsg(""); }} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="text-lg font-bold text-blue-600">{documents.length}</p>
                  <p className="text-[11px] text-slate-500">Documents</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="text-lg font-bold text-slate-800">{studies.length}</p>
                  <p className="text-[11px] text-slate-500">Studies</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="text-lg font-bold text-emerald-600">Active</p>
                  <p className="text-[11px] text-slate-500">Database</p>
                </div>
              </div>

              {mgmtSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{mgmtSuccessMsg}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="border border-rose-200 bg-rose-50/30 p-3.5 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                    Wipe All Documents & Logs (Clean Slate)
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Removes all uploaded documents, custom folders, and logs while keeping study protocols active.
                  </p>
                  <button
                    disabled={isClearing}
                    onClick={async () => {
                      setIsClearing(true);
                      const ok = await clearAllTestData(false, currentUser);
                      setIsClearing(false);
                      if (ok) {
                        setMgmtSuccessMsg("Database wiped clean (0 documents).");
                      }
                    }}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Wipe All Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
