import React, { useState } from 'react';
import { useTMFData } from '../context/TMFDataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Globe, 
  UserCheck, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Archive,
  MapPin,
  FileSpreadsheet,
  Trash2,
  Folder
} from 'lucide-react';
import CreateStudyModal from '../components/study/CreateStudyModal';
import ArchiveStudyModal from '../components/study/ArchiveStudyModal';
import AddCountryModal from '../components/document/AddCountryModal';
import AddSiteModal from '../components/document/AddSiteModal';
import MilestonesModal from '../components/document/MilestonesModal';

export default function StudiesManagement() {
  const { studies, selectedStudyId, setSelectedStudyId, activeStudy, deleteStudy } = useTMFData();
  const { currentUser, currentRole, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState("hierarchy");

  const isSystemAdmin =
    hasPermission('admin') ||
    currentUser?.role === 'system_admin' ||
    currentUser?.roleId === 'system_admin';

  const canDeleteStudy = isSystemAdmin;
  const canCreateOrEditStudy = isSystemAdmin;

  const handleDeleteStudy = (studyObj, e) => {
    if (e) e.stopPropagation();
    if (!studyObj || !canDeleteStudy) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently DELETE Study "${studyObj.id} — ${studyObj.shortName || studyObj.title}" and all its associated records?`
    );
    if (confirmed) {
      deleteStudy(studyObj.id, currentUser, `Study ${studyObj.id} deleted from /studies by ${currentUser?.name || 'Admin'}`);
    }
  };

  // Modals
  const [showCreateStudy, setShowCreateStudy] = useState(false);
  const [showAddCountry, setShowAddCountry] = useState(false);
  const [showAddSite, setShowAddSite] = useState(false);
  const [selectedCountryForSite, setSelectedCountryForSite] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);

  if (!activeStudy) {
    return (
      <div className="p-6 space-y-4 bg-slate-50 min-h-full">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
          <p className="text-sm font-bold text-slate-700">No Clinical Studies Currently Configured</p>
          {canCreateOrEditStudy ? (
            <>
              <p className="text-xs text-slate-500">Click "Create New Study" below to set up a new clinical trial protocol.</p>
              <button
                onClick={() => setShowCreateStudy(true)}
                className="px-4 py-2 bg-clinevo-blue hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create New Study
              </button>
            </>
          ) : (
            <p className="text-xs text-amber-700 font-semibold">
              🔒 Only System Administrator (Tushar Patil — admin@clinidea.in) can create new studies.
            </p>
          )}
        </div>
        {canCreateOrEditStudy && showCreateStudy && <CreateStudyModal onClose={() => setShowCreateStudy(false)} />}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      {/* Access Governance Banner for Non-Admin Users */}
      {!isSystemAdmin && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div>
            <strong>🔒 Read-Only Protocol & Site Hierarchy View</strong> — Logged in as <strong>{currentUser?.name}</strong> (<span className="font-mono font-bold">{currentRole?.name}</span>).
            Study Creation, Study Deletion, Country/Site Setup, and Trial Archiving are strictly restricted to <strong>System Administrator (Tushar Patil — admin@clinidea.in)</strong>.
          </div>
          <span className="px-2.5 py-1 bg-amber-200/70 text-amber-950 rounded font-mono font-bold text-[10px] shrink-0">
            RBAC Enforced
          </span>
        </div>
      )}

      {/* Header Selector & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-700" />
            Study Setup, Country & Site Hierarchy Manager
          </h1>
          <p className="text-xs text-slate-500 font-mono">Module 3: Protocol configuration, Principal Investigators, and binding milestones</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 mr-2">
            <label className="text-xs text-slate-600 font-semibold">Active Trial:</label>
            <select
              value={selectedStudyId}
              onChange={(e) => setSelectedStudyId(e.target.value)}
              className="bg-white border border-slate-300 text-blue-700 font-bold rounded px-3 py-1.5 text-xs focus:border-blue-500 shadow-xs"
            >
              {studies.map(s => (
                <option key={s.id} value={s.id}>{s.id} ({s.shortName})</option>
              ))}
            </select>
          </div>

          {canCreateOrEditStudy && (
            <button
              onClick={() => setShowCreateStudy(true)}
              className="px-3 py-1.5 bg-clinevo-blue hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create New Study (Admin)
            </button>
          )}

          {canDeleteStudy && (
            <button
              onClick={(e) => handleDeleteStudy(activeStudy, e)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Permanently Delete Selected Study (System Admin)"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Study ({activeStudy.id})
            </button>
          )}
        </div>
      </div>

      {/* All Created Studies Quick List with Direct Delete Option (Admin Only for Delete) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Folder className="w-4 h-4 text-amber-500 fill-amber-100" />
            All Configured Clinical Studies ({studies.length}) {canDeleteStudy ? '— Select or Delete (System Admin)' : '— Select Study'}
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {canDeleteStudy ? 'Click any study card to manage its hierarchy, or click Delete to remove it' : 'Click any study card to inspect its protocol & site hierarchy'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {studies.map((s) => {
            const isSelected = s.id === selectedStudyId;
            return (
              <div
                key={s.id}
                onClick={() => setSelectedStudyId(s.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                  isSelected
                    ? 'bg-sky-50/80 border-blue-500 ring-1 ring-blue-500/30'
                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono font-bold text-[10px]">
                      {s.id}
                    </span>
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[9px]">
                      {s.status}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-xs truncate" title={s.shortName || s.title}>
                    {s.shortName || s.title}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    Protocol: {s.protocolNumber || 'N/A'} | Sites: {s.sites?.length || 0}
                  </p>
                </div>

                {canDeleteStudy && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteStudy(s, e)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded border border-rose-200 transition-colors shrink-0 cursor-pointer"
                    title={`Delete Study ${s.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trial Details Card */}
      <div className="glass-panel p-5 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200">
              Protocol: {activeStudy.protocolNumber}
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">{activeStudy.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded font-bold text-xs border ${
              activeStudy.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
            }`}>
              Status: {activeStudy.status}
            </span>

            {canCreateOrEditStudy && activeStudy.status === 'Active' && (
              <button
                onClick={() => setShowArchiveModal(true)}
                className="px-3 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs border border-amber-200 flex items-center gap-1 cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5 text-amber-600" /> Close-Out & Archive
              </button>
            )}

            {canDeleteStudy && (
              <button
                onClick={(e) => handleDeleteStudy(activeStudy, e)}
                className="px-3 py-1 rounded bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-semibold text-xs border border-rose-200 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Study
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500">Therapeutic Area:</span>
            <p className="text-slate-800 font-semibold">{activeStudy.therapeuticArea}</p>
          </div>
          <div>
            <span className="text-slate-500">Indication:</span>
            <p className="text-slate-800 font-semibold">{activeStudy.indication}</p>
          </div>
          <div>
            <span className="text-slate-500">Sponsor:</span>
            <p className="text-slate-800 font-semibold">{activeStudy.sponsor}</p>
          </div>
          <div>
            <span className="text-slate-500">CRO Partner:</span>
            <p className="text-slate-800 font-semibold">{activeStudy.cro}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("hierarchy")}
            className={`pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'hierarchy' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
            }`}
          >
            Country & Site Hierarchy
          </button>
          <button
            onClick={() => setActiveTab("milestones")}
            className={`pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'milestones' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
            }`}
          >
            Trial Milestones & Document Binding
          </button>
        </div>

        {canCreateOrEditStudy && activeTab === 'hierarchy' && (
          <button
            onClick={() => setShowAddCountry(true)}
            className="pb-2 text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Participating Country
          </button>
        )}

        {canCreateOrEditStudy && activeTab === 'milestones' && (
          <button
            onClick={() => setShowMilestonesModal(true)}
            className="pb-2 text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" /> Manage Milestones
          </button>
        )}
      </div>

      {/* Tab 1: Country & Site Hierarchy */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-4">
          {(activeStudy.countries || []).length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-slate-400 italic">
              No participating countries configured for this study yet.
            </div>
          ) : (
            activeStudy.countries.map(c => (
              <div key={c.id} className="glass-panel p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">{c.name} ({c.code})</h3>
                    <span className="text-xs text-slate-500 font-mono">| Regulatory: {c.regulatoryAuthority}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                      Retention: {c.retentionPeriodYears} Years
                    </span>
                    {canCreateOrEditStudy && (
                      <button
                        onClick={() => {
                          setSelectedCountryForSite(c.id);
                          setShowAddSite(true);
                        }}
                        className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded font-semibold text-xs border border-sky-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-sky-600" /> Add Site to {c.code}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sites Table */}
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 font-mono border-b border-slate-200 text-[11px] uppercase bg-slate-50">
                      <th className="p-2">Site Number & Name</th>
                      <th className="p-2">Principal Investigator</th>
                      <th className="p-2">Medical License #</th>
                      <th className="p-2">Activation Date</th>
                      <th className="p-2">Enrollment</th>
                      <th className="p-2 text-right">Completeness</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {(c.sites || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                          No clinical investigator sites added yet under {c.name}.
                        </td>
                      </tr>
                    ) : (
                      c.sites.map(s => (
                        <tr key={s.id || s.number} className="hover:bg-slate-50">
                          <td className="py-2.5 px-2 font-bold text-slate-900">
                            {s.number} — {s.name}
                          </td>
                          <td className="py-2.5 px-2 text-blue-700 font-semibold">{s.piName}</td>
                          <td className="py-2.5 px-2 font-mono text-slate-600">{s.piLicense}</td>
                          <td className="py-2.5 px-2 font-mono text-slate-600">{s.activationDate}</td>
                          <td className="py-2.5 px-2 font-mono text-slate-800">{s.enrolledCount} / {s.targetEnrollment}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-700">{s.completenessPct}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Trial Milestones */}
      {activeTab === 'milestones' && (
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Trial Milestones & Required Document Binding</h3>
          <div className="space-y-3">
            {(activeStudy.milestones || []).map(m => (
              <div key={m.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${m.status === 'Completed' ? 'bg-emerald-500' : m.status === 'In Progress' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
                  <div>
                    <p className="font-bold text-slate-900">{m.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">Target Date: {m.date} | Binding Artifacts: {(m.bindingArtifactIds || []).join(', ')}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                  m.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                  m.status === 'In Progress' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                  'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateStudy && <CreateStudyModal onClose={() => setShowCreateStudy(false)} />}
      {showAddCountry && <AddCountryModal onClose={() => setShowAddCountry(false)} />}
      {showAddSite && <AddSiteModal defaultCountryId={selectedCountryForSite} onClose={() => setShowAddSite(false)} />}
      {showArchiveModal && <ArchiveStudyModal study={activeStudy} onClose={() => setShowArchiveModal(false)} />}
      {showMilestonesModal && <MilestonesModal onClose={() => setShowMilestonesModal(false)} />}
    </div>
  );
}
