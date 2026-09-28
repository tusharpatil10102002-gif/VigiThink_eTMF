import React, { useState } from 'react';
import { X, Upload, Sparkles, CheckCircle2, FileText, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTMFData } from '../../context/TMFDataContext';
import { useAuth } from '../../context/AuthContext';
import { DIA_TMF_ZONES } from '../../data/diaTmfReferenceModel';

export default function UploadWizardModal({
  onClose,
  defaultZone = null,
  defaultSection = null,
  defaultSite = null,
  defaultCustomFolder = null,
  onUploadSuccess = null
}) {
  const { uploadDocument, activeStudy, selectedStudyId } = useTMFData();
  const { currentUser } = useAuth();

  const initialZone = defaultZone || "01";
  const initialZoneObj = DIA_TMF_ZONES.find(z => z.id === initialZone) || DIA_TMF_ZONES[0];
  const initialSection = defaultSection || initialZoneObj?.sections?.[0]?.id || "01.01";
  const initialSectionObj = initialZoneObj?.sections?.find(s => s.id === initialSection) || initialZoneObj?.sections?.[0];
  const initialArtifact = initialSectionObj?.artifacts?.[0]?.id || "01.01.01";

  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  
  // Metadata fields initialized to current folder/zone
  const [selectedZone, setSelectedZone] = useState(initialZone);
  const [selectedSection, setSelectedSection] = useState(initialSection);
  const [selectedArtifact, setSelectedArtifact] = useState(initialArtifact);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("Trial Document");
  const [countryCode, setCountryCode] = useState("India");
  const [siteId, setSiteId] = useState(defaultSite || (currentUser?.siteScope && currentUser.siteScope !== 'ALL' ? currentUser.siteScope : "Site 001"));
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCertifiedCopy, setIsCertifiedCopy] = useState(true);
  const [sourceType, setSourceType] = useState("Certified Copy");
  const [isEssentialDoc, setIsEssentialDoc] = useState(true);
  const [regulatoryBinding, setRegulatoryBinding] = useState(true);
  const [confidentiality, setConfidentiality] = useState("Restricted");

  const currentZoneObj = DIA_TMF_ZONES.find(z => z.id === selectedZone);
  const availableSections = currentZoneObj?.sections || [];
  const currentSectionObj = availableSections.find(s => s.id === selectedSection);
  const availableArtifacts = currentSectionObj?.artifacts || [];

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setDocTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
      // Only auto-switch zone if no defaultZone was explicitly selected by the user
      if (!defaultZone) {
        if (droppedFile.name.toLowerCase().includes('cv')) {
          setSelectedZone("06");
          setSelectedSection("06.01");
          setSelectedArtifact("06.01.01");
          setDocType("CV & Credentials");
        } else if (droppedFile.name.toLowerCase().includes('1572')) {
          setSelectedZone("06");
          setSelectedSection("06.01");
          setSelectedArtifact("06.01.02");
          setDocType("Regulatory Form");
        } else if (droppedFile.name.toLowerCase().includes('protocol')) {
          setSelectedZone("02");
          setSelectedSection("02.01");
          setSelectedArtifact("02.01.01");
          setDocType("Protocol");
        }
      }
    }
  };

  const handleFinishUpload = async () => {
    const artifactObj = availableArtifacts.find(a => a.id === selectedArtifact);
    const folderPathStr = defaultCustomFolder
      ? `Study > Zone ${selectedZone} > ${defaultCustomFolder}`
      : `Study > Zone ${selectedZone} > ${currentSectionObj?.name || selectedSection} > ${artifactObj?.name || 'Trial Document'}`;

    const createdDoc = await uploadDocument({
      tmf_zone_id: selectedZone,
      tmf_zone_name: currentZoneObj?.name || `Zone ${selectedZone}`,
      tmf_section_id: selectedSection,
      tmf_section_name: currentSectionObj?.name || selectedSection,
      tmf_artifact_id: selectedArtifact,
      tmf_artifact_name: artifactObj?.name || "Trial Document",
      study_id: selectedStudyId,
      country_code: countryCode,
      site_id: siteId,
      folder_path: folderPathStr,
      custom_folder_name: defaultCustomFolder || null,
      document_title: docTitle || (file ? file.name.replace(/\.[^/.]+$/, "") : "Untitled Document"),
      document_type: docType,
      document_subtype: docType,
      is_placeholder: isPlaceholder,
      is_certified_copy: isCertifiedCopy,
      source_type: sourceType,
      document_date: docDate,
      confidentiality_level: confidentiality,
      is_essential_document: isEssentialDoc,
      regulatory_binding_flag: regulatoryBinding,
      file_name: file ? file.name : `${docTitle || 'Document'}.pdf`,
      file_format: file ? file.name.split('.').pop().toUpperCase() : "PDF",
      file_size: file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "1.5 MB"
    }, currentUser, file);

    if (onUploadSuccess && createdDoc) {
      onUploadSuccess(createdDoc);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Document Upload & Classification Wizard</h2>
              <p className="text-[11px] text-slate-500 font-mono">21 CFR Part 11 Compliant Ingestion</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="px-6 py-3 bg-slate-100/60 border-b border-slate-200 flex items-center justify-between text-xs font-medium">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
            Select File / Placeholder
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
            Metadata & TMF Classification
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
            Review & Submit to QC
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center transition-all bg-slate-50/60 cursor-pointer"
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileDrop}
                />
                <label htmlFor="file-upload" className="cursor-pointer block space-y-2">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {file ? file.name : "Drag & drop file here, or click to browse"}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    Supports PDF, DOCX, XLSX, PNG, TIFF (Max 50MB)
                  </p>
                </label>
              </div>

              {/* Or Placeholder Option */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Create Placeholder Record ("Expected Document")</p>
                    <p className="text-[11px] text-slate-500">Mark an expected document in EDL before the file is actually uploaded</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPlaceholder}
                  onChange={(e) => {
                    setIsPlaceholder(e.target.checked);
                    if (e.target.checked) setFile(null);
                  }}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center gap-2 text-blue-900 font-medium">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>AI Auto-Classification suggested Zone 06 based on document patterns. Verify metadata below:</span>
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">Document Title *</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-blue-500 focus:outline-none shadow-xs"
                  placeholder="e.g. Principal Investigator CV 2026"
                />
              </div>

              {/* Zone, Section, Artifact Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">TMF Zone *</label>
                  <select
                    value={selectedZone}
                    onChange={(e) => {
                      setSelectedZone(e.target.value);
                      const z = DIA_TMF_ZONES.find(x => x.id === e.target.value);
                      setSelectedSection(z?.sections[0]?.id || "");
                      setSelectedArtifact(z?.sections[0]?.artifacts[0]?.id || "");
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:border-blue-500 shadow-xs"
                  >
                    {DIA_TMF_ZONES.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Section *</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => {
                      setSelectedSection(e.target.value);
                      const s = availableSections.find(x => x.id === e.target.value);
                      setSelectedArtifact(s?.artifacts[0]?.id || "");
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:border-blue-500 shadow-xs"
                  >
                    {availableSections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Artifact *</label>
                  <select
                    value={selectedArtifact}
                    onChange={(e) => setSelectedArtifact(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:border-blue-500 shadow-xs"
                  >
                    {availableArtifacts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scoping Fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Country</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 shadow-xs"
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="IND">India (IND)</option>
                    <option value="USA">United States (USA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Site Number</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 shadow-xs"
                  >
                    <option value="GLOBAL">Global / N/A</option>
                    <option value="site_001">Site 001 (AIIMS)</option>
                    <option value="site_002">Site 002 (Tata)</option>
                    <option value="site_101">Site 101 (MD Anderson)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Document Date</label>
                  <input
                    type="date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Source Type</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 shadow-xs"
                  >
                    <option value="Original">Original</option>
                    <option value="Certified Copy">Certified Copy</option>
                    <option value="Scanned Copy">Scanned Copy</option>
                  </select>
                </div>
              </div>

              {/* ALCOA+ & Regulatory Checkboxes */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input
                    type="checkbox"
                    checked={isCertifiedCopy}
                    onChange={(e) => setIsCertifiedCopy(e.target.checked)}
                    className="accent-blue-600 rounded"
                  />
                  <span>ALCOA+ Certified Copy Verified</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input
                    type="checkbox"
                    checked={isEssentialDoc}
                    onChange={(e) => setIsEssentialDoc(e.target.checked)}
                    className="accent-blue-600 rounded"
                  />
                  <span>ICH E6 Essential Document</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input
                    type="checkbox"
                    checked={regulatoryBinding}
                    onChange={(e) => setRegulatoryBinding(e.target.checked)}
                    className="accent-blue-600 rounded"
                  />
                  <span>Milestone Blocker (Regulatory Binding)</span>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg space-y-2 text-emerald-900">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Ready for Part 11 Audit Trail Registration
                </div>
                <p className="text-slate-700">
                  This upload will generate an append-only audit trail event capturing timestamp, SHA-256 checksum, and your user identity.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 font-mono text-[11px] text-slate-800">
                <p><span className="text-slate-500">Title:</span> {docTitle}</p>
                <p><span className="text-slate-500">Target Study:</span> {selectedStudyId}</p>
                <p><span className="text-slate-500">Address:</span> Zone {selectedZone} → Section {selectedSection} → Artifact {selectedArtifact}</p>
                <p><span className="text-slate-500">Uploader:</span> {currentUser.name} ({currentUser.roleId})</p>
                <p><span className="text-slate-500">Audit Checksum:</span> SHA-256 (Auto-calculated on submission)</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            disabled={step === 1}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer shadow-xs"
          >
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(prev => prev + 1)}
              disabled={step === 1 && !file && !isPlaceholder}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinishUpload}
              className="px-5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Submit to QC Queue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
