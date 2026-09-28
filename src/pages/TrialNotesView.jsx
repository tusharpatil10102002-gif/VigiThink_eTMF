import React, { useState } from 'react';
import { useTMFData } from '../context/TMFDataContext';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, Search, Calendar, User, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TrialNotesView() {
  const { selectedStudyId, activeStudy, logAuditEvent } = useTMFData();
  const { currentUser } = useAuth();

  const [notes, setNotes] = useState([
    {
      id: "NTF-2026-001",
      title: "Note to File: Delay in Site 101 Delegation Log Counter-Signature",
      studyId: selectedStudyId,
      siteId: "SITE-101",
      author: "Veepra Singh (Lead CRA)",
      date: "2026-09-10",
      category: "Process Deviation",
      content: "Due to PI temporary leave from 01-Sep to 08-Sep, the Delegation of Authority (DOA) log was counter-signed upon PI return on 09-Sep. No study tasks were delegated in the interim.",
      status: "Approved"
    },
    {
      id: "NTF-2026-002",
      title: "Monitor Visit Clarification Memo — Site 102 Pharmacy Temp Excursion",
      studyId: selectedStudyId,
      siteId: "SITE-102",
      author: "Amit Nakhe (CRA)",
      date: "2026-09-12",
      category: "IP & Trial Supplies",
      content: "Brief 15-minute temperature excursion noted in IP storage unit on 05-Sep (26.2°C vs upper limit 25°C). QA Sponsor assessment confirmed drug stability unaffected.",
      status: "Approved"
    }
  ]);

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSiteId, setNewSiteId] = useState("SITE-101");
  const [newCategory, setNewCategory] = useState("Note to File (NTF)");
  const [newContent, setNewContent] = useState("");

  const handleCreateNote = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const noteObj = {
      id: `NTF-2026-${String(notes.length + 1).padStart(3, '0')}`,
      title: newTitle,
      studyId: selectedStudyId,
      siteId: newSiteId,
      author: `${currentUser.name} (${currentUser.roleId})`,
      date: new Date().toISOString().split('T')[0],
      category: newCategory,
      content: newContent,
      status: "Approved"
    };

    setNotes(prev => [noteObj, ...prev]);
    logAuditEvent(currentUser, "NOTE_TO_FILE_CREATED", "NTF", noteObj.id, noteObj.title, selectedStudyId, "None", "Active", "Regulatory Note to File filed in eTMF");
    setShowAddModal(false);
    setNewTitle("");
    setNewContent("");
  };

  const filteredNotes = notes.filter(n => {
    if (search) {
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full font-sans text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-700" />
            Notes to File (NTF) & Trial Communication Memos
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            GxP documentation of process discrepancies, monitor memos, and GCP trial administrative notes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-800 rounded border border-blue-300 font-mono font-bold">
            Trial: {activeStudy.id}
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-clinevo-blue hover:bg-blue-700 text-white rounded font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> File New Note to File
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search notes by keyword or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded pl-9 pr-3 py-1.5 focus:border-blue-500 text-xs"
          />
        </div>
        <span className="text-[11px] text-slate-500 font-mono">Showing {filteredNotes.length} Note(s)</span>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.map(n => (
          <div key={n.id} className="glass-panel p-5 rounded-xl space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {n.id}
                </span>
                <span className="font-bold text-slate-800 text-sm">{n.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[10px] border border-slate-300">
                  Site: {n.siteId}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] border border-emerald-300">
                  {n.status}
                </span>
              </div>
            </div>

            <p className="text-slate-700 leading-relaxed text-justify">{n.content}</p>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-mono">
              <span>Author: <strong className="text-slate-700">{n.author}</strong></span>
              <span>Filed Date: {n.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 text-xs font-sans">
            <h3 className="font-bold text-slate-900 text-sm border-b pb-2">
              File New Note to File (NTF) — {activeStudy.id}
            </h3>

            <form onSubmit={handleCreateNote} className="space-y-3">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Note Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Note to File: Protocol Deviation Explanation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Site ID:</label>
                  <input
                    type="text"
                    value={newSiteId}
                    onChange={(e) => setNewSiteId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
                  >
                    <option value="Note to File (NTF)">Note to File (NTF)</option>
                    <option value="Monitor Visit Memo">Monitor Visit Memo</option>
                    <option value="Process Deviation">Process Deviation</option>
                    <option value="Administrative Clarification">Administrative Clarification</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Detailed Statement / Rationale:</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Describe the context, corrective action, GCP rationale, and preventative steps..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-2 focus:border-blue-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-clinevo-blue hover:bg-blue-700 text-white rounded font-bold shadow-xs cursor-pointer"
                >
                  Publish NTF to TMF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
