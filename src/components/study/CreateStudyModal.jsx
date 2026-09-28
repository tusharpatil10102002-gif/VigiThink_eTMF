import React, { useState } from 'react';
import { X, Building2, Plus, CheckCircle2 } from 'lucide-react';
import { useTMFData } from '../../context/TMFDataContext';
import { useAuth } from '../../context/AuthContext';

export default function CreateStudyModal({ onClose }) {
  const { createStudy } = useTMFData();
  const { currentUser } = useAuth();

  const [studyId, setStudyId] = useState("");
  const [protocolNumber, setProtocolNumber] = useState("");
  const [title, setTitle] = useState("");
  const [shortName, setShortName] = useState("");
  const [therapeuticArea, setTherapeuticArea] = useState("Oncology");
  const [indication, setIndication] = useState("");
  const [sponsor, setSponsor] = useState("Clinidea BioPharma");
  const [cro, setCro] = useState("Clinidea Global CRO");
  const [phase, setPhase] = useState("Phase III");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studyId || !title) return;
    setSubmitting(true);

    const newStudyObj = {
      id: studyId.toUpperCase().replace(/\s+/g, '-'),
      protocolNumber: protocolNumber || `PROT-${studyId}`,
      title,
      shortName: shortName || studyId,
      therapeuticArea,
      indication: indication || 'Standard Clinical Indication',
      sponsor,
      cro,
      phase,
      status: 'Active',
      countries: [
        {
          id: "US",
          name: "United States",
          code: "US",
          regulatoryAuthority: "FDA",
          retentionPeriodYears: 25,
          sites: [
            {
              id: "SITE-01",
              number: "001",
              name: "Central Trial Research Center",
              piName: "Dr. Sarah Jenkins, MD",
              piLicense: "MD-US-92841",
              activationDate: "2026-09-15",
              targetEnrollment: 50,
              enrolledCount: 0,
              completenessPct: 0
            }
          ]
        }
      ],
      milestones: [
        {
          id: "M01",
          name: "Study Protocol Finalization",
          date: "2026-10-01",
          status: "Completed",
          bindingArtifactIds: ["02.01.01"]
        },
        {
          id: "M02",
          name: "First Site Activated",
          date: "2026-11-15",
          status: "In Progress",
          bindingArtifactIds: ["05.01.01", "05.02.01"]
        }
      ]
    };

    await createStudy(newStudyObj, currentUser);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden text-xs font-sans">
        
        {/* Header */}
        <div className="bg-clinevo-header text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-bold text-sm">Create New Clinical Study Protocol</h3>
              <p className="text-[10px] text-blue-200 font-mono">Module 3: Trial Architecture Setup & DIA Structure Initialization</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Study Identifier (ID):</label>
              <input
                type="text"
                placeholder="e.g. CLIN-002, ONCO-301"
                value={studyId}
                onChange={(e) => setStudyId(e.target.value.toUpperCase())}
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 font-mono text-xs uppercase"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Protocol Number:</label>
              <input
                type="text"
                placeholder="e.g. PROTOCOL-ONCO-2026"
                value={protocolNumber}
                onChange={(e) => setProtocolNumber(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 font-mono text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">Official Protocol Title:</label>
            <input
              type="text"
              placeholder="Full scientific title of the clinical investigation..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Short Name / Acronym:</label>
              <input
                type="text"
                placeholder="e.g. OMEGA-3"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Trial Phase:</label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 focus:border-blue-500 text-xs"
              >
                <option value="Phase I">Phase I (Safety / First-in-Human)</option>
                <option value="Phase II">Phase II (Proof of Concept / Efficacy)</option>
                <option value="Phase III">Phase III (Confirmatory Multi-center)</option>
                <option value="Phase IV">Phase IV (Post-Marketing Surveillance)</option>
                <option value="Observational">Observational / Registry</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Therapeutic Area:</label>
              <input
                type="text"
                placeholder="e.g. Oncology, Cardiology"
                value={therapeuticArea}
                onChange={(e) => setTherapeuticArea(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 focus:border-blue-500 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">Clinical Indication:</label>
            <input
              type="text"
              placeholder="e.g. Advanced Non-Small Cell Lung Cancer"
              value={indication}
              onChange={(e) => setIndication(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Sponsor Organization:</label>
              <input
                type="text"
                value={sponsor}
                onChange={(e) => setSponsor(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Contract Research Organization (CRO):</label>
              <input
                type="text"
                value={cro}
                onChange={(e) => setCro(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 text-xs"
              />
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded p-3 text-blue-900 text-[11px]">
            <p className="font-semibold">Automatic DIA TMF Structure Initialization:</p>
            <p className="text-slate-600">Upon creation, this study will automatically be configured with the 11-Zone DIA TMF Reference Model v3.1 structure and ready for File Planning, Milestones, and CRA uploads.</p>
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
              {submitting ? 'Creating...' : 'Initialize Study'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
