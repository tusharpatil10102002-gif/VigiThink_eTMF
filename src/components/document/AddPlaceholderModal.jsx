import React, { useState } from 'react';
import { X, FileSpreadsheet, Plus, AlertCircle } from 'lucide-react';
import { useTMFData } from '../../context/TMFDataContext';
import { useAuth } from '../../context/AuthContext';

export default function AddPlaceholderModal({ onClose, defaultZone = "01", defaultSection = "01.01", defaultArtifact = "01.01.01" }) {
  const { zonesTaxonomy, uploadDocument, selectedStudyId, activeStudy } = useTMFData();
  const { currentUser } = useAuth();

  const [selectedZone, setSelectedZone] = useState(defaultZone);
  const [selectedSection, setSelectedSection] = useState(defaultSection);
  const [selectedArtifact, setSelectedArtifact] = useState(defaultArtifact);
  const [artifactName, setArtifactName] = useState("Trial Master Oversight Plan");
  const [targetDueDate, setTargetDueDate] = useState("2026-10-15");
  const [countryCode, setCountryCode] = useState("US");
  const [siteId, setSiteId] = useState("SITE-01");
  const [submitting, setSubmitting] = useState(false);

  const activeZoneObj = zonesTaxonomy.find(z => z.id === selectedZone);
  const activeSectionObj = activeZoneObj?.sections.find(s => s.id === selectedSection);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const placeholderDoc = {
      document_title: `[EXPECTED] ${artifactName}`,
      study_id: selectedStudyId,
      tmf_zone_id: selectedZone,
      tmf_zone_name: activeZoneObj?.name || 'Trial Management',
      tmf_section_id: selectedSection,
      tmf_section_name: activeSectionObj?.name || 'Section',
      tmf_artifact_id: selectedArtifact,
      tmf_artifact_name: artifactName,
      country_code: countryCode,
      site_id: siteId,
      is_placeholder: true,
      doc_due_status: `Due on ${targetDueDate}`,
      folder_path: `CM Folder > ${activeStudy.shortName || selectedStudyId} > Zone ${selectedZone} ${activeZoneObj?.name} > ${artifactName}`
    };

    await uploadDocument(placeholderDoc, currentUser, null);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-xs font-sans">
        
        {/* Header */}
        <div className="bg-clinevo-header text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm">Add Expected Document Placeholder</h3>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-900 text-[11px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Placeholders flag required essential records in the Expected Document List (EDL). Once the physical document is received, uploading into this placeholder will fulfill the gap.
            </span>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">TMF Zone (DIA Model v3.1):</label>
            <select
              value={selectedZone}
              onChange={(e) => {
                setSelectedZone(e.target.value);
                const zone = zonesTaxonomy.find(z => z.id === e.target.value);
                if (zone?.sections[0]) {
                  setSelectedSection(zone.sections[0].id);
                  if (zone.sections[0].artifacts[0]) {
                    setSelectedArtifact(zone.sections[0].artifacts[0].id);
                    setArtifactName(zone.sections[0].artifacts[0].name);
                  }
                }
              }}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 font-sans"
            >
              {zonesTaxonomy.map(z => (
                <option key={z.id} value={z.id}>Zone {z.id}: {z.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Section:</label>
              <select
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  const sec = activeZoneObj?.sections.find(s => s.id === e.target.value);
                  if (sec?.artifacts[0]) {
                    setSelectedArtifact(sec.artifacts[0].id);
                    setArtifactName(sec.artifacts[0].name);
                  }
                }}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500"
              >
                {(activeZoneObj?.sections || []).map(s => (
                  <option key={s.id} value={s.id}>{s.id} {s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Artifact:</label>
              <select
                value={selectedArtifact}
                onChange={(e) => {
                  setSelectedArtifact(e.target.value);
                  const art = activeSectionObj?.artifacts.find(a => a.id === e.target.value);
                  if (art) setArtifactName(art.name);
                }}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500"
              >
                {(activeSectionObj?.artifacts || []).map(a => (
                  <option key={a.id} value={a.id}>{a.id} {a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Target Due Date:</label>
              <input
                type="date"
                value={targetDueDate}
                onChange={(e) => setTargetDueDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Country:</label>
              <input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Site ID:</label>
              <input
                type="text"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
              />
            </div>
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
              {submitting ? 'Creating...' : 'Create Placeholder'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
