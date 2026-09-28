import React, { useState } from 'react';
import { EyeOff, Eye, ShieldAlert, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BlindingAccessView() {
  const { currentUser } = useAuth();
  const [unblindReason, setUnblindReason] = useState("");
  const [unblindLog, setUnblindLog] = useState([
    { id: "ub_1", date: "2026-02-10 14:00", subjectId: "SUBJ-101-04", reason: "Emergency SAE Code Break (Anaphylaxis)", approvedBy: "Dr. Arvind Mehta (PI)" }
  ]);

  const [bannerMsg, setBannerMsg] = useState("");

  const handleEmergencyUnblind = (e) => {
    e.preventDefault();
    if (!unblindReason) return;
    const newEntry = {
      id: `ub_${Date.now()}`,
      date: new Date().toLocaleString(),
      subjectId: "SUBJ-101-09",
      reason: unblindReason,
      approvedBy: `${currentUser.name} (${currentUser.title})`
    };
    setUnblindLog([newEntry, ...unblindLog]);
    setUnblindReason("");
    setBannerMsg("Emergency Unblinding Event Logged & Audit Notification Fired to Medical Monitor!");
    setTimeout(() => setBannerMsg(""), 5000);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-amber-600" />
            GCP Blinding Controls & Emergency Code-Break Log
          </h1>
          <p className="text-xs text-slate-500 font-mono">Restricted access layer for randomized double-blind trial integrity (Blinded vs Unblinded Teams)</p>
        </div>

        <span className="px-3 py-1 rounded bg-amber-100 text-amber-800 border border-amber-300 font-mono text-xs font-bold shadow-xs">
          Trial Status: Double-Blind Active
        </span>
      </div>

      {bannerMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-lg text-xs font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          {bannerMsg}
        </div>
      )}

      {/* Emergency Unblinding Form */}
      <div className="glass-panel p-5 rounded-xl space-y-4 border-l-4 border-l-rose-500">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          Emergency Code-Break Request (Medical Emergency Only)
        </h2>

        <form onSubmit={handleEmergencyUnblind} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Medical Reason & Regulatory Justification *</label>
            <textarea
              rows={2}
              value={unblindReason}
              onChange={(e) => setUnblindReason(e.target.value)}
              placeholder="e.g. Life-threatening Grade 4 Adverse Event requiring immediate treatment identification..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:border-rose-500 shadow-xs"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" /> Log Emergency Unblinding Event
          </button>
        </form>
      </div>

      {/* Code-break Audit History */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600" />
          Historical Code-Break Audit Trail
        </h2>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase">
              <th className="p-3">Event Date</th>
              <th className="p-3">Subject ID</th>
              <th className="p-3">Unblinding Justification</th>
              <th className="p-3">Approved By</th>
              <th className="p-3 text-right">Audit Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {unblindLog.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono text-blue-700 font-bold">{u.date}</td>
                <td className="p-3 font-bold font-mono text-slate-900">{u.subjectId}</td>
                <td className="p-3 text-slate-700">{u.reason}</td>
                <td className="p-3 font-semibold text-amber-800">{u.approvedBy}</td>
                <td className="p-3 text-right">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                    Part 11 Logged
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
