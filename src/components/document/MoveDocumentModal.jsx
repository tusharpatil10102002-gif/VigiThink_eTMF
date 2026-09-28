import React, { useState } from 'react';
import { X, MoveRight, CheckCircle2, Folder } from 'lucide-react';
import { useTMFData } from '../../context/TMFDataContext';
import { useAuth } from '../../context/AuthContext';

export default function MoveDocumentModal({ onClose, sourceDoc }) {
  const { documents, zonesTaxonomy, moveDocument, selectedStudyId, activeStudy } = useTMFData();
  const { currentUser } = useAuth();

  const [selectedDocId, setSelectedDocId] = useState(sourceDoc?.document_id || documents[0]?.document_id);
  const [targetZone, setTargetZone] = useState("02");
  const [targetSection, setTargetSection] = useState("02.01");
  const [targetArtifact, setTargetArtifact] = useState("02.01.01");
  const [artifactName, setArtifactName] = useState("Protocol and Amendments");
  const [movedSuccess, setMovedSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeZoneObj = zonesTaxonomy.find(z => z.id === targetZone);
  const activeSectionObj = activeZoneObj?.sections.find(s => s.id === targetSection);
  const activeSource = documents.find(d => d.document_id === selectedDocId) || documents[0];

  const handleMove = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const targetFolderPath = `CM Folder > ${activeStudy.shortName || selectedStudyId} > Zone ${targetZone} ${activeZoneObj?.name} > ${artifactName}`;
    await moveDocument(
      selectedDocId,
      {
        targetFolder: targetFolderPath,
        tmfZoneId: targetZone,
        tmfZoneName: activeZoneObj?.name,
        tmfSectionId: targetSection,
        tmfArtifactId: targetArtifact
      },
      currentUser
    );

    setSubmitting(false);
    setMovedSuccess(true);
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
            <MoveRight className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm">Move Document (Reclassify TMF Artifact)</h3>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {movedSuccess ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="font-bold text-slate-800 text-sm">Document Moved & Reclassified!</h4>
            <p className="text-slate-500 font-mono text-[11px]">Audit trail updated with old and new DIA folder coordinates.</p>
          </div>
        ) : (
          <form onSubmit={handleMove} className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Document to Relocate:</label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
              >
                {documents.map(d => (
                  <option key={d.document_id} value={d.document_id}>
                    {d.document_id} - {d.document_title}
                  </option>
                ))}
              </select>
            </div>

            {activeSource && (
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-[11px] text-slate-600 space-y-0.5 font-mono">
                <p><strong className="text-slate-800">Current Zone/Artifact:</strong> Zone {activeSource.tmf_zone_id} → {activeSource.tmf_artifact_id}</p>
                <p><strong className="text-slate-800">Current Folder:</strong> {activeSource.folder_path}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Destination TMF Zone:</label>
              <select
                value={targetZone}
                onChange={(e) => {
                  setTargetZone(e.target.value);
                  const z = zonesTaxonomy.find(zone => zone.id === e.target.value);
                  if (z?.sections[0]) {
                    setTargetSection(z.sections[0].id);
                    if (z.sections[0].artifacts[0]) {
                      setTargetArtifact(z.sections[0].artifacts[0].id);
                      setArtifactName(z.sections[0].artifacts[0].name);
                    }
                  }
                }}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
              >
                {zonesTaxonomy.map(z => (
                  <option key={z.id} value={z.id}>Zone {z.id}: {z.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Destination Section:</label>
                <select
                  value={targetSection}
                  onChange={(e) => {
                    setTargetSection(e.target.value);
                    const sec = activeZoneObj?.sections.find(s => s.id === e.target.value);
                    if (sec?.artifacts[0]) {
                      setTargetArtifact(sec.artifacts[0].id);
                      setArtifactName(sec.artifacts[0].name);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
                >
                  {(activeZoneObj?.sections || []).map(s => (
                    <option key={s.id} value={s.id}>{s.id} {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Destination Artifact:</label>
                <select
                  value={targetArtifact}
                  onChange={(e) => {
                    setTargetArtifact(e.target.value);
                    const art = activeSectionObj?.artifacts.find(a => a.id === e.target.value);
                    if (art) setArtifactName(art.name);
                  }}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
                >
                  {(activeSectionObj?.artifacts || []).map(a => (
                    <option key={a.id} value={a.id}>{a.id} {a.name}</option>
                  ))}
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
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded font-bold shadow-xs cursor-pointer flex items-center gap-1"
              >
                {submitting ? 'Moving...' : 'Move Document'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
