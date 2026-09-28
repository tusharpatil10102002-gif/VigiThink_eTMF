import React, { useState } from 'react';
import { X, Calendar, Download, Plus, Check } from 'lucide-react';

export default function MilestonesModal({ onClose }) {
  const [successMessage, setSuccessMessage] = useState("The Milestone has been imported to folder");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setSuccessMessage("Milestone schedule and due dates saved to clinical trial folder successfully!");
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const milestonesList = [
    { level: "Study", folder: "FEBMAR2024", seq: "1", milestone: "01 First Country RA approval", planned: "2024-03-01", actual: "2024-03-05" },
    { level: "Study", folder: "FEBMAR2024", seq: "2", milestone: "02 Clinical Infrastructure Ready", planned: "2024-03-15", actual: "2024-03-18" },
    { level: "Study", folder: "FEBMAR2024", seq: "3", milestone: "03 Site Open for Enrollment", planned: "2024-04-01", actual: "2024-04-02" },
    { level: "Study", folder: "FEBMAR2024", seq: "4", milestone: "04 First Monitoring Visit", planned: "2024-04-15", actual: "2024-04-16" },
    { level: "Study", folder: "FEBMAR2024", seq: "5", milestone: "05 Significant Study Event", planned: "2024-05-01", actual: "2024-05-02" },
    { level: "Study", folder: "FEBMAR2024", seq: "6", milestone: "07 Last Subject Last Visit", planned: "2024-06-01", actual: "2024-06-05" },
    { level: "Study", folder: "FEBMAR2024", seq: "7", milestone: "08 Database Lock", planned: "2024-07-01", actual: "" },
    { level: "Study", folder: "FEBMAR2024", seq: "8", milestone: "09 Close Out Monitoring Visit", planned: "2024-08-01", actual: "" },
    { level: "Study", folder: "FEBMAR2024", seq: "9", milestone: "10 Clinical Study Report Approved", planned: "2024-09-01", actual: "" },
    { level: "Study", folder: "FEBMAR2024", seq: "10", milestone: "11 Ongoing", planned: "2024-10-01", actual: "" },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] text-xs font-sans">
        
        {/* Header matching Screenshot Page 15 & 16 */}
        <div className="bg-clinevo-blue text-white px-4 py-2.5 flex items-center justify-between font-bold">
          <span className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Milestones Due Date
          </span>
          <button onClick={onClose} className="p-1 text-white hover:bg-blue-700 rounded cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert Banner matching screenshot 16 */}
        {successMessage && (
          <div className="bg-emerald-50 border-b border-emerald-300 p-2.5 text-emerald-900 font-medium flex items-center gap-2 text-xs">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Sub Header controls */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <span>Structure Name:</span>
            <span className="font-bold text-blue-900 bg-sky-100 px-2 py-0.5 rounded border border-sky-300">Study</span>
            <button className="bg-clinevo-blue text-white px-2 py-0.5 rounded text-[11px] font-bold">+ </button>
          </div>

          <button className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1 rounded font-semibold shadow-xs flex items-center gap-1 cursor-pointer">
            <Download className="w-3.5 h-3.5 text-emerald-600" /> To Excel
          </button>
        </div>

        {/* Milestones Data Table */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-clinevo-table-header text-white font-bold text-[11px]">
                <th className="p-2 border border-blue-800">Level Name</th>
                <th className="p-2 border border-blue-800">Folder Name</th>
                <th className="p-2 border border-blue-800 text-center">Sequence</th>
                <th className="p-2 border border-blue-800">Milestone Status</th>
                <th className="p-2 border border-blue-800">Planned Date</th>
                <th className="p-2 border border-blue-800">Actual Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-sans">
              {milestonesList.map((m, idx) => (
                <tr key={idx} className="hover:bg-sky-50/60">
                  <td className="p-2 border border-slate-200 text-slate-700">{m.level}</td>
                  <td className="p-2 border border-slate-200 font-bold text-slate-800">{m.folder}</td>
                  <td className="p-2 border border-slate-200 text-center font-mono font-bold text-slate-700">{m.seq}</td>
                  <td className="p-2 border border-slate-200 font-semibold text-slate-900">{m.milestone}</td>
                  <td className="p-2 border border-slate-200 font-mono text-slate-600">{m.planned}</td>
                  <td className="p-2 border border-slate-200 font-mono text-emerald-700 font-bold">{m.actual || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex justify-end gap-2">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-clinevo-blue hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSaving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Save
          </button>
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-1.5 rounded cursor-pointer">
            Undo
          </button>
        </div>

      </div>
    </div>
  );
}
