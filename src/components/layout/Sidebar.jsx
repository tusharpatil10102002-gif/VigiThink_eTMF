import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Folder, 
  FolderOpen,
  ClipboardList, 
  BarChart3, 
  Package, 
  FileText, 
  Star, 
  HelpCircle, 
  Clock, 
  Settings, 
  Lock, 
  Building,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Upload,
  CheckCircle2,
  Send,
  Archive,
  Layers,
  Users,
  Search,
  Eye,
  AlertCircle,
  X,
  Inbox,
  Shield,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTMFData } from '../../context/TMFDataContext';

export default function Sidebar({ isOpen = true, onCloseMobile }) {
  const { 
    currentUser, 
    currentRole, 
    hasPermission, 
    canManageUsers, 
    canManageStudies, 
    canViewAuditTrail, 
    canViewInspectorPortal,
    canQcPass,
    canUpload
  } = useAuth();
  const { studies, documents, selectedStudyId, setSelectedStudyId, zonesTaxonomy } = useTMFData();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentUrlStudy = searchParams.get('study');
  const currentUrlZone = searchParams.get('zone');
  const currentUrlSite = searchParams.get('site');
  const currentUrlView = searchParams.get('view');

  const [openSections, setOpenSections] = useState({
    repository: true,
    workflow: true,
    compliance: true,
    admin: true
  });
  const [expandedSidebarStudy, setExpandedSidebarStudy] = useState(null);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const roleId = currentUser?.roleId || currentRole?.id || 'system_admin';
  const isSiteScopedRole = roleId === 'site_user' || roleId === 'investigator';

  // Scoped documents calculation
  const studyDocs = documents.filter(d => d.study_id === selectedStudyId);
  const openQueriesCount = studyDocs.filter(d => d.qc_status === 'Query Raised').length;
  const myUploadedDocs = documents.filter(d => 
    d.uploaded_by_id === currentUser?.id || d.submitted_by_id === currentUser?.id
  );
  const reworkCount = documents.filter(d => 
    (d.qc_status === 'Failed' || d.status === 'Rejected/Correction') &&
    (roleId === 'system_admin' || roleId === 'tmf_manager' || d.uploaded_by_id === currentUser?.id || d.submitted_by_id === currentUser?.id)
  ).length;

  const navItemClass = (isActive) =>
    `flex items-center gap-2.5 px-3 py-2 rounded text-xs transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-900 font-bold border-l-3 border-blue-700 shadow-2xs'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
    }`;

  const sidebarContent = (
    <aside className="w-64 bg-[#F8FAFC] border-r border-slate-300 flex flex-col h-full shrink-0 select-none text-xs font-sans">
      
      {/* Mobile Drawer Header with Close Button */}
      <div className="lg:hidden p-3 border-b border-slate-200 flex items-center justify-between bg-slate-100">
        <span className="font-bold text-slate-800 text-xs">Navigation Menu</span>
        <button 
          onClick={onCloseMobile} 
          className="p-1 text-slate-500 hover:text-slate-900 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Navigation Container */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3 font-sans">
        
        {/* Top Overview Link */}
        <div className="space-y-1">
          <NavLink to="/" end className={({ isActive }) => navItemClass(isActive)}>
            <LayoutDashboard className="w-4 h-4 text-blue-700 shrink-0" />
            <span className="truncate">
              {roleId === 'system_admin' ? 'Admin Overview' :
               roleId === 'tmf_manager' ? 'TMF Oversight' :
               roleId === 'ctm' ? 'CTM Study Oversight' :
               roleId === 'cra' ? 'CRA Site Dashboard' :
               roleId === 'investigator' ? 'Investigator (PI) Workspace' :
               roleId === 'site_user' ? 'Site User / CRC Workspace' :
               roleId === 'doc_controller' ? 'Doc Controller Hub' :
               'Dashboard'}
            </span>
            {studyDocs.length > 0 && (
              <span className="ml-auto px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-semibold">
                {studyDocs.length}
              </span>
            )}
          </NavLink>
        </div>

        {/* 1. REPOSITORY & TAXONOMY */}
        <div>
          <button 
            onClick={() => toggleSection('repository')}
            className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <span>{isSiteScopedRole ? 'My Study & Site' : 'eTMF Repository'}</span>
            {openSections.repository ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.repository && (
            <div className="space-y-0.5 mt-1">
              {/* All Studies CM Folder */}
              {!isSiteScopedRole && (
                <NavLink 
                  to="/explorer" 
                  end
                  className={() => navItemClass(location.pathname === '/explorer' && !currentUrlStudy && !currentUrlView)}
                >
                  <FolderOpen className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>All Studies (CM Folder)</span>
                </NavLink>
              )}

              {studies.length === 0 && (
                <div className="px-2.5 py-2 bg-amber-50/70 border border-amber-200/60 rounded text-[11px] text-amber-900 space-y-1 my-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>No Study Created</span>
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Admin must create a study protocol before document activities begin.
                  </p>
                </div>
              )}

              {/* Individual Study Folders */}
              {studies.map(s => {
                const isStudyActive = location.pathname === '/explorer' && currentUrlStudy === s.id && !currentUrlView;
                const isExpanded = expandedSidebarStudy === s.id || currentUrlStudy === s.id;
                
                if (isSiteScopedRole && currentUser?.studyScope && currentUser.studyScope !== 'ALL' && s.id !== currentUser.studyScope) {
                  return null;
                }

                return (
                  <div key={s.id} className="space-y-0.5">
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setExpandedSidebarStudy(isExpanded ? null : s.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Expand Study Hierarchy"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      <NavLink 
                        to={`/explorer?study=${encodeURIComponent(s.id)}`}
                        onClick={() => {
                          setSelectedStudyId(s.id);
                          setExpandedSidebarStudy(s.id);
                        }}
                        title={`${s.id}: ${s.shortName || s.title}`}
                        className={() => `flex-1 flex items-center gap-2 px-2 py-1.5 rounded text-xs truncate transition-colors ${
                          isStudyActive
                            ? 'bg-blue-50 text-blue-900 font-bold border-l-2 border-blue-700' 
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <Folder className="w-4 h-4 text-amber-600 fill-amber-100 shrink-0" />
                        <span className="truncate">{s.shortName || s.id}</span>
                      </NavLink>
                    </div>

                    {/* Sub-tree: Sites & DIA Zones */}
                    {isExpanded && (
                      <div className="pl-3 ml-3 border-l border-slate-300 space-y-1 py-1">
                        {(s.sites || []).length > 0 && (
                          <div className="space-y-0.5">
                            <div className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                              {isSiteScopedRole ? 'Assigned Site' : `Sites (${s.sites.length})`}
                            </div>
                            {s.sites.map(site => {
                              const isSiteSelected = currentUrlStudy === s.id && currentUrlSite === site.id;
                              const isMySite = currentUser?.siteScope && currentUser.siteScope.includes(site.number || site.id);
                              
                              if (isSiteScopedRole && !isMySite && currentUser?.siteScope !== 'ALL') {
                                return null;
                              }

                              return (
                                <NavLink
                                  key={site.id}
                                  to={`/explorer?study=${encodeURIComponent(s.id)}&site=${encodeURIComponent(site.id)}`}
                                  onClick={() => setSelectedStudyId(s.id)}
                                  className={() => `flex items-center justify-between px-2 py-1 rounded text-[11px] truncate transition-colors ${
                                    isSiteSelected
                                      ? 'bg-blue-700 text-white font-semibold'
                                      : 'text-slate-700 hover:bg-slate-100 hover:text-blue-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Building className="w-3 h-3 text-slate-500 shrink-0" />
                                    <span className="truncate">{site.id}</span>
                                  </div>
                                  {isMySite && (
                                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">My Site</span>
                                  )}
                                </NavLink>
                              );
                            })}
                          </div>
                        )}

                        {/* DIA Zones 01-11 */}
                        <div className="pt-1 space-y-0.5">
                          <div className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            TMF Zones (01–11)
                          </div>
                          {(zonesTaxonomy || []).map(z => {
                            const isZoneSelected = currentUrlStudy === s.id && currentUrlZone === z.id;
                            return (
                              <NavLink
                                key={z.id}
                                to={`/explorer?study=${encodeURIComponent(s.id)}&zone=${encodeURIComponent(z.id)}`}
                                onClick={() => setSelectedStudyId(s.id)}
                                className={() => `block px-2 py-1 rounded text-[11px] truncate transition-colors ${
                                  isZoneSelected
                                    ? 'bg-blue-700 text-white font-semibold'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-blue-700'
                                }`}
                              >
                                Zone {z.id}: {z.name}
                              </NavLink>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Document Inventory / Tracking */}
              <NavLink to="/inventory" className={({ isActive }) => navItemClass(isActive)}>
                <Package className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  {roleId === 'site_user' ? 'My Site Documents' :
                   roleId === 'investigator' ? 'Investigator Site Files' :
                   roleId === 'doc_controller' ? 'Document Indexing' :
                   roleId === 'cra' ? 'Document Tracking' :
                   roleId === 'ctm' ? 'Document Overview' :
                   'Document Inventory'}
                </span>
              </NavLink>

              {/* Version Control */}
              {!isSiteScopedRole && hasPermission('version') && (
                <NavLink to="/version-control" className={({ isActive }) => navItemClass(isActive)}>
                  <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Version History</span>
                </NavLink>
              )}
            </div>
          )}
        </div>

        {/* 2. WORKFLOW & QUALITY GATES */}
        <div>
          <button 
            onClick={() => toggleSection('workflow')}
            className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <span>
              {roleId === 'site_user' ? 'Quality & Actions' :
               roleId === 'investigator' ? 'Investigator Actions' :
               roleId === 'cra' ? 'Monitoring & Queries' :
               roleId === 'ctm' ? 'Trial Oversight' :
               roleId === 'doc_controller' ? 'Quality & Filing' :
               'Workflow & Quality'}
            </span>
            {openSections.workflow ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.workflow && (
            <div className="space-y-0.5 mt-1">
              
              {/* QC Review Queue */}
              {(hasPermission('qcReview') || canQcPass || roleId === 'ctm') && (
                <NavLink to="/qc-queue" className={({ isActive }) => navItemClass(isActive)}>
                  <ClipboardList className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <span>
                      {roleId === 'ctm' ? 'Approval Queue' : 'QC Review Queue'}
                    </span>
                    {canQcPass && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">Approver</span>
                    )}
                  </div>
                </NavLink>
              )}

              {/* Tasks Inbox */}
              <NavLink to="/tasks" className={({ isActive }) => navItemClass(isActive)}>
                <Inbox className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Task Inbox</span>
              </NavLink>

              {/* Expected Document List (EDL) */}
              <NavLink to="/edl" className={({ isActive }) => navItemClass(isActive)}>
                <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  {isSiteScopedRole || roleId === 'cra' ? 'Document Checklist (EDL)' : 'Expected Documents (EDL)'}
                </span>
              </NavLink>

              {/* Quality Queries */}
              <NavLink to="/queries" className={({ isActive }) => navItemClass(isActive)}>
                <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex-1 flex items-center justify-between">
                  <span>
                    {isSiteScopedRole || roleId === 'cra' ? 'QC Queries & Feedback' : 'Quality Queries'}
                  </span>
                  {openQueriesCount > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
                      {openQueriesCount}
                    </span>
                  )}
                </div>
              </NavLink>

              {/* Resubmissions Pill for Site User & CRA */}
              {(isSiteScopedRole || roleId === 'cra') && reworkCount > 0 && (
                <NavLink to="/queries?filter=rework" className={({ isActive }) => navItemClass(isActive)}>
                  <Send className="w-4 h-4 text-rose-600 shrink-0" />
                  <div className="flex-1 flex items-center justify-between text-rose-700 font-bold">
                    <span>Pending Resubmissions</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full font-bold">
                      {reworkCount}
                    </span>
                  </div>
                </NavLink>
              )}

              {/* Quality Metrics & Timeliness */}
              {!isSiteScopedRole && (canQcPass || hasPermission('review') || roleId === 'cra') && (
                <>
                  <NavLink to="/quality" className={({ isActive }) => navItemClass(isActive)}>
                    <Star className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Quality Metrics</span>
                  </NavLink>
                  <NavLink to="/timeliness" className={({ isActive }) => navItemClass(isActive)}>
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Timeliness &amp; SLA</span>
                  </NavLink>
                  {(roleId === 'cra' || roleId === 'ctm' || roleId === 'system_admin') && (
                    <NavLink to="/monitoring-visits" className={({ isActive }) => navItemClass(isActive)}>
                      <ClipboardList className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Monitoring Visits</span>
                    </NavLink>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* 3. COMPLIANCE & REPORTS */}
        {!isSiteScopedRole && (
          <div>
            <button 
              onClick={() => toggleSection('compliance')}
              className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <span>Compliance &amp; Reports</span>
              {openSections.compliance ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {openSections.compliance && (
              <div className="space-y-0.5 mt-1">
                {/* Reports */}
                <NavLink to="/reports" className={({ isActive }) => navItemClass(isActive)}>
                  <BarChart3 className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Completeness Reports</span>
                </NavLink>

                {/* 21 CFR Part 11 Audit Trail */}
                {canViewAuditTrail && (
                  <NavLink to="/audit-trail" className={({ isActive }) => navItemClass(isActive)}>
                    <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>21 CFR Part 11 Audit Trail</span>
                  </NavLink>
                )}

                {/* Inspector Portal */}
                {canViewInspectorPortal && (
                  <NavLink to="/inspector-portal" className={({ isActive }) => navItemClass(isActive)}>
                    <Building className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Inspector Portal</span>
                  </NavLink>
                )}

                {/* System Validation (CSV) */}
                {canViewAuditTrail && (
                  <NavLink to="/system-validation" className={({ isActive }) => navItemClass(isActive)}>
                    <FileCheck className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>System Validation (CSV)</span>
                  </NavLink>
                )}

                {/* Code-Break Vault */}
                <NavLink to="/blinding-access" className={({ isActive }) => navItemClass(isActive)}>
                  <Shield className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Code-Break Vault</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* 4. ADMINISTRATION */}
        {(canManageStudies || canManageUsers || roleId === 'ctm') && (
          <div>
            <button 
              onClick={() => toggleSection('admin')}
              className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <span>{roleId === 'ctm' ? 'Study & Site Setup' : 'Administration'}</span>
              {openSections.admin ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {openSections.admin && (
              <div className="space-y-0.5 mt-1">
                <NavLink to="/studies" className={({ isActive }) => navItemClass(isActive)}>
                  <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Studies &amp; Sites</span>
                </NavLink>

                {canManageUsers && (
                  <NavLink to="/roles-access" className={({ isActive }) => navItemClass(isActive)}>
                    <Users className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>User Management</span>
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Role & Scope Badge Footer */}
      <div className="px-3.5 py-2.5 border-t border-slate-200 bg-white text-slate-600 text-[11px] space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 truncate max-w-[130px]">{currentUser?.name}</span>
          <span className="font-mono text-[10px] text-slate-400">v4.3</span>
        </div>
        <p className="text-[10px] text-blue-800 font-semibold truncate">{currentRole?.name}</p>
        {currentUser?.siteScope && currentUser.siteScope !== 'ALL' && (
          <p className="text-[10px] text-slate-600 truncate font-mono">
            Site: {currentUser.siteScope.split(' - ')[0] || currentUser.siteScope}
          </p>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className={`hidden lg:block h-full shrink-0 ${!isOpen ? 'hidden' : ''}`}>
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div 
            onClick={onCloseMobile} 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs transition-opacity" 
          />
          <div className="relative z-50 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
