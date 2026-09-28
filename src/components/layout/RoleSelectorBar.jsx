import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTMFData } from '../../context/TMFDataContext';
import { UserCheck, Shield, Filter, Eye, AlertCircle, Info, Lock } from 'lucide-react';

export default function RoleSelectorBar() {
  const { 
    currentUser, 
    currentRole, 
    demoUsers, 
    switchUserPersona, 
    selectedStudyScope, 
    setSelectedStudyScope,
    selectedCountryScope,
    setSelectedCountryScope,
    selectedSiteScope,
    setSelectedSiteScope,
    isInspectorMode,
    setIsInspectorMode
  } = useAuth();

  const { studies, selectedStudyId, setSelectedStudyId } = useTMFData();

  const activeStudyObj = studies.find(s => s.id === selectedStudyScope);
  const availableCountries = activeStudyObj?.countries || [];
  const availableSites = selectedCountryScope === 'ALL' 
    ? availableCountries.flatMap(c => c.sites)
    : availableCountries.find(c => c.code === selectedCountryScope)?.sites || [];

  return (
    <div className="bg-white border-b border-slate-200 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      {/* Role Persona Switcher (Clinidea Training Feature) */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 uppercase tracking-wider text-[11px]">
          <UserCheck className="w-3.5 h-3.5" />
          Clinidea Persona:
        </span>
        <select
          value={currentUser.id}
          onChange={(e) => switchUserPersona(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-300 rounded px-2.5 py-1 font-medium focus:outline-none focus:border-blue-500 cursor-pointer text-xs shadow-xs"
        >
          {demoUsers.map(u => (
            <option key={u.id} value={u.id}>
              {u.name} — ({u.title} | {u.organization})
            </option>
          ))}
        </select>
        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${currentRole.badgeColor}`}>
          {currentRole.name}
        </span>
      </div>

      {/* 4D Permission Scoping Controls (Role x Study x Country x Site) */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-slate-500 font-medium">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          4D Scope:
        </span>
        
        {/* Study Scope */}
        <select
          value={selectedStudyScope}
          onChange={(e) => {
            setSelectedStudyScope(e.target.value);
            setSelectedStudyId(e.target.value);
            setSelectedCountryScope("ALL");
            setSelectedSiteScope("ALL");
          }}
          className="bg-slate-50 text-slate-800 border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 text-xs shadow-xs"
        >
          {studies.map(s => (
            <option key={s.id} value={s.id}>{s.id} ({s.shortName})</option>
          ))}
        </select>

        {/* Country Scope */}
        <select
          value={selectedCountryScope}
          onChange={(e) => {
            setSelectedCountryScope(e.target.value);
            setSelectedSiteScope("ALL");
          }}
          className="bg-slate-50 text-slate-800 border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 text-xs shadow-xs"
        >
          <option value="ALL">All Countries</option>
          {availableCountries.map(c => (
            <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
          ))}
        </select>

        {/* Site Scope */}
        <select
          value={selectedSiteScope}
          onChange={(e) => setSelectedSiteScope(e.target.value)}
          className="bg-slate-50 text-slate-800 border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 text-xs shadow-xs"
        >
          <option value="ALL">All Sites</option>
          {availableSites.map(s => (
            <option key={s.id} value={s.id}>{s.number} — {s.name}</option>
          ))}
        </select>
      </div>

      {/* FDA/EMA Inspector Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setIsInspectorMode(!isInspectorMode);
            if (!isInspectorMode) {
              switchUserPersona("usr_fda_auditor");
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            isInspectorMode 
              ? 'bg-rose-600 text-white shadow-md shadow-rose-200 animate-pulse' 
              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          {isInspectorMode ? 'Inspector Mode ACTIVE (Read-Only)' : 'Inspector Read-Only View'}
        </button>
      </div>
    </div>
  );
}
