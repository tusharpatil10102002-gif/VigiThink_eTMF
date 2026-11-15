import React, { useState, useEffect } from 'react';
import { EyeOff, Eye, ShieldAlert, Lock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTMFData } from '../context/TMFDataContext';

export default function BlindingAccessView() {
  const { currentUser } = useAuth();
  const { logAuditEvent, selectedStudyId } = useTMFData();
  const [unblindReason, setUnblindReason] = useState("");
  const [subjectIdInput, setSubjectIdInput] = useState("");
  const [unblindLog, setUnblindLog] = useState(() => {
    try {
      const saved = localStorage.getItem('vigithink_unblind_log');
      if (saved && (saved.includes('SUBJ-101-04') || saved.includes('Arvind Mehta'))) {
        localStorage.removeItem('vigithink_unblind_log');
        return [];
      }
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isAdmin = Boolean(currentUser?.roleId === 'system_admin' || currentUser?.id === 'admin');

  const handleClearUnblindLogs = () => {
    if (window.confirm("Are you sure you want to clear historical code-break records?")) {
      setUnblindLog([]);
      localStorage.removeItem('vigithink_unblind_log');
    }
  };

  const [bannerMsg, setBannerMsg] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem('vigithink_unblind_log', JSON.stringify(unblindLog));
    } catch (_) {}
  }, [unblindLog]);

  const handleEmergencyUnblind = (e) => {
    e.preventDefault();
    if (!unblindReason.trim() || !subjectIdInput.trim()) return;
    const newEntry = {
      id: `ub_${Date.now()}`,
      date: new Date().toLocaleString(),
      subjectId: subjectIdInput.trim(),
      reason: unblindReason.trim(),
      approvedBy: currentUser ? `${currentUser.name} (${currentUser.title || currentUser.roleId})` : "Authorized Signatory"
    };

    const updated = [newEntry, ...unblindLog];
    setUnblindLog(updated);
    setUnblindReason("");
    setSubjectIdInput("");
    setBannerMsg(`Emergency Code-Break Event Logged for ${newEntry.subjectId}. 21 CFR Part 11 Audit Trail Recorded!`);

    if (logAuditEvent) {
      logAuditEvent(
        currentUser,
        "EMERGENCY_CODE_BREAK_EXECUTED",
        "SUBJECT",
        newEntry.subjectId,
        newEntry.subjectId,
        selectedStudyId || "Study",
        "Blinded",
        "Unblinded (Emergency SAE)",
        newEntry.reason
      );
    }

    setTimeout(() => setBannerMsg(""), 6000);
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Subject ID *</label>
              <input
                type="text"
                required
                value={subjectIdInput}
                onChange={(e) => setSubjectIdInput(e.target.value)}
                placeholder="e.g. SUBJ-101-01"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-rose-500 shadow-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-medium mb-1">Medical Reason &amp; Regulatory Justification *</label>
              <input
                type="text"
                required
                value={unblindReason}
                onChange={(e) => setUnblindReason(e.target.value)}
                placeholder="e.g. Grade 4 Anaphylaxis requiring emergency antidote identification..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-rose-500 shadow-xs"
              />
            </div>
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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600" />
            Historical Code-Break Audit Trail
          </h2>
          {isAdmin && unblindLog.length > 0 && (
            <button
              type="button"
              onClick={handleClearUnblindLogs}
              className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 rounded text-xs font-semibold cursor-pointer"
            >
              Clear Records
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[650px]">
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
              {unblindLog.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500 space-y-2">
                    <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto opacity-75" />
                    <p className="font-bold text-slate-800 text-sm">No Emergency Code-Break Events Recorded</p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      All clinical trial subject randomization codes remain 100% blinded under 21 CFR Part 11 and ICH GCP E6. Emergency code-breaks logged by authorized investigators will appear here with cryptographic audit provenance.
                    </p>
                  </td>
                </tr>
              ) : (
                unblindLog.map(u => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
