import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTMFData } from '../context/TMFDataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Folder, 
  Search, 
  Menu, 
  Plus, 
  Download, 
  Copy, 
  FileSpreadsheet, 
  ListOrdered, 
  Calendar, 
  MoveRight, 
  Eye,
  ChevronRight,
  FileText,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Users,
  Building2,
  Building,
  Edit,
  Edit3
} from 'lucide-react';
import DocumentViewerDrawer from '../components/document/DocumentViewerDrawer';
import FilePlanModal from '../components/document/FilePlanModal';
import CheckOutModal from '../components/document/CheckOutModal';
import UploadWizardModal from '../components/document/UploadWizardModal';
import AddPlaceholderModal from '../components/document/AddPlaceholderModal';
import CopyDocumentModal from '../components/document/CopyDocumentModal';
import MoveDocumentModal from '../components/document/MoveDocumentModal';
import MasterIndexModal from '../components/document/MasterIndexModal';

export default function TmfExplorer() {
  const { 
    studies, 
    documents, 
    zonesTaxonomy, 
    selectedStudyId, 
    setSelectedStudyId, 
    activeStudy,
    downloadDocumentFile,
    exportDocumentManifestCsv,
    toggleDocumentLock,
    deleteDocument,
    renameDocument,
    customFolders,
    createCustomFolder,
    renameCustomFolder,
    deleteCustomFolder
  } = useTMFData();
  const { isDocumentInScope, currentUser, hasPermission, allUsers, allRoles } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSort, setSelectedSort] = useState("");
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [activeCustomFolder, setActiveCustomFolder] = useState(null);
  
  // Navigation drill-down state synced with URL query params
  const [activeStudyFolder, setActiveStudyFolder] = useState(searchParams.get('study') || null);
  const [activeZoneId, setActiveZoneId] = useState(searchParams.get('zone') || null);
  const [activeSectionId, setActiveSectionId] = useState(searchParams.get('section') || null);
  const [activeSiteId, setActiveSiteId] = useState(searchParams.get('site') || null);
  const [activeViewMode, setActiveViewMode] = useState(searchParams.get('view') || null);

  // Sync state whenever URL searchParams change (e.g. from Sidebar clicks)
  useEffect(() => {
    const urlStudy = searchParams.get('study') || null;
    const urlZone = searchParams.get('zone') || null;
    const urlSection = searchParams.get('section') || null;
    const urlSite = searchParams.get('site') || null;
    const urlView = searchParams.get('view') || null;

    setActiveStudyFolder(urlStudy);
    setActiveZoneId(urlZone);
    setActiveSectionId(urlSection);
    setActiveSiteId(urlSite);
    setActiveViewMode(urlView);

    if (urlStudy && urlStudy !== selectedStudyId) {
      setSelectedStudyId(urlStudy);
    }
  }, [searchParams]);

  // Helper to update both state and URL searchParams
  const updateExplorerRoute = ({ study = null, zone = null, section = null, site = null, view = null }) => {
    const params = {};
    if (study) params.study = study;
    if (zone) params.zone = zone;
    if (section) params.section = section;
    if (site) params.site = site;
    if (view) params.view = view;
    setActiveCustomFolder(null);
    setSearchParams(params);
    if (study) setSelectedStudyId(study);
  };

  const [selectedDoc, setSelectedDoc] = useState(null);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPlaceholderModal, setShowPlaceholderModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showMasterIndexModal, setShowMasterIndexModal] = useState(false);
  const [showFilePlanModal, setShowFilePlanModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);

  const handleCreateNewFolderSubmit = (e) => {
    if (e) e.preventDefault();
    if (!newFolderName.trim()) return;
    createCustomFolder({
      name: newFolderName.trim(),
      study_id: activeStudyFolder || selectedStudyId,
      tmf_zone_id: activeZoneId || null,
      tmf_section_id: activeSectionId || null,
      site_id: activeSiteId || null
    }, currentUser);
    setNewFolderName("");
    setShowNewFolderInput(false);
  };

  const handleQuickRenameDoc = (doc) => {
    const newTitle = window.prompt("Enter new Document Title / Name:", doc.document_title);
    if (!newTitle || !newTitle.trim()) return;
    const newFileName = window.prompt("Enter File Name (optional):", doc.file_name || `${newTitle.trim()}.pdf`);
    renameDocument(doc.document_id, newTitle.trim(), (newFileName || doc.file_name || "").trim(), currentUser);
  };

  // Calculate live metrics per study from MongoDB documents
  const getStudyMetrics = (studyId) => {
    const studyDocs = documents.filter(d => d.study_id === studyId);
    const completed = studyDocs.filter(d => d.status === 'Effective' || d.status === 'Approved').length;
    const inQC = studyDocs.filter(d => d.qc_status === 'In Progress' || d.qc_status === 'Query Raised').length;
    const missing = studyDocs.filter(d => d.status === 'Placeholder').length;
    const inProgress = studyDocs.filter(d => d.status === 'Draft').length;
    const total = studyDocs.length;
    const expected = total + (missing === 0 ? 15 : missing);

    return { total, completed, inProgress, inQC, missing, expected };
  };

  // Filtered documents inside active drilldown
  const activeStudyIdToUse = activeStudyFolder || selectedStudyId;
  const activeStudyObj = studies.find(s => s.id === activeStudyIdToUse) || activeStudy;
  const currentStudyDocs = documents.filter(d => {
    if (d.study_id !== activeStudyIdToUse) return false;
    if (activeZoneId && d.tmf_zone_id !== activeZoneId) return false;
    if (activeSectionId && d.tmf_section_id !== activeSectionId) return false;
    if (activeSiteId && d.site_id && d.site_id !== activeSiteId) return false;
    if (activeCustomFolder && d.custom_folder_name !== activeCustomFolder && !(d.folder_path || '').includes(activeCustomFolder)) return false;
    if (!isDocumentInScope(d)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.document_id.toLowerCase().includes(q) ||
        d.document_title.toLowerCase().includes(q) ||
        (d.folder_path || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const matchingCustomFolders = (customFolders || []).filter(f => {
    if (f.study_id !== activeStudyIdToUse) return false;
    if (activeZoneId && f.tmf_zone_id && f.tmf_zone_id !== activeZoneId) return false;
    if (!activeZoneId && f.tmf_zone_id) return false;
    if (activeSiteId && f.site_id && f.site_id !== activeSiteId) return false;
    return true;
  });

  const activeZoneObj = zonesTaxonomy.find(z => z.id === activeZoneId);

  return (
    <div className="p-4 space-y-3 bg-slate-100 min-h-full text-xs font-sans">
      
      {/* Breadcrumb Header Bar */}
      <div className="bg-slate-200/80 border border-slate-300 rounded px-3 py-1.5 flex items-center justify-between text-[11px] font-sans">
        <div className="flex items-center gap-1.5 text-slate-700 flex-wrap">
          <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-100" />
          <span 
            onClick={() => updateExplorerRoute({})}
            className="font-bold text-slate-900 cursor-pointer hover:underline"
          >
            Repository
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span 
            onClick={() => updateExplorerRoute({ study: activeStudyFolder })}
            className={`cursor-pointer hover:underline ${!activeZoneId && !activeSiteId && !activeViewMode ? 'font-bold text-blue-900' : ''}`}
          >
            {activeViewMode === 'students'
              ? 'Investigational Trial Sites & Personnel Folders'
              : activeStudyFolder
              ? `Study : ${activeStudyFolder} (${activeStudyObj?.shortName || ''})`
              : 'CM Folder (All Studies)'}
          </span>
          {activeSiteId && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span 
                onClick={() => updateExplorerRoute({ study: activeStudyFolder, site: activeSiteId })}
                className={`cursor-pointer hover:underline inline-flex items-center gap-1 ${!activeZoneId ? 'font-bold text-blue-900' : ''}`}
              >
                <Building className="w-3 h-3 text-slate-500" /> {activeSiteId}
              </span>
            </>
          )}
          {activeZoneId && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span 
                onClick={() => updateExplorerRoute({ study: activeStudyFolder, site: activeSiteId, zone: activeZoneId })}
                className={`cursor-pointer hover:underline ${!activeSectionId ? 'font-bold text-blue-900' : ''}`}
              >
                Zone {activeZoneId}: {activeZoneObj?.name}
              </span>
            </>
          )}
          {activeSectionId && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="font-bold text-blue-900">
                Section {activeSectionId}
              </span>
            </>
          )}
        </div>

        {(activeStudyFolder || activeZoneId || activeSiteId || activeViewMode) && (
          <button
            onClick={() => {
              if (activeSectionId) updateExplorerRoute({ study: activeStudyFolder, site: activeSiteId, zone: activeZoneId });
              else if (activeZoneId) updateExplorerRoute({ study: activeStudyFolder, site: activeSiteId });
              else if (activeSiteId) updateExplorerRoute({ study: activeStudyFolder });
              else updateExplorerRoute({});
            }}
            className="text-[11px] text-blue-700 hover:underline font-semibold cursor-pointer"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Action & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-300 rounded pl-8 pr-3 py-1 text-xs text-slate-800 w-60 focus:outline-none focus:border-blue-500 shadow-inner"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-semibold">Sort/Filter By:</span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select...</option>
              <option value="name">Study Name</option>
              <option value="code">Study Code</option>
              <option value="date">Updated Date</option>
            </select>
          </div>
        </div>

        {/* Action Menu (3 lines Hamburger with dropdown) */}
        <div className="relative">
          <button
            onClick={() => setShowMenuDropdown(!showMenuDropdown)}
            className="p-1.5 bg-white hover:bg-sky-50 text-blue-800 border border-slate-300 rounded shadow-2xs transition-colors cursor-pointer flex items-center justify-center"
            title="Repository Actions Menu"
          >
            <Menu className="w-4 h-4 text-blue-700" />
          </button>

          {showMenuDropdown && (
            <div className="absolute right-0 mt-1 w-60 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 z-30 p-1.5 space-y-0.5 text-xs font-sans">
              <div className="px-2.5 py-1 text-[10px] font-mono text-slate-400 border-b border-slate-100 uppercase font-bold">
                Role Actions ({currentUser?.roleId || currentUser?.role})
              </div>

              {studies.length === 0 ? (
                <div className="p-3 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-amber-900 font-bold">Study Protocol Required</p>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    An active clinical study protocol must be initiated before performing repository actions.
                  </p>
                  {(currentUser?.roleId === 'system_admin' || currentUser?.roleId === 'tmf_manager' || currentUser?.roleId === 'ctm') && (
                    <button
                      onClick={() => { setShowMenuDropdown(false); navigate('/studies'); }}
                      className="w-full py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                    >
                      Go to Study Management →
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {(hasPermission('upload') || hasPermission('editMetadata')) && hasPermission('manageFolders') && (
                    <button 
                      onClick={() => { setShowMenuDropdown(false); setShowPlaceholderModal(true); }} 
                      className="w-full text-left px-2.5 py-1.5 hover:bg-sky-50 rounded flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-600" /> Add Placeholder
                    </button>
                  )}

                  {hasPermission('moveFile') && (
                    <button 
                      onClick={() => { setShowMenuDropdown(false); setShowCopyModal(true); }} 
                      className="w-full text-left px-2.5 py-1.5 hover:bg-sky-50 rounded flex items-center gap-2 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-indigo-600" /> Copy Documents
                    </button>
                  )}

                  {hasPermission('moveFile') && (
                    <button 
                      onClick={() => { setShowMenuDropdown(false); setShowMoveModal(true); }} 
                      className="w-full text-left px-2.5 py-1.5 hover:bg-sky-50 rounded flex items-center gap-2 cursor-pointer"
                    >
                      <MoveRight className="w-3.5 h-3.5 text-slate-600" /> Move Documents
                    </button>
                  )}

                  <button 
                    onClick={() => { setShowMenuDropdown(false); setShowFilePlanModal(true); }} 
                    className="w-full text-left px-2.5 py-1.5 hover:bg-sky-50 rounded flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" /> File Plan
                  </button>

                  <button 
                    onClick={() => { setShowMenuDropdown(false); setShowMasterIndexModal(true); }} 
                    className="w-full text-left px-2.5 py-1.5 hover:bg-sky-50 rounded flex items-center gap-2 cursor-pointer"
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-amber-600" /> Master Index
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SPECIAL VIEW: Investigational Sites & Personnel Folders */}
      {activeViewMode === 'students' ? (
        <div className="space-y-3">
          <div className="bg-white border border-indigo-200 rounded p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  Investigational Trial Sites &amp; Assigned Personnel Directory
                </h2>
                <p className="text-[11px] text-slate-500">
                  Study: <span className="font-semibold text-slate-700">{activeStudyObj?.id || 'Active Protocol'} ({activeStudyObj?.protocolNumber || activeStudyObj?.shortName || 'Clinical Study'})</span> | Select any Investigational Site to view site-specific DIA TMF records
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasPermission('manageUsers') && (
                <button
                  onClick={() => navigate('/roles-access')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Manage User Access &amp; Roles (Admin)
                </button>
              )}
              {activeStudyObj && (
                <button
                  onClick={() => updateExplorerRoute({ study: activeStudyObj.id })}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Folder className="w-3.5 h-3.5" /> Open Full Study {activeStudyObj.id}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(activeStudyObj?.sites || []).map((site) => {
              const siteTargetId = site.number || site.id;
              const assignedUser = (allUsers || []).find(
                u => u.siteScope === siteTargetId || (site.assignedPiName && u.name.toLowerCase().includes(site.assignedPiName.split(' ')[0].toLowerCase()))
              );
              const siteDocsCount = documents.filter(d => d.study_id === activeStudyObj.id && (!d.site_id || d.site_id.includes(siteTargetId))).length;

              return (
                <div
                  key={site.id || site.number}
                  onClick={() => updateExplorerRoute({ study: activeStudyObj.id, site: siteTargetId })}
                  className="bg-white border border-slate-200 hover:border-indigo-400 rounded-lg p-4 cursor-pointer transition-all shadow-xs hover:shadow-md flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Folder className="w-8 h-8 text-amber-500 fill-amber-100 shrink-0" />
                        <div>
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-mono font-bold text-[10px] border border-indigo-200">
                            {siteTargetId}
                          </span>
                          <h3 className="font-bold text-slate-900 text-xs mt-1">
                            {site.piName || site.assignedPiName || 'Principal Investigator'}
                          </h3>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded border border-emerald-200">
                        {site.status || 'Active Site'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] space-y-1">
                      <p className="font-semibold text-slate-800 truncate" title={site.name}>
                        <Building className="w-3.5 h-3.5 text-slate-500 inline mr-1" /> {site.name}
                      </p>
                      <p className="text-slate-600 text-[10px]">
                        <span className="font-semibold">Facility PI:</span> {site.piName} ({site.piLicense || 'Medical License'})
                      </p>
                      {(site.assignedCrcName || site.assignedCraName) && (
                        <p className="text-slate-500 text-[10px]">
                          CRC: <strong className="text-slate-700">{site.assignedCrcName || 'Site Staff'}</strong> | CRA: <strong className="text-slate-700">{site.assignedCraName || 'Monitor'}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-mono text-slate-500">
                      Accessible Docs: <strong className="text-slate-800">{siteDocsCount}</strong> | Target N={site.targetEnrollment || 30}
                    </span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded font-bold text-[10px] border border-blue-200 transition-colors">
                      Open {siteTargetId} TMF →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : !activeStudyFolder ? (
        /* LEVEL 1: Study Cards List (CM Folder All Studies) */
        <div className="space-y-3">
          {studies.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-12 text-center space-y-4 shadow-xs">
              <Folder className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Clinical Studies Active in VigiThink eTMF</h3>
              <p className="text-slate-500 text-xs max-w-lg mx-auto leading-relaxed">
                The repository is running in clean-slate production mode. As System Administrator, create your study in Study Management to establish the DIA TMF Reference Model v3.1 structure and site repositories.
              </p>
              <button
                onClick={() => navigate('/studies')}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                Go to Study Management →
              </button>
            </div>
          ) : (
            studies.map((study) => {
            const metrics = getStudyMetrics(study.id);
            return (
              <div
                key={study.id}
                onClick={() => updateExplorerRoute({ study: study.id })}
                className="bg-white border border-slate-200 hover:border-sky-300 rounded p-4 flex flex-wrap items-center justify-between gap-4 transition-all shadow-xs cursor-pointer"
              >
                {/* Left Info: Yellow Folder Icon & Details */}
                <div className="flex items-start gap-3 max-w-xl">
                  <Folder 
                    className="w-9 h-9 text-amber-500 fill-amber-100 shrink-0 hover:scale-110 transition-transform" 
                  />
                  
                  <div className="space-y-1 text-xs">
                    <h3 className="font-bold text-slate-900 text-sm hover:text-blue-700">
                      Study : {study.id} ({study.shortName})
                    </h3>
                    <p className="text-slate-600 font-medium">Protocol : {study.protocolNumber}</p>
                    <p className="text-[11px] text-slate-500">{study.title}</p>
                    
                    <div className="pt-1 flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300">
                        Status: {study.status}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        Sponsor: {study.sponsor} | CRO: {study.cro}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 pt-1 font-mono">
                      <span>Participating Countries: {study.countries?.length || 0} | Clinical Sites: {study.sites?.length || 0} | Milestones: {study.milestones?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Circular Metric Badges */}
                <div className="flex items-center gap-2 font-mono text-center">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 block uppercase">Total</span>
                    <div className="metric-circle metric-circle-total">{metrics.total}</div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] text-emerald-600 block uppercase">Completed</span>
                    <div className="metric-circle metric-circle-completed">{metrics.completed}</div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] text-sky-600 block uppercase">In-Progress</span>
                    <div className="metric-circle metric-circle-inprogress">{metrics.inProgress}</div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] text-amber-600 block uppercase">In QC</span>
                    <div className="metric-circle metric-circle-qc">{metrics.inQC}</div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] text-rose-600 block uppercase">Missing</span>
                    <div className="metric-circle metric-circle-missing">{metrics.missing}</div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] text-indigo-600 block uppercase">Expected</span>
                    <div className="metric-circle metric-circle-expected">{metrics.expected}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      ) : (
        /* LEVEL 2 & 3 & 4: Subfolders and Document Views */
        <div className="space-y-3">
          
          {/* Top Subfolder Navigation Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                {activeCustomFolder
                  ? `Folder: ${activeCustomFolder}`
                  : !activeZoneId 
                  ? `${activeStudyFolder}: ${activeStudyObj?.shortName || ''} ${activeSiteId ? `(${activeSiteId})` : ''}` 
                  : `Zone ${activeZoneId}: ${activeZoneObj?.name} ${activeSiteId ? `(${activeSiteId})` : ''}`}
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                {!activeZoneId 
                  ? `Protocol: ${activeStudyObj?.protocolNumber || activeStudyFolder} | DIA TMF Reference Model v3.1 Taxonomy` 
                  : `Filed Documents & Essential Records for Zone ${activeZoneId}`}
              </p>
            </div>

            {!hasPermission('upload') && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold border border-slate-300 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" /> Read Only View
                </span>
              </div>
            )}
          </div>

          {/* Inline Create New Folder Form */}
          {showNewFolderInput && hasPermission('manageFolders') && (
            <form onSubmit={handleCreateNewFolderSubmit} className="bg-amber-50 border border-amber-300 rounded p-3 flex flex-wrap items-center gap-2 shadow-xs">
              <Folder className="w-4 h-4 text-amber-600 fill-amber-100" />
              <span className="font-bold text-amber-900 text-xs">New Folder Name:</span>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Site 001 Investigator Qualification Docs / Ethics Approvals..."
                className="flex-1 min-w-[240px] bg-white border border-amber-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs cursor-pointer"
              >
                Create Folder
              </button>
              <button
                type="button"
                onClick={() => setShowNewFolderInput(false)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Clinical Site Filter Bar inside Study */}
          {(activeStudyObj?.sites || []).length > 0 && (
            <div className="bg-white px-3 py-2 rounded border border-slate-200 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] font-bold uppercase text-slate-400 mr-1 shrink-0 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" /> Site Scope:
              </span>
              <button
                onClick={() => updateExplorerRoute({ study: activeStudyFolder, zone: activeZoneId, section: activeSectionId, site: null })}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap border cursor-pointer ${
                  !activeSiteId
                    ? 'bg-blue-600 text-white border-blue-800'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                All Study Sites ({activeStudyObj.sites.length})
              </button>
              {activeStudyObj.sites.map(site => (
                <button
                  key={site.id}
                  onClick={() => updateExplorerRoute({ study: activeStudyFolder, zone: activeZoneId, section: activeSectionId, site: site.id })}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap border cursor-pointer ${
                    activeSiteId === site.id
                      ? 'bg-blue-600 text-white border-blue-800'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-sky-50'
                  }`}
                >
                  Site {site.id} {site.assignedStudent ? `(${site.assignedStudent.split(' ')[0]})` : ''}
                </button>
              ))}
            </div>
          )}

          {/* Custom User-Created Folders Section (with Rename & Delete) */}
          {matchingCustomFolders.length > 0 && (
            <div className="bg-white border border-amber-200 rounded p-3 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-amber-500 fill-amber-100" />
                  Custom Created Folders ({matchingCustomFolders.length})
                </span>
                {activeCustomFolder && (
                  <button
                    onClick={() => setActiveCustomFolder(null)}
                    className="text-xs text-blue-700 hover:underline font-bold cursor-pointer"
                  >
                    Show All Folders
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {matchingCustomFolders.map(folder => {
                  const isFolderActive = activeCustomFolder === folder.name;
                  const folderDocsCount = documents.filter(
                    d => d.study_id === activeStudyIdToUse && (d.custom_folder_name === folder.name || (d.folder_path || '').includes(folder.name))
                  ).length;

                  return (
                    <div
                      key={folder.id}
                      onClick={() => setActiveCustomFolder(isFolderActive ? null : folder.name)}
                      className={`p-2.5 rounded border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isFolderActive
                          ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-400'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-amber-50/40 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Folder className="w-6 h-6 text-amber-500 fill-amber-200 shrink-0" />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs truncate" title={folder.name}>
                            {folder.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            Files: {folderDocsCount} | By: {folder.created_by}
                          </p>
                        </div>
                      </div>

                      {hasPermission('manageFolders') && (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              const updatedName = window.prompt("Rename Folder:", folder.name);
                              if (updatedName && updatedName.trim()) {
                                renameCustomFolder(folder.id, updatedName.trim(), currentUser);
                                if (activeCustomFolder === folder.name) setActiveCustomFolder(updatedName.trim());
                              }
                            }}
                            className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 cursor-pointer"
                            title="Rename Folder"
                          >
                            <Edit className="w-3 h-3 text-slate-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete custom folder "${folder.name}"?`)) {
                                deleteCustomFolder(folder.id, currentUser);
                                if (activeCustomFolder === folder.name) setActiveCustomFolder(null);
                              }
                            }}
                            className="p-1.5 bg-white hover:bg-rose-50 text-rose-700 rounded border border-rose-300 cursor-pointer"
                            title="Delete Folder"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* If No Zone Selected: Render 11 DIA TMF Zones */}
          {!activeZoneId && !activeCustomFolder && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {zonesTaxonomy.map(zone => {
                const zoneDocsCount = documents.filter(d => 
                  d.study_id === activeStudyFolder && 
                  d.tmf_zone_id === zone.id &&
                  (!activeSiteId || !d.site_id || d.site_id === activeSiteId)
                ).length;
                return (
                  <div 
                    key={zone.id} 
                    onClick={() => updateExplorerRoute({ study: activeStudyFolder, site: activeSiteId, zone: zone.id })}
                    className="bg-white p-3 rounded border border-slate-200 flex items-center justify-between hover:bg-sky-50/60 hover:border-sky-300 cursor-pointer transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="w-6 h-6 text-amber-500 fill-amber-100 shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">Zone {zone.id} {zone.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">Sections: {zone.sections.length} | Filed Documents: {zoneDocsCount}</p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded font-mono font-bold text-[11px] border border-blue-200">
                      Open Zone →
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section Filters when Zone is Selected */}
          {activeZoneId && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => updateExplorerRoute({ study: activeStudyFolder, site: activeSiteId, zone: activeZoneId, section: null })}
                className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap border cursor-pointer ${
                  !activeSectionId ? 'bg-blue-600 text-white border-blue-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                All Sections in Zone {activeZoneId}
              </button>
              {activeZoneObj?.sections.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => updateExplorerRoute({ study: activeStudyFolder, site: activeSiteId, zone: activeZoneId, section: sec.id })}
                  className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap border cursor-pointer ${
                    activeSectionId === sec.id ? 'bg-blue-600 text-white border-blue-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {sec.id} {sec.name}
                </button>
              ))}
            </div>
          )}

          {/* Documents Table (Always shown inside Study, Zone, or Custom Folder so uploaded files are immediately visible!) */}
          <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-800 text-xs font-mono">
                {activeCustomFolder
                  ? `Showing ${currentStudyDocs.length} Document(s) in Folder "${activeCustomFolder}"`
                  : activeZoneId
                  ? `Showing ${currentStudyDocs.length} Document(s) in Zone ${activeZoneId}`
                  : `All Uploaded & Filed Documents in ${activeStudyFolder} (${currentStudyDocs.length})`}
              </span>
              <div className="flex items-center gap-3">
                {hasPermission('upload') && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="text-xs text-emerald-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Upload New File
                  </button>
                )}
                <button
                  onClick={() => exportDocumentManifestCsv(activeStudyIdToUse)}
                  className="text-xs text-blue-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export Folder List
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#132E52] text-white font-bold text-[11px]">
                    <th className="p-2.5 border-b border-blue-800">Document ID & File Name</th>
                    <th className="p-2.5 border-b border-blue-800 text-center">Version</th>
                    <th className="p-2.5 border-b border-blue-800">Document Status</th>
                    <th className="p-2.5 border-b border-blue-800">Site / Uploaded By</th>
                    <th className="p-2.5 border-b border-blue-800">Folder Path</th>
                    <th className="p-2.5 border-b border-blue-800 text-right">View / Rename / Delete Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-sans">
                  {currentStudyDocs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        No documents currently filed in this folder. Click "Upload File Here" to upload a PDF, Image, Word, or Excel file.
                      </td>
                    </tr>
                  ) : (
                    currentStudyDocs.map(doc => {
                      const hasUploadedFileUrl = Boolean(doc.local_blob_url || doc.file_path);
                      const canDeleteThisFile = hasPermission('delete');
                      const canRenameThisFile = hasPermission('editMetadata');

                      return (
                        <tr key={doc.document_id} className="hover:bg-sky-50/60 transition-colors">
                          <td className="p-2.5">
                            <button
                              onClick={() => setSelectedDoc(doc)}
                              className="text-sky-700 hover:underline font-bold text-xs cursor-pointer text-left flex items-center gap-1.5"
                              title="Click to Preview Uploaded File"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{doc.document_title}</span>
                            </button>
                            <span className="text-[10px] text-slate-500 font-mono truncate max-w-xs block">
                              ID: {doc.document_id} {doc.file_name ? `| File: ${doc.file_name}` : ''}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-700">
                            v{doc.version_number || '1.0'}
                          </td>
                          <td className="p-2.5">
                            <div className="flex flex-col items-start gap-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                doc.status === 'Effective' || doc.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                doc.status === 'Placeholder' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                                doc.status === 'Draft' ? 'bg-sky-100 text-sky-800 border-sky-300' :
                                'bg-amber-100 text-amber-800 border-amber-300'
                              }`}>
                                {doc.status}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Stage {doc.lifecycle_stage || 5}/11: {doc.lifecycle_stage_name ? doc.lifecycle_stage_name.replace(/^\d+\.\s*/, '') : 'Metadata Entry'}
                              </span>
                            </div>
                          </td>
                          <td className="p-2.5 text-slate-700 font-sans text-[11px]">
                            <span className="font-semibold block">{doc.site_id || 'Study Level'}</span>
                            <span className="text-[10px] text-slate-500">By: {doc.uploaded_by_name || 'VigiThink User'}</span>
                          </td>
                          <td className="p-2.5 text-[11px] text-slate-500 font-sans truncate max-w-sm">
                            {doc.folder_path}
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* 1. Preview / View Uploaded File in Drawer */}
                              <button
                                onClick={() => setSelectedDoc(doc)}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Preview Uploaded File & Metadata"
                              >
                                <Eye className="w-3 h-3" /> View File
                              </button>

                              {/* 2. Direct Open in Browser Tab */}
                              <a
                                href={doc.local_blob_url || doc.file_path || `/api/documents/${doc.document_id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                title="Open Document Record in New Tab"
                              >
                                ↗ Open
                              </a>

                              {/* 3. Download File */}
                              <button
                                onClick={() => downloadDocumentFile(doc)}
                                className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-200 cursor-pointer"
                                title="Download File"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {/* 4. Rename Document / File (Metadata Edit permission) */}
                              {canRenameThisFile && (
                                <button
                                  onClick={() => handleQuickRenameDoc(doc)}
                                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 text-[10px] font-semibold cursor-pointer inline-flex items-center gap-1"
                                  title="Rename Document / File"
                                >
                                  <Edit3 className="w-3 h-3 text-slate-600" /> Rename
                                </button>
                              )}

                              {/* 5. Delete Document / File (Admin permission only) */}
                              {canDeleteThisFile && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete file "${doc.document_title}" (${doc.document_id})?`)) {
                                      deleteDocument(doc.document_id, currentUser);
                                    }
                                  }}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded border border-rose-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Delete Uploaded File (Admin Only)"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              )}
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

        </div>
      )}

      {/* Action Modals */}
      {showUploadModal && (
        <UploadWizardModal
          defaultZone={activeZoneId || "01"}
          defaultSection={activeSectionId || null}
          defaultSite={activeSiteId || null}
          defaultCustomFolder={activeCustomFolder || null}
          onUploadSuccess={(createdDoc) => {
            setSelectedDoc(createdDoc);
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}
      {showPlaceholderModal && <AddPlaceholderModal defaultZone={activeZoneId || "01"} onClose={() => setShowPlaceholderModal(false)} />}
      {showCopyModal && <CopyDocumentModal onClose={() => setShowCopyModal(false)} />}
      {showMoveModal && <MoveDocumentModal onClose={() => setShowMoveModal(false)} />}
      {showMasterIndexModal && <MasterIndexModal onClose={() => setShowMasterIndexModal(false)} />}
      {showFilePlanModal && <FilePlanModal onClose={() => setShowFilePlanModal(false)} />}
      {showCheckOutModal && <CheckOutModal onClose={() => setShowCheckOutModal(false)} />}

      {/* Document Viewer Drawer */}
      {selectedDoc && (
        <DocumentViewerDrawer doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </div>
  );
}
