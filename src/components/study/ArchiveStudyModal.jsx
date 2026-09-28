import React, { useState } from 'react';
import { X, ShieldAlert, Archive, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTMFData } from '../../context/TMFDataContext';
import { useAuth } from '../../context/AuthContext';

export default function ArchiveStudyModal({ study, onClose }) {
  const { archiveStudy, documents } = useTMFData();
  const { currentUser } = useAuth();

  const [archiveReason, setArchiveReason] = useState("Final Trial Master File reconciliation complete; study closed out per GCP protocol with 25-year digital retention lock.");
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const studyDocs = documents.filter(d => d.study_id === study.id);
  const missingDocs = studyDocs.filter(d => d.status === 'Placeholder').length;
  const pendingQc = studyDocs.filter(d => d.qc_status === 'In Progress' || d.qc_status === 'Query Raised').length;
  const effectiveDocs = studyDocs.filter(d => d.status === 'Effective' || d.status === 'Approved').length;

  const handleArchive = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    await archiveStudy(study.id, archiveReason, currentUser);
    setSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-xs font-sans">
        
        {/* Header */}
        <div className="bg-rose-900 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-rose-300" />
            <div>
              <h3 className="font-bold text-sm">Study Close-Out & Digital Archiving</h3>
              <p className="text-[10px] text-rose-200 font-mono">21 CFR Part 11 Finalization & Immutable Retention Lock</p>
            </div>
          </div>
          <button onClick={onClose} className="text-rose-200 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="font-bold text-slate-800 text-sm">Study Successfully Archived!</h4>
            <p className="text-slate-500 font-mono text-[11px]">All records locked as read-only. 25-year compliance retention period started.</p>
          </div>
        ) : (
          <form onSubmit={handleArchive} className="p-5 space-y-4">
            {/* Closeout Readiness Checklist */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
              <h4 className="font-bold text-slate-800 text-xs">Pre-Archival Quality Gate Checklist:</h4>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between items-center">
                  <span>Total Essential Records:</span>
                  <span className="font-bold text-slate-900">{studyDocs.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Missing Document Placeholders:</span>
                  <span className={`font-bold ${missingDocs === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {missingDocs} {missingDocs === 0 ? '✓ Ready' : '⚠ Gaps Pending'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pending QC Reviews / Queries:</span>
                  <span className={`font-bold ${pendingQc === 0 ? 'text-emerald-700' : 'text-amber-600'}`}>
                    {pendingQc} {pendingQc === 0 ? '✓ Clear' : '⚠ Action Required'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Effective / Approved Documents:</span>
                  <span className="font-bold text-emerald-700">{effectiveDocs}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Archival Regulatory Rationale:</label>
              <textarea
                rows={3}
                required
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-2 focus:border-rose-500 text-xs"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-900 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Archiving will place all study records into a permanent Read-Only state. Further document creation, uploads, and deletions will be locked under 21 CFR Part 11 compliance.
              </span>
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
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded font-bold shadow-xs cursor-pointer flex items-center gap-1"
              >
                {submitting ? 'Locking...' : 'Confirm Study Archiving'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
