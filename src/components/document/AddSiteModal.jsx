import React, { useState } from 'react';
import { X, Building2, Plus, UserCheck, ShieldCheck } from 'lucide-react';
import { useTMFData } from '../../context/TMFDataContext';
import { useAuth } from '../../context/AuthContext';

export default function AddSiteModal({ onClose, defaultCountryId }) {
  const { addSiteToStudy, activeStudy, selectedStudyId } = useTMFData();
  const { currentUser, usersList = [] } = useAuth();

  const countries = activeStudy?.countries || [
    { id: "IN", name: "India", code: "IND" },
    { id: "US", name: "USA", code: "USA" }
  ];

  // 1. Principal Investigator (PI) users
  const piUsers = (usersList || []).filter(u =>
    u.roleId === 'investigator' ||
    u.roleId === 'site_user' ||
    u.position?.toLowerCase().includes('investigator') ||
    u.title?.toLowerCase().includes('investigator') ||
    u.position?.toLowerCase().includes('pi')
  );

  // 2. Clinical Research Coordinator (CRC) / Site users
  const crcUsers = (usersList || []).filter(u =>
    u.roleId === 'site_user' ||
    u.position?.toLowerCase().includes('crc') ||
    u.position?.toLowerCase().includes('coordinator') ||
    u.title?.toLowerCase().includes('coordinator') ||
    u.trainingRole?.toLowerCase().includes('crc') ||
    u.position?.toLowerCase().includes('student')
  );

  // 3. Clinical Research Associate (CRA) users
  const craUsers = (usersList || []).filter(u =>
    u.roleId === 'cra' ||
    u.roleId === 'cra_trainee' ||
    u.position?.toLowerCase().includes('cra') ||
    u.trainingRole?.toLowerCase().includes('cra')
  );

  const [countryId, setCountryId] = useState(defaultCountryId || countries[0]?.id || "IN");
  const [siteNumber, setSiteNumber] = useState("");
  const [siteName, setSiteName] = useState("");
  
  // PI Assignment
  const [selectedPiId, setSelectedPiId] = useState("manual");
  const [piName, setPiName] = useState("");
  const [piLicense, setPiLicense] = useState("");
  const [piEmail, setPiEmail] = useState("");

  // CRC Assignment
  const [selectedCrcId, setSelectedCrcId] = useState("manual");
  const [crcName, setCrcName] = useState("");
  const [crcEmail, setCrcEmail] = useState("");

  // CRA Assignment
  const [assignedCraId, setAssignedCraId] = useState(craUsers[0]?.id || "manual");
  const [assignedCraName, setAssignedCraName] = useState(craUsers[0]?.name || "Shweta Pagare");

  const [targetEnrollment, setTargetEnrollment] = useState(25);
  const [activationDate, setActivationDate] = useState(new Date().toISOString().split('T')[0]);
  const [siteStatus, setSiteStatus] = useState("Active");
  const [submitting, setSubmitting] = useState(false);

  const handlePiSelect = (piId) => {
    setSelectedPiId(piId);
    if (piId === "manual") {
      setPiName("");
      setPiLicense("");
      setPiEmail("");
    } else {
      const user = piUsers.find(u => u.id === piId || u.loginId === piId);
      if (user) {
        setPiName(user.name);
        setPiEmail(user.email || `${user.loginId}@vigithink.com`);
        setPiLicense(`MD-LIC-${user.loginId.substring(0, 8).toUpperCase()}`);
      }
    }
  };

  const handleCrcSelect = (crcId) => {
    setSelectedCrcId(crcId);
    if (crcId === "manual") {
      setCrcName("");
      setCrcEmail("");
    } else {
      const user = crcUsers.find(u => u.id === crcId || u.loginId === crcId);
      if (user) {
        setCrcName(user.name);
        setCrcEmail(user.email || `${user.loginId}@vigithink.com`);
      }
    }
  };

  const handleCraSelect = (craId) => {
    setAssignedCraId(craId);
    if (craId === "manual") {
      setAssignedCraName("");
    } else {
      const user = craUsers.find(u => u.id === craId || u.loginId === craId);
      if (user) {
        setAssignedCraName(user.name);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!siteNumber || !siteName || !piName) return;
    setSubmitting(true);

    const newSite = {
      id: `SITE-${siteNumber}`,
      number: siteNumber,
      name: siteName,
      country: countries.find(c => c.id === countryId)?.name || countryId,
      piName,
      piLicense: piLicense || `MD-LIC-${Date.now().toString().substring(6)}`,
      piEmail: piEmail || `${piName.toLowerCase().replace(/[^a-z]/g, '')}@hospital.org`,
      assignedPiId: selectedPiId !== 'manual' ? selectedPiId : undefined,
      crcName: crcName || undefined,
      crcEmail: crcEmail || undefined,
      assignedCrcId: selectedCrcId !== 'manual' ? selectedCrcId : undefined,
      assignedCraId: assignedCraId !== 'manual' ? assignedCraId : undefined,
      assignedCraName: assignedCraName || 'Shweta Pagare',
      assignedStudent: assignedCraName || 'Shweta Pagare',
      activationDate,
      status: siteStatus,
      targetEnrollment: Number(targetEnrollment),
      actualEnrollment: 0,
      enrolledCount: 0,
      completenessPct: 0
    };

    await addSiteToStudy(selectedStudyId, countryId, newSite, currentUser);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden text-xs font-sans max-h-[92vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-sky-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Add Trial Site &amp; Assign Personnel</h3>
              <p className="text-[11px] text-sky-200">Protocol: {activeStudy?.id} ({activeStudy?.shortName})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Row 1: Country & Site Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Country Location *</label>
              <select
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs font-semibold"
              >
                {countries.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Site Number *</label>
              <input
                type="text"
                placeholder="e.g. 101, 102"
                value={siteNumber}
                onChange={(e) => setSiteNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 font-mono text-xs font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Hospital / Facility Name *</label>
              <input
                type="text"
                placeholder="e.g. Apollo Cancer Institute"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs font-semibold"
                required
              />
            </div>
          </div>

          {/* Section 2: Principal Investigator (PI) Assignment */}
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                <UserCheck className="w-4 h-4 text-blue-700" /> 1. Assign Principal Investigator (PI)
              </span>
              <span className="text-[10px] text-blue-700 font-medium">Investigator Oversight</span>
            </div>

            {piUsers.length > 0 && (
              <div className="space-y-0.5">
                <label className="text-[11px] font-semibold text-slate-600">Select Admin-Created PI Account:</label>
                <select
                  value={selectedPiId}
                  onChange={(e) => handlePiSelect(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                >
                  <option value="manual">+ Enter / Type PI Details Manually</option>
                  {piUsers.map(pi => (
                    <option key={pi.id} value={pi.id}>
                      {pi.name} ({pi.position || pi.title || 'Principal Investigator'}) [{pi.loginId}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">PI Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Arvind Sharma, MD"
                  value={piName}
                  onChange={(e) => setPiName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Medical License #</label>
                <input
                  type="text"
                  placeholder="e.g. MCI-2026-9814"
                  value={piLicense}
                  onChange={(e) => setPiLicense(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">PI Email Address</label>
                <input
                  type="email"
                  placeholder="pi@hospital.org"
                  value={piEmail}
                  onChange={(e) => setPiEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Clinical Research Coordinator (CRC) / Site User Assignment */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" /> 2. Assign Clinical Research Coordinator (CRC)
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">Site File Operations</span>
            </div>

            {crcUsers.length > 0 && (
              <div className="space-y-0.5">
                <label className="text-[11px] font-semibold text-slate-600">Select Admin-Created CRC / Site User Account:</label>
                <select
                  value={selectedCrcId}
                  onChange={(e) => handleCrcSelect(e.target.value)}
                  className="w-full bg-white border border-emerald-300 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                >
                  <option value="manual">+ Enter / Type CRC Details Manually</option>
                  {crcUsers.map(crc => (
                    <option key={crc.id} value={crc.id}>
                      {crc.name} ({crc.position || crc.title || 'CRC / Site User'}) [{crc.loginId}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">CRC Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sanjay Pawar / Coordinator Name"
                  value={crcName}
                  onChange={(e) => setCrcName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">CRC Email Address</label>
                <input
                  type="email"
                  placeholder="crc@hospital.org"
                  value={crcEmail}
                  onChange={(e) => setCrcEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Clinical Research Associate (CRA) Assignment & Site Configuration */}
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 text-xs">
                3. Assign CRA &amp; Activation Parameters
              </span>
              <span className="text-[10px] text-amber-700 font-medium">Monitoring Oversight</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Assigned CRA *</label>
                <select
                  value={assignedCraId}
                  onChange={(e) => handleCraSelect(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900"
                >
                  {craUsers.map(cra => (
                    <option key={cra.id} value={cra.id}>
                      {cra.name} ({cra.roleId})
                    </option>
                  ))}
                  <option value="manual">+ Enter CRA Manually</option>
                </select>
                {assignedCraId === 'manual' && (
                  <input
                    type="text"
                    placeholder="Enter CRA Name"
                    value={assignedCraName}
                    onChange={(e) => setAssignedCraName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs mt-1"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Site Status *</label>
                <select
                  value={siteStatus}
                  onChange={(e) => setSiteStatus(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="Pending Initiation">Pending Initiation</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Target Enrollment *</label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={targetEnrollment}
                  onChange={(e) => setTargetEnrollment(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'Creating Site & Assigning Roles...' : 'Create Site & Assign Roles'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
