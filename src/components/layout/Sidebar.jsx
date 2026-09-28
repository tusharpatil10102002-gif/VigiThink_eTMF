import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Folder, 
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
  FolderOpen,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTMFData } from '../../context/TMFDataContext';

export default function Sidebar({ isOpen = true }) {
  const { currentUser } = useAuth();
  const { studies, documents, selectedStudyId, setSelectedStudyId, zonesTaxonomy } = useTMFData();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentUrlStudy = searchParams.get('study');
  const currentUrlZone = searchParams.get('zone');
  const currentUrlSite = searchParams.get('site');
  const currentUrlView = searchParams.get('view');

  const [openSections, setOpenSections] = useState({
    repository: true,
    myTasks: true,
    reports: false,
    admin: false
  });
  const [expandedSidebarStudy, setExpandedSidebarStudy] = useState(null);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const studyDocs = documents.filter(d => d.study_id === selectedStudyId);
  const openQueriesCount = studyDocs.filter(d => d.qc_status === 'Query Raised').length;

  if (!isOpen) return null;

  const navItemClass = (isActive) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-semibold'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 select-none text-xs">
      
      {/* Scrollable Navigation Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 font-sans">
        
        {/* Top Overview Link */}
        <div className="space-y-1">
          <NavLink to="/" end className={({ isActive }) => navItemClass(isActive)}>
            <LayoutDashboard className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Overview & Tasks</span>
            {studyDocs.length > 0 && (
              <span className="ml-auto px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                {studyDocs.length}
              </span>
            )}
          </NavLink>
        </div>

        {/* 1. REPOSITORY */}
        <div>
          <button 
            onClick={() => toggleSection('repository')}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <span>eTMF Repository</span>
            {openSections.repository ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {openSections.repository && (
            <div className="space-y-1 mt-1.5">
              {/* All Studies Folder */}
              <NavLink 
                to="/explorer" 
                end
                className={() => navItemClass(location.pathname === '/explorer' && !currentUrlStudy && !currentUrlView)}
              >
                <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                <span>All Studies (CM Folder)</span>
              </NavLink>

              {/* Individual Study Folders */}
              {studies.map(s => {
                const isStudyActive = location.pathname === '/explorer' && currentUrlStudy === s.id && !currentUrlView;
                const isExpanded = expandedSidebarStudy === s.id || currentUrlStudy === s.id;
                return (
                  <div key={s.id} className="space-y-0.5">
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setExpandedSidebarStudy(isExpanded ? null : s.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Expand/Collapse Study"
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
                        className={() => `flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs truncate transition-colors ${
                          isStudyActive
                            ? 'bg-blue-50 text-blue-700 font-semibold' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <Folder className="w-4 h-4 text-amber-500 fill-amber-100 shrink-0" />
                        <span className="truncate">{s.shortName || s.id}</span>
                      </NavLink>
                    </div>

                    {/* Sub-tree: Study Sites & Zones */}
                    {isExpanded && (
                      <div className="pl-4 ml-3 border-l border-slate-200 space-y-1 py-1">
                        {(s.sites || []).length > 0 && (
                          <div className="space-y-0.5">
                            <div className="px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                              Sites ({s.sites.length})
                            </div>
                            {s.sites.map(site => {
                              const isSiteSelected = currentUrlStudy === s.id && currentUrlSite === site.id;
                              return (
                                <NavLink
                                  key={site.id}
                                  to={`/explorer?study=${encodeURIComponent(s.id)}&site=${encodeURIComponent(site.id)}`}
                                  onClick={() => setSelectedStudyId(s.id)}
                                  className={() => `block px-2 py-1 rounded-md text-[11px] truncate transition-colors ${
                                    isSiteSelected
                                      ? 'bg-blue-600 text-white font-semibold'
                                      : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                  }`}
                                >
                                  🏥 {site.id} {site.assignedStudent ? `— ${site.assignedStudent.split(' ')[0]}` : ''}
                                </NavLink>
                              );
                            })}
                          </div>
                        )}

                        <div className="pt-1 space-y-0.5">
                          <div className="px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                            TMF Zones (01–11)
                          </div>
                          {(zonesTaxonomy || []).map(z => {
                            const isZoneSelected = currentUrlStudy === s.id && currentUrlZone === z.id;
                            return (
                              <NavLink
                                key={z.id}
                                to={`/explorer?study=${encodeURIComponent(s.id)}&zone=${encodeURIComponent(z.id)}`}
                                onClick={() => setSelectedStudyId(s.id)}
                                className={() => `block px-2 py-1 rounded-md text-[11px] truncate transition-colors ${
                                  isZoneSelected
                                    ? 'bg-blue-600 text-white font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
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

              {/* Clinidea Education Students Demo */}
              <NavLink 
                to="/explorer?study=CLIN-001&view=students" 
                onClick={() => setSelectedStudyId('CLIN-001')}
                className={() => navItemClass(location.pathname === '/explorer' && currentUrlView === 'students')}
              >
                <Folder className="w-4 h-4 text-indigo-500 fill-indigo-50 shrink-0" />
                <span className="truncate">Student Training Sites</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* 2. WORKFLOW & QUALITY */}
        <div>
          <button 
            onClick={() => toggleSection('myTasks')}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <span>Workflow & Quality</span>
            {openSections.myTasks ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {openSections.myTasks && (
            <div className="space-y-0.5 mt-1.5">
              <NavLink to="/qc-queue" className={({ isActive }) => navItemClass(isActive)}>
                <ClipboardList className="w-4 h-4 text-slate-400 shrink-0" />
                <span>QC Review Queue</span>
              </NavLink>
              <NavLink to="/edl" className={({ isActive }) => navItemClass(isActive)}>
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Expected Documents (EDL)</span>
              </NavLink>
              <NavLink to="/queries" className={({ isActive }) => navItemClass(isActive)}>
                <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Queries ({openQueriesCount})</span>
              </NavLink>
              <NavLink to="/quality" className={({ isActive }) => navItemClass(isActive)}>
                <Star className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Quality Metrics</span>
              </NavLink>
              <NavLink to="/timeliness" className={({ isActive }) => navItemClass(isActive)}>
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Timeliness & SLA</span>
              </NavLink>
              <NavLink to="/inventory" className={({ isActive }) => navItemClass(isActive)}>
                <Package className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Document Inventory</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* 3. COMPLIANCE & REPORTS */}
        <div>
          <button 
            onClick={() => toggleSection('reports')}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <span>Compliance & Reports</span>
            {openSections.reports ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {openSections.reports && (
            <div className="space-y-0.5 mt-1.5">
              <NavLink to="/reports" className={({ isActive }) => navItemClass(isActive)}>
                <BarChart3 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Completeness Reports</span>
              </NavLink>
              <NavLink to="/audit-trail" className={({ isActive }) => navItemClass(isActive)}>
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>21 CFR Part 11 Audit Trail</span>
              </NavLink>
              <NavLink to="/inspector-portal" className={({ isActive }) => navItemClass(isActive)}>
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Inspector Portal</span>
              </NavLink>
              <NavLink to="/version-control" className={({ isActive }) => navItemClass(isActive)}>
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Version Control</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* 4. ADMINISTRATION */}
        <div>
          <button 
            onClick={() => toggleSection('admin')}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <span>Administration</span>
            {openSections.admin ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {openSections.admin && (
            <div className="space-y-0.5 mt-1.5">
              <NavLink to="/studies" className={({ isActive }) => navItemClass(isActive)}>
                <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Studies & Sites</span>
              </NavLink>
              <NavLink to="/roles-access" className={({ isActive }) => navItemClass(isActive)}>
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Users & Access Control</span>
              </NavLink>
            </div>
          )}
        </div>

      </div>

      {/* Subtle Minimal Footer */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-slate-400 text-[11px] flex items-center justify-between">
        <span>Clinidea Education</span>
        <span className="font-mono text-[10px]">v4.3</span>
      </div>
    </aside>
  );
}
