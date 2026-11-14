import React, { useState } from 'react';
import { X, Building2, Plus, CheckCircle2, Calendar, UserCheck, Globe, Shield } from 'lucide-react';
import { useTMFData } from '../../context/TMFDataContext';
import { useAuth } from '../../context/AuthContext';

export default function CreateStudyModal({ onClose }) {
  const { createStudy } = useTMFData();
  const { currentUser, usersList = [] } = useAuth();

  // Exact 15 fields requested by VigiThink eTMF Functional Plan
  const [studyId, setStudyId] = useState("");
  const [protocolNumber, setProtocolNumber] = useState("");
  const [studyTitle, setStudyTitle] = useState("");
  const [studyDescription, setStudyDescription] = useState("");
  const [studyPhase, setStudyPhase] = useState("Phase III");
  const [studyType, setStudyType] = useState("Interventional");
  const [sponsorName, setSponsorName] = useState("VigiThink BioPharma Ltd.");
  const [croName, setCroName] = useState("VigiThink Clinical Research Operations");
  const [therapeuticArea, setTherapeuticArea] = useState("Oncology");
  const [selectedCountries, setSelectedCountries] = useState(["India", "USA"]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedEndDate, setPlannedEndDate] = useState("2028-12-31");
  const [studyStatus, setStudyStatus] = useState("Active");
  const [tmfReferenceModel, setTmfReferenceModel] = useState("DIA TMF Reference Model v3.1");

  const dynamicTmfLeads = (usersList || [])
    .filter(u => u.roleId === 'tmf_manager' || u.roleId === 'tmf_lead_trainee' || u.roleId === 'system_admin' || u.roleId === 'ctm')
    .map(u => ({ id: u.id || u.loginId, name: u.name, role: u.title || u.roleId }));

  const tmfLeadsList = dynamicTmfLeads.length > 0 ? dynamicTmfLeads : [
    { id: "usr_sukriti_mentor", name: "Sukriti Singh", role: "TMF Lead / Manager" },
    { id: "usr_gourish", name: "Gourish Chouksey", role: "QA / Compliance Specialist" },
    { id: "usr_shubham", name: "Shubham Sharnagat", role: "Clinical Trial Manager (CTM)" },
    { id: "usr_tushar_admin", name: "Tushar Patil", role: "System Administrator" }
  ];

  const [assignedTmfLead, setAssignedTmfLead] = useState(tmfLeadsList[0]?.id || "usr_sukriti_mentor");
  const [submitting, setSubmitting] = useState(false);

  const availableCountries = [
    { code: "IN", name: "India", authority: "CDSCO", retention: 25 },
    { code: "US", name: "USA", authority: "FDA", retention: 25 },
    { code: "GB", name: "United Kingdom", authority: "MHRA", retention: 25 },
    { code: "EU", name: "European Union", authority: "EMA", retention: 25 },
    { code: "GL", name: "Global", authority: "ICH GCP", retention: 25 }
  ];

  const handleCountryToggle = (cName) => {
    setSelectedCountries(prev => 
      prev.includes(cName) ? prev.filter(c => c !== cName) : [...prev, cName]
    );
  };

  const handleGenerateId = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setStudyId(`VTK-${randomNum}`);
    if (!protocolNumber) setProtocolNumber(`PROT-VTK-${randomNum}`);
  };

  const handleSubmit = async (e, isDraft = false) => {
    if (e) e.preventDefault();
    if (!studyId || !protocolNumber || !studyTitle) return;
    setSubmitting(true);

    const leadObj = tmfLeadsList.find(l => l.id === assignedTmfLead);

    const newStudyObj = {
      id: studyId.toUpperCase().replace(/\s+/g, '-'),
      protocolNumber,
      title: studyTitle,
      shortName: studyId,
      description: studyDescription,
      phase: studyPhase,
      studyType,
      sponsor: sponsorName,
      cro: croName,
      therapeuticArea,
      status: isDraft ? 'Draft' : studyStatus,
      tmfReferenceModel,
      startDate,
      plannedEndDate,
      tmfLeadId: assignedTmfLead,
      tmfLeadName: leadObj?.name || 'Sukriti Singh',
      countries: selectedCountries.map(cName => {
        const found = availableCountries.find(x => x.name === cName) || { code: cName.substring(0, 2).toUpperCase(), authority: 'MoH', retention: 25 };
        return {
          id: found.code,
          name: cName,
          code: found.code,
          regulatoryAuthority: found.authority,
          retentionPeriodYears: found.retention,
          sites: []
        };
      })
    };

    await createStudy(newStudyObj, currentUser);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden text-xs font-sans max-h-[92vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-sky-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Study Management: Add New Clinical Trial</h3>
              <p className="text-[10px] text-blue-200 font-mono">Study Setup &amp; DIA TMF Reference Model Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Row 1: Study ID & Protocol Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">Study ID *</label>
                <button
                  type="button"
                  onClick={handleGenerateId}
                  className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  Auto-generate
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. CLI-001, ONCO-2026"
                value={studyId}
                onChange={(e) => setStudyId(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 font-mono text-xs uppercase"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Protocol Number *</label>
              <input
                type="text"
                placeholder="e.g. PROT-CLI-001-A"
                value={protocolNumber}
                onChange={(e) => setProtocolNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 font-mono text-xs"
                required
              />
            </div>
          </div>

          {/* Row 2: Study Title */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800">Study Title *</label>
            <input
              type="text"
              placeholder="e.g. A Phase III, Randomized, Double-Blind Study of Investigational Therapy"
              value={studyTitle}
              onChange={(e) => setStudyTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 text-xs"
              required
            />
          </div>

          {/* Row 3: Study Description */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800">Study Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Primary clinical objective, trial endpoints, patient cohorts..."
              value={studyDescription}
              onChange={(e) => setStudyDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 text-xs"
            />
          </div>

          {/* Row 4: Study Phase, Study Type & Therapeutic Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-800">Study Phase *</label>
              <select
                value={studyPhase}
                onChange={(e) => setStudyPhase(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
              >
                <option value="Phase I">Phase I (Safety / First-in-Human)</option>
                <option value="Phase II">Phase II (Proof of Concept)</option>
                <option value="Phase III">Phase III (Confirmatory Multi-Center)</option>
                <option value="Phase IV">Phase IV (Post-Marketing Surveillance)</option>
                <option value="Bioequivalence">Bioequivalence / BA-BE</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Study Type *</label>
              <select
                value={studyType}
                onChange={(e) => setStudyType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
              >
                <option value="Interventional">Interventional</option>
                <option value="Observational">Observational / Registry</option>
                <option value="Expanded Access">Expanded Access / Compassionate</option>
                <option value="Medical Device">Medical Device Investigation</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Therapeutic Area</label>
              <select
                value={therapeuticArea}
                onChange={(e) => setTherapeuticArea(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
              >
                <option value="Oncology">Oncology</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="Immunology">Immunology</option>
                <option value="Infectious Diseases">Infectious Diseases</option>
                <option value="Metabolic Disorders">Metabolic Disorders</option>
              </select>
            </div>
          </div>

          {/* Row 5: Sponsor Name & CRO Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-800">Sponsor Name *</label>
              <input
                type="text"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">CRO Name (Optional)</label>
              <input
                type="text"
                value={croName}
                onChange={(e) => setCroName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 text-xs"
              />
            </div>
          </div>

          {/* Row 6: Multi-Select Countries */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 flex items-center justify-between">
              <span>Participating Countries *</span>
              <span className="text-[10px] text-slate-500 font-normal">Select applicable regulatory jurisdictions</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {availableCountries.map(c => {
                const isSelected = selectedCountries.includes(c.name);
                return (
                  <label
                    key={c.code}
                    className={`p-2 rounded border cursor-pointer transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCountryToggle(c.name)}
                      className="accent-blue-600"
                    />
                    <span className="text-xs">{c.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Row 7: Start Date & Planned End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-800">Study Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 font-mono text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Planned End Date (Optional)</label>
              <input
                type="date"
                value={plannedEndDate}
                onChange={(e) => setPlannedEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Row 8: Study Status, TMF Reference Model & Assigned TMF Lead */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-800">Study Status *</label>
              <select
                value={studyStatus}
                onChange={(e) => setStudyStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Suspended">Suspended</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">TMF Reference Model *</label>
              <select
                value={tmfReferenceModel}
                onChange={(e) => setTmfReferenceModel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
              >
                <option value="DIA TMF Reference Model v3.1">DIA TMF Reference Model v3.1 (11 Zones)</option>
                <option value="DIA TMF Reference Model v3.2">DIA TMF Reference Model v3.2</option>
                <option value="Custom Sponsor SOP Matrix">Custom Sponsor SOP Matrix</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Assigned TMF Lead *</label>
              <select
                value={assignedTmfLead}
                onChange={(e) => setAssignedTmfLead(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs font-semibold text-blue-900"
              >
                {tmfLeadsList.map(lead => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} ({lead.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3 text-blue-900 text-[11px] space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-700" />
              Automatic 11-Zone DIA Taxonomy &amp; Expected Document List (EDL) Generation
            </p>
            <p className="text-slate-600">
              Upon creation, the study will automatically initialize all 11 TMF Zones, milestone blockers, and create the baseline Expected Document List (EDL) for CRAs and Site Users.
            </p>
          </div>

          {/* Action Buttons as specified in section 1.B */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={submitting}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-semibold shadow-2xs cursor-pointer"
              >
                Save Draft
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {submitting ? 'Creating...' : 'Create Study'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}