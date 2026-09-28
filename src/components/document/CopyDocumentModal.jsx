import React, { useState } from 'react';
import { X, Copy, CheckCircle2, Folder } from 'lucide-react';
import { useTMFData } from '../../context/TMFDataContext';
import { useAuth } from '../../context/AuthContext';

export default function CopyDocumentModal({ onClose, sourceDoc }) {
  const { documents, studies, selectedStudyId, copyDocument } = useTMFData();
  const { currentUser } = useAuth();

  const [selectedDocId, setSelectedDocId] = useState(sourceDoc?.document_id || documents[0]?.document_id);
  const [targetStudyId, setTargetStudyId] = useState(selectedStudyId);
  const [targetCountry, setTargetCountry] = useState("INDIA");
  const [targetSite, setTargetSite] = useState("SITE-101");
  const [targetSubfolder, setTargetSubfolder] = useState("02 Central Trial Documents");
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeSource = documents.find(d => d.document_id === selectedDocId) || documents[0];

  const handleCopy = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const targetFolderPath = `CM Folder > ${targetStudyId} > ${targetCountry} > ${targetSite} > ${targetSubfolder}`;
    await copyDocument(
      selectedDocId,
      {
        targetStudyId,
        targetCountry,
        targetSite,
        targetFolder: targetFolderPath
      },
      currentUser
    );

    setSubmitting(false);
    setCopiedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-xs font-sans">
        
        {/* Header */}
        <div className="bg-clinevo-header text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm">Copy Document to Target Repository Folder</h3>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {copiedSuccess ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="font-bold text-slate-800 text-sm">Document Copied Successfully!</h4>
            <p className="text-slate-500 font-mono text-[11px]">Audit Trail logged under 21 CFR Part 11 & Document Copy Log updated.</p>
          </div>
        ) : (
          <form onSubmit={handleCopy} className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Source Document:</label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
              >
                {documents.map(d => (
                  <option key={d.document_id} value={d.document_id}>
                    {d.document_id} - {d.document_title} (v{d.version_number})
                  </option>
                ))}
              </select>
            </div>

            {activeSource && (
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-[11px] text-slate-600 space-y-0.5 font-mono">
                <p><strong className="text-slate-800">Current Path:</strong> {activeSource.folder_path}</p>
                <p><strong className="text-slate-800">Status:</strong> {activeSource.status} | <strong className="text-slate-800">Artifact:</strong> {activeSource.tmf_artifact_id}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Target Study:</label>
                <select
                  value={targetStudyId}
                  onChange={(e) => setTargetStudyId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
                >
                  {studies.map(s => (
                    <option key={s.id} value={s.id}>{s.id} ({s.shortName})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Target Country:</label>
                <input
                  type="text"
                  value={targetCountry}
                  onChange={(e) => setTargetCountry(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs uppercase"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Target Site:</label>
                <input
                  type="text"
                  value={targetSite}
                  onChange={(e) => setTargetSite(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Target Subfolder:</label>
                <select
                  value={targetSubfolder}
                  onChange={(e) => setTargetSubfolder(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
                >
                  <option value="01 Trial Management">01 Trial Management</option>
                  <option value="02 Central Trial Documents">02 Central Trial Documents</option>
                  <option value="03 Regulatory">03 Regulatory</option>
                  <option value="04 IRB or IEC and other Approvals">04 IRB or IEC and other Approvals</option>
                  <option value="05 Site Management">05 Site Management</option>
                  <option value="06 IP and Trial Supplies">06 IP and Trial Supplies</option>
                  <option value="07 Safety Reporting">07 Safety Reporting</option>
                  <option value="08 Central and Local Testing">08 Central and Local Testing</option>
                </select>
              </div>
            </div>

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
                {submitting ? 'Copying...' : 'Copy Document'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
