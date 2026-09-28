import React, { useState } from 'react';
import { X, Building2, Plus } from 'lucide-react';
import { useTMFData } from '../../context/TMFDataContext';
import { useAuth } from '../../context/AuthContext';

export default function AddSiteModal({ onClose, defaultCountryId }) {
  const { addSiteToStudy, activeStudy, selectedStudyId } = useTMFData();
  const { currentUser } = useAuth();

  const countries = activeStudy?.countries || [];
  const [countryId, setCountryId] = useState(defaultCountryId || countries[0]?.id || "US");
  const [siteNumber, setSiteNumber] = useState("");
  const [siteName, setSiteName] = useState("");
  const [piName, setPiName] = useState("");
  const [piLicense, setPiLicense] = useState("");
  const [targetEnrollment, setTargetEnrollment] = useState(25);
  const [activationDate, setActivationDate] = useState("2026-09-01");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!siteNumber || !siteName || !piName) return;
    setSubmitting(true);

    const newSite = {
      id: `SITE-${siteNumber}`,
      number: siteNumber,
      name: siteName,
      piName,
      piLicense: piLicense || `MD-LIC-${Date.now().toString().substring(6)}`,
      activationDate,
      targetEnrollment: Number(targetEnrollment),
      enrolledCount: 0,
      completenessPct: 0
    };

    await addSiteToStudy(selectedStudyId, countryId, newSite, currentUser);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-xs font-sans">
        
        {/* Header */}
        <div className="bg-clinevo-header text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm">Add Trial Investigator Site — {activeStudy.id}</h3>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">Country Location:</label>
            <select
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
            >
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Site Number:</label>
              <input
                type="text"
                placeholder="e.g. 101, 102, 004"
                value={siteNumber}
                onChange={(e) => setSiteNumber(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 font-mono text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Hospital / Facility Name:</label>
              <input
                type="text"
                placeholder="e.g. Apollo Hospital, Mayo Clinic"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Principal Investigator (PI):</label>
              <input
                type="text"
                placeholder="e.g. Dr. Rajesh Sharma, MD"
                value={piName}
                onChange={(e) => setPiName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">PI Medical License #:</label>
              <input
                type="text"
                placeholder="e.g. MCI-2019-94812"
                value={piLicense}
                onChange={(e) => setPiLicense(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Site Activation Date:</label>
              <input
                type="date"
                value={activationDate}
                onChange={(e) => setActivationDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Target Enrollment:</label>
              <input
                type="number"
                min={1}
                max={5000}
                value={targetEnrollment}
                onChange={(e) => setTargetEnrollment(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-clinevo-blue hover:bg-blue-700 text-white rounded font-bold shadow-xs cursor-pointer flex items-center gap-1"
            >
              {submitting ? 'Adding...' : 'Add Site'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
