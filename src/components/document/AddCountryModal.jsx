import React, { useState } from 'react';
import { X, Globe, Plus } from 'lucide-react';
import { useTMFData } from '../../context/TMFDataContext';
import { useAuth } from '../../context/AuthContext';

export default function AddCountryModal({ onClose }) {
  const { addCountryToStudy, selectedStudyId, activeStudy } = useTMFData();
  const { currentUser } = useAuth();

  const [countryName, setCountryName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [regAuthority, setRegAuthority] = useState("FDA");
  const [retentionYears, setRetentionYears] = useState(25);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!countryName || !countryCode) return;
    setSubmitting(true);

    const newCountry = {
      id: countryCode.toUpperCase(),
      name: countryName,
      code: countryCode.toUpperCase(),
      regulatoryAuthority: regAuthority,
      retentionPeriodYears: Number(retentionYears),
      sites: []
    };

    await addCountryToStudy(selectedStudyId, newCountry, currentUser);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-xs font-sans">
        
        {/* Header */}
        <div className="bg-clinevo-header text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm">Add Participating Country — {activeStudy.id}</h3>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">Country Name:</label>
            <input
              type="text"
              placeholder="e.g. United Kingdom, India, Germany"
              value={countryName}
              onChange={(e) => setCountryName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">ISO Country Code:</label>
              <input
                type="text"
                placeholder="e.g. GB, IN, DE"
                maxLength={3}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 font-mono text-xs uppercase"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Retention (Years):</label>
              <input
                type="number"
                min={5}
                max={50}
                value={retentionYears}
                onChange={(e) => setRetentionYears(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">Regulatory Authority:</label>
            <select
              value={regAuthority}
              onChange={(e) => setRegAuthority(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 text-xs"
            >
              <option value="FDA">US FDA (United States)</option>
              <option value="EMA">EMA (European Medicines Agency)</option>
              <option value="MHRA">MHRA (United Kingdom)</option>
              <option value="CDSCO">CDSCO (India)</option>
              <option value="PMDA">PMDA (Japan)</option>
              <option value="TGA">TGA (Australia)</option>
              <option value="Health Canada">Health Canada</option>
            </select>
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
              {submitting ? 'Adding...' : 'Add Country'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
