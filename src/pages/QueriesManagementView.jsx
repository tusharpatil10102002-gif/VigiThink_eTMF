import React, { useState } from 'react';
import { useTMFData } from '../context/TMFDataContext';
import { useAuth } from '../context/AuthContext';
import { 
  HelpCircle, 
  CheckCircle2, 
  Send, 
  Filter, 
  Search,
  Eye,
  Plus,
  XCircle
} from 'lucide-react';
import DocumentViewerDrawer from '../components/document/DocumentViewerDrawer';

export default function QueriesManagementView() {
  const { documents, queries, selectedStudyId, activeStudy, raiseQuery, resolveQuery } = useTMFData();
  const { currentUser } = useAuth();

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [studyScopeMode, setStudyScopeMode] = useState("ALL"); // 'ALL' | 'ACTIVE_STUDY'
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [respondingQueryId, setRespondingQueryId] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [showNewQueryModal, setShowNewQueryModal] = useState(false);
  const [newQueryDocId, setNewQueryDocId] = useState("");
  const [newQueryCategory, setNewQueryCategory] = useState("Missing Required Signature");
  const [newQueryComment, setNewQueryComment] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const showToast = (text) => {
    setFeedbackMsg(text);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Merge formal queries from /api/queries with any document flagged as 'Query Raised'
  const docFlaggedQueries = documents
    .filter(d => d.qc_status === 'Query Raised' && !(queries || []).some(q => q.document_id === d.document_id))
    .map(d => ({
      query_id: `QRY-${d.document_id.replace(/[^0-9]/g, '').slice(-4) || '1001'}`,
      document_id: d.document_id,
      study_id: d.study_id,
      issue_type: d.quality_issue_type || 'Quality / ALCOA+ Query',
      comment: d.qc_comments || 'Document flagged for quality remediation.',
      status: 'Open',
      raised_by_name: d.qc_reviewer_name || 'QC Reviewer',
      raised_date: d.qc_review_date || d.filing_date || new Date().toISOString().split('T')[0]
    }));

  const allQueriesList = [...(queries || []), ...docFlaggedQueries];

  const scopedQueries = allQueriesList.filter(q => {
    if (studyScopeMode === 'ACTIVE_STUDY' && q.study_id !== selectedStudyId) return false;
    return true;
  });

  const filteredQueries = scopedQueries.filter(q => {
    if (filterStatus !== 'ALL' && q.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        (q.query_id || '').toLowerCase().includes(s) ||
        (q.issue_type || '').toLowerCase().includes(s) ||
        (q.comment || '').toLowerCase().includes(s) ||
        (q.document_id || '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  const openCount = scopedQueries.filter(q => q.status === 'Open').length;
  const resolvedCount = scopedQueries.filter(q => q.status === 'Resolved' || q.status === 'Closed').length;

  const handleResolveSubmit = async (queryId, statusToSet = 'Resolved') => {
    const finalResponse = responseText.trim() || 'Query remediated, verified against SOP-TMF-04, and cleared.';
    await resolveQuery(queryId, finalResponse, currentUser, statusToSet);
    setRespondingQueryId(null);
    setResponseText("");
    showToast(`✓ Query ${queryId} marked as ${statusToSet} and target document approved!`);
  };

  const handleCreateQuerySubmit = async (e) => {
    e.preventDefault();
    const targetDoc = documents.find(d => d.document_id === newQueryDocId) || documents[0];
    if (!targetDoc) return;

    const finalComment = newQueryComment.trim() || `Quality query raised (${newQueryCategory}): Please review and remediate.`;
    await raiseQuery({
      document_id: targetDoc.document_id,
      study_id: targetDoc.study_id || selectedStudyId,
      issue_type: newQueryCategory,
      comment: finalComment
    }, currentUser);

    setShowNewQueryModal(false);
    setNewQueryComment("");
    showToast(`⚠️ Formal Query raised on "${targetDoc.document_title}" (${targetDoc.document_id})`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 font-sans text-xs">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            Quality Queries & Resolution Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track, respond to, and resolve quality queries raised during TMF document inspection
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 font-semibold">
            Open Queries: {openCount}
          </span>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-semibold">
            Resolved: {resolvedCount}
          </span>

          {documents.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setNewQueryDocId(documents[0]?.document_id || "");
                setShowNewQueryModal(true);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Raise New Query
            </button>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center justify-between shadow-2xs">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer ml-3">✕</button>
        </div>
      )}

      {/* Filter Toolbar & Queries Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: 'All Queries', count: scopedQueries.length },
              { id: 'Open', label: 'Open Queries', count: openCount },
              { id: 'Resolved', label: 'Resolved', count: resolvedCount }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === tab.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  filterStatus === tab.id ? 'bg-blue-700 text-white' : 'bg-white text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            <button
              type="button"
              onClick={() => setStudyScopeMode(studyScopeMode === 'ALL' ? 'ACTIVE_STUDY' : 'ALL')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer"
            >
              Scope: {studyScopeMode === 'ALL' ? 'All Studies' : activeStudy.id}
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search queries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-3.5">Query ID</th>
                <th className="p-3.5">Target Document</th>
                <th className="p-3.5">Defect Category</th>
                <th className="p-3.5">Findings / Resolution</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Raised By</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredQueries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    No quality queries found in this view.
                  </td>
                </tr>
              ) : (
                filteredQueries.map(q => {
                  const targetDoc = documents.find(d => d.document_id === q.document_id);
                  return (
                    <tr key={q.query_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-blue-600">
                        {q.query_id}
                      </td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => targetDoc && setSelectedDoc(targetDoc)}
                          className="font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-left block"
                        >
                          {targetDoc?.document_title || q.document_id}
                        </button>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {q.document_id} · {q.study_id}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-rose-50 text-rose-700 border border-rose-200">
                          {q.issue_type || 'Quality Query'}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-sm">
                        <p className="text-slate-800">{q.comment}</p>
                        {q.response && (
                          <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800">
                            <strong>Resolution:</strong> {q.response}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] border ${
                          q.status === 'Resolved' || q.status === 'Closed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 text-[11px]">
                        <p className="font-medium text-slate-800">{q.raised_by_name || 'QC Reviewer'}</p>
                        <p className="text-[10px] text-slate-400">{(q.raised_date || '').split('T')[0]}</p>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {q.status === 'Open' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setRespondingQueryId(q.query_id)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-xs shadow-2xs cursor-pointer"
                              >
                                Respond & Resolve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResolveSubmit(q.query_id, 'Resolved')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-2xs cursor-pointer flex items-center gap-1"
                                title="1-Click Mark Resolved & Approve Document"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Quick Resolve
                              </button>
                            </>
                          ) : (
                            <span className="text-emerald-600 font-semibold flex items-center justify-end gap-1 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                            </span>
                          )}

                          {targetDoc && (
                            <button
                              type="button"
                              onClick={() => setSelectedDoc(targetDoc)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 text-xs font-medium cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Respond / Remediate Modal */}
      {respondingQueryId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Remediate & Resolve Query ({respondingQueryId})
              </h3>
              <button onClick={() => setRespondingQueryId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>
            
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Resolution Actions & Verification Details:</label>
              <textarea
                rows={4}
                placeholder="Explain document correction, re-scan verification, or metadata update applied..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-emerald-500 rounded-lg p-2.5 text-xs focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRespondingQueryId(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleResolveSubmit(respondingQueryId, 'Resolved')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Submit Resolution & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raise New Query Modal */}
      {showNewQueryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateQuerySubmit} className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                Raise New Quality Query
              </h3>
              <button type="button" onClick={() => setShowNewQueryModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Select Target Document:</label>
              <select
                value={newQueryDocId}
                onChange={(e) => setNewQueryDocId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
              >
                {documents.map(d => (
                  <option key={d.document_id} value={d.document_id}>
                    {d.document_id} — {d.document_title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Defect / Query Category:</label>
              <select
                value={newQueryCategory}
                onChange={(e) => setNewQueryCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="Missing Required Signature">Missing Required Signature</option>
                <option value="Incorrect Site Number">Incorrect Site Number</option>
                <option value="Illegible Document Scan">Illegible Document Scan</option>
                <option value="Incorrect TMF Artifact Classification">Incorrect TMF Artifact Classification</option>
                <option value="Unredacted Subject Information (PHI)">Unredacted Subject Information (PHI)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Query Details / Remediation Instructions:</label>
              <textarea
                rows={3}
                value={newQueryComment}
                onChange={(e) => setNewQueryComment(e.target.value)}
                placeholder="Describe what needs to be fixed..."
                className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewQueryModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-2xs cursor-pointer"
              >
                Create Query
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedDoc && (
        <DocumentViewerDrawer
          doc={selectedDoc}
          defaultTab="qc"
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}
