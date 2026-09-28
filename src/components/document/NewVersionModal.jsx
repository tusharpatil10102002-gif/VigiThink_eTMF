import React, { useState } from 'react';
import { X, GitCompare, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { useTMFData } from '../../context/TMFDataContext';
import { useAuth } from '../../context/AuthContext';

export default function NewVersionModal({ doc, onClose, onVersionCreated }) {
  const { createNewDocumentVersion } = useTMFData();
  const { currentUser } = useAuth();

  const currentVer = parseFloat(doc?.version_number || '1.0');
  const [versionType, setVersionType] = useState("major");
  const [changeDescription, setChangeDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const nextVer = versionType === "major" 
    ? `${Math.floor(currentVer) + 1}.0`
    : `${(currentVer + 0.1).toFixed(1)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!changeDescription.trim()) return;
    setSubmitting(true);

    await createNewDocumentVersion(
      doc.document_id,
      {
        newVersion: nextVer,
        changeDescription
      },
      currentUser
    );

    setSubmitting(false);
    if (onVersionCreated) onVersionCreated(nextVer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-xs font-sans">
        
        {/* Header */}
        <div className="bg-clinevo-header text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm">Author New Document Version</h3>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-1">
            <p className="font-bold text-slate-800">{doc.document_title}</p>
            <p className="text-[10px] text-slate-500 font-mono">Document ID: {doc.document_id} | Current Version: v{doc.version_number}</p>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">Increment Type:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVersionType('major')}
                className={`py-1.5 px-3 rounded border text-center font-semibold cursor-pointer ${versionType === 'major' ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold' : 'bg-white border-slate-300 text-slate-700'}`}
              >
                Major Release (v{Math.floor(currentVer) + 1}.0)
              </button>
              <button
                type="button"
                onClick={() => setVersionType('minor')}
                className={`py-1.5 px-3 rounded border text-center font-semibold cursor-pointer ${versionType === 'minor' ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold' : 'bg-white border-slate-300 text-slate-700'}`}
              >
                Minor Draft (v{(currentVer + 0.1).toFixed(1)})
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">Revision Summary / Redline Notes:</label>
            <textarea
              rows={3}
              required
              placeholder="Describe amendments, corrections, or rationale for this new version..."
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-2 focus:border-blue-500 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">Attach Revised File (Optional):</label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
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
              {submitting ? 'Submitting...' : `Publish v${nextVer}`}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
