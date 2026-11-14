import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck, 
  Send, 
  MessageSquare,
  Clock
} from 'lucide-react';
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
  const { uploadDocument, activeStudy, selectedStudyId, studies = [] } = useTMFData();
  const { currentUser, usersList = [] } = useAuth();

  if (!studies || studies.length === 0 || !activeStudy || !activeStudy.id) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden p-6 text-center space-y-4 font-sans">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">Study Protocol Required</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No active clinical trial protocol is configured in the repository. Please configure or select a study protocol in Study Management before uploading or filing trial records.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            {(currentUser?.roleId === 'system_admin' || currentUser?.roleId === 'tmf_manager' || currentUser?.roleId === 'ctm') && (
              <Link
                to="/studies"
                onClick={onClose}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                Go to Study Management →
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

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
  const [siteId, setSiteId] = useState(defaultSite || (currentUser?.siteScope && currentUser.siteScope !== 'ALL' ? currentUser.siteScope : "Site 001 - AIIMS RPC Eye Centre, New Delhi"));
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCertifiedCopy, setIsCertifiedCopy] = useState(true);
  const [sourceType, setSourceType] = useState("Certified Copy");
  const [isEssentialDoc, setIsEssentialDoc] = useState(true);
  const [regulatoryBinding, setRegulatoryBinding] = useState(true);
  const [confidentiality, setConfidentiality] = useState("Restricted");

  // Reviewer Assignment & Submission Routing
  const rawReviewers = (usersList.length > 0 ? usersList : [
    { id: 'usr_sukriti_mentor', name: 'Sukriti Singh', position: 'TMF Manager / TMF Lead', roleId: 'tmf_manager' },
    { id: 'usr_gourish', name: 'Gourish Chouksey', position: 'QA / QC Specialist', roleId: 'qa' },
    { id: 'usr_shubham', name: 'Shubham Sharnagat', position: 'Clinical Trial Manager (CTM)', roleId: 'ctm' },
    { id: 'usr_shweta', name: 'Shweta Pagare', position: 'Clinical Research Associate (CRA)', roleId: 'cra' },
    { id: 'usr_mary', name: 'Mary Vismaya', position: 'Associate TMF Specialist', roleId: 'tmf_lead_trainee' },
    { id: 'usr_tushar_admin', name: 'Tushar Patil', position: 'System Administrator', roleId: 'system_admin' }
  ]);

  // Segregation of Duties (Maker-Checker / ICH GCP E6.5.1):
  // Filter eligible reviewers who can perform independent review (excluding the current user)
  const isUserSelf = (u) => Boolean(
    (u?.id && currentUser?.id && u.id === currentUser.id) ||
    (u?.email && currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    (u?.name && currentUser?.name && u.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
  );

  const eligibleReviewers = rawReviewers.filter(u => !isUserSelf(u));

  const defaultReviewer = eligibleReviewers.find(u => u.roleId === 'tmf_manager') || 
                          eligibleReviewers.find(u => u.roleId === 'qa') ||
                          eligibleReviewers.find(u => u.roleId === 'ctm') ||
                          eligibleReviewers[0];

  const [assignedReviewerId, setAssignedReviewerId] = useState(defaultReviewer?.id || '');
  const [workflowAction, setWorkflowAction] = useState('Submit for QC Review');
  const [submissionNotes, setSubmissionNotes] = useState('');

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
    const chosenReviewer = eligibleReviewers.find(u => u.id === assignedReviewerId) || defaultReviewer;

    if (!chosenReviewer || isUserSelf(chosenReviewer) || assignedReviewerId === currentUser?.id) {
      alert("Segregation of Duties Violation: You cannot assign yourself as the reviewer for a document you are uploading (ICH GCP E6 / Four-Eyes Principle). Please choose an independent reviewer.");
      return;
    }

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
      file_size: file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "1.5 MB",
      // Reviewer Assignment & Submission Routing
      assigned_reviewer_id: chosenReviewer?.id || 'usr_sukriti_mentor',
      assigned_reviewer_name: chosenReviewer?.position ? `${chosenReviewer.name} (${chosenReviewer.position})` : chosenReviewer?.name || 'TMF Lead',
      assigned_reviewer_role: chosenReviewer?.roleId || 'tmf_manager',
      submission_notes: submissionNotes,
      workflow_action: workflowAction,
      submitted_by_id: currentUser.id,
      submitted_by_name: currentUser.name,
      submitted_by_role: currentUser.roleId,
      submitted_date: new Date().toISOString()
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
                  <label className="block text-slate-700 font-medium mb-1">
                    Site Scope {currentUser?.siteScope && currentUser.siteScope !== 'ALL' ? '(Assigned Site Scope)' : ''}
                  </label>
                  {currentUser?.siteScope && currentUser.siteScope !== 'ALL' ? (
                    <div className="w-full bg-emerald-50 border border-emerald-300 rounded-lg px-2.5 py-1.5 text-emerald-900 font-semibold text-xs flex items-center justify-between">
                      <span className="truncate">{siteId}</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-mono shrink-0 ml-1">Role Locked</span>
                    </div>
                  ) : (
                    <select
                      value={siteId}
                      onChange={(e) => setSiteId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 shadow-xs"
                    >
                      <option value="GLOBAL">Global / Study Level</option>
                      <option value="Site 001 - AIIMS RPC Eye Centre, New Delhi">Site 001 (AIIMS)</option>
                      <option value="Site 002 - Sankara Nethralaya, Chennai">Site 002 (Sankara Nethralaya)</option>
                      <option value="Site 003 - Tata Memorial Hospital, Mumbai">Site 003 (Tata Memorial)</option>
                      <option value="Site 004 - Apollo Hospitals, Hyderabad">Site 004 (Apollo Hospitals)</option>
                      <option value="Site 005 - Fortis Memorial Research Institute, Gurugram">Site 005 (Fortis)</option>
                      <option value="Site 006 - Manipal Hospital, Bengaluru">Site 006 (Manipal)</option>
                    </select>
                  )}
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
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3.5 rounded-xl space-y-1 text-slate-800">
                <div className="flex items-center gap-2 font-bold text-xs text-blue-900">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Reviewer Selection &amp; Transmittal Routing
                </div>
                <p className="text-[11px] text-slate-600">
                  Select the designated person responsible for inspecting and approving this clinical document under SOP-TMF-04.
                </p>
              </div>

              {/* Segregation of Duties Banner */}
              <div className="bg-amber-50/90 border border-amber-200/90 p-2.5 rounded-lg flex items-start gap-2 text-amber-900 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-tight">
                  <span className="font-bold">Segregation of Duties (ICH GCP E6.5.1 / Four-Eyes Principle):</span>
                  <p className="text-amber-800 text-[10.5px] mt-0.5">
                    As the document author/uploader (<strong>{currentUser?.name}</strong>), you are prohibited from assigning yourself as the QC reviewer or approver. An independent peer reviewer or TMF Lead must be selected.
                  </p>
                </div>
              </div>

              {/* 1. Reviewer Selection (Kiske pass jayenga) */}
              <div className="space-y-1.5">
                <label className="block text-slate-800 font-bold flex items-center justify-between">
                  <span>Designated QC Reviewer / Approver *</span>
                  <span className="text-[10px] text-blue-600 font-normal">SOP-TMF-04 Inspection Gate</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {rawReviewers.map(rev => {
                    const isSelf = isUserSelf(rev);
                    const isSelected = assignedReviewerId === rev.id;
                    return (
                      <div
                        key={rev.id}
                        onClick={() => {
                          if (isSelf) return; // Self-assignment prohibited
                          setAssignedReviewerId(rev.id);
                        }}
                        className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                          isSelf
                            ? 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed select-none'
                            : isSelected
                            ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-200 shadow-xs cursor-pointer'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer'
                        }`}
                        title={isSelf ? "Self-assignment prohibited under ICH GCP E6 (Maker-Checker Rule)" : `Assign to ${rev.name}`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate text-xs flex items-center gap-1.5">
                            {rev.name}
                            {isSelf && (
                              <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider">
                                You (Self)
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{rev.position || rev.title || rev.roleId}</p>
                        </div>
                        {isSelf ? (
                          <span className="text-[9.5px] text-rose-600 font-semibold whitespace-nowrap bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                            Prohibited
                          </span>
                        ) : isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0"></span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Workflow Submission Action */}
              <div className="space-y-1.5">
                <label className="block text-slate-800 font-bold">Workflow Action Gate</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    { id: 'Submit for QC Review', label: 'Submit to QC Queue', desc: 'Stage 6: TMF Lead Quality Clearance' },
                    { id: 'Submit for Pre-Review', label: 'Submit for CRA Review', desc: 'Stage 2: Monitoring verification' },
                    { id: 'Save as Draft', label: 'Save Draft Record', desc: 'Stage 5: Pending site completion' }
                  ].map(act => (
                    <label
                      key={act.id}
                      onClick={() => setWorkflowAction(act.id)}
                      className={`p-2 rounded-lg border cursor-pointer transition-all block ${
                        workflowAction === act.id
                          ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-200'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                        <input
                          type="radio"
                          name="workflowAction"
                          checked={workflowAction === act.id}
                          onChange={() => setWorkflowAction(act.id)}
                          className="accent-emerald-600"
                        />
                        <span>{act.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 pl-4">{act.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Transmittal Notes / Instructions for the Reviewer */}
              <div className="space-y-1">
                <label className="block text-slate-800 font-bold flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  Transmittal Note / Message for Reviewer
                </label>
                <textarea
                  rows={2}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="e.g. Completed site delegation log with PI signature. Verified staff CVs and GCP certificates. Please review for site activation."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none shadow-xs text-xs font-sans"
                />
              </div>

              {/* 4. Pre-Submission Verification Card */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 font-mono text-[11px] text-slate-800">
                <div className="flex justify-between items-center text-slate-900 font-bold border-b border-slate-200 pb-1">
                  <span>Document Manifest</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">{workflowAction}</span>
                </div>
                <p><span className="text-slate-500">Document:</span> <span className="font-bold text-slate-900">{docTitle || (file ? file.name : "Document")}</span></p>
                <p><span className="text-slate-500">Address:</span> Zone {selectedZone} → Section {selectedSection} → Artifact {selectedArtifact}</p>
                <p><span className="text-slate-500">Protocol &amp; Site:</span> {selectedStudyId} · {siteId}</p>
                <p><span className="text-slate-500">Submitted By:</span> <strong className="text-blue-700">{currentUser.name}</strong> ({currentUser.roleId})</p>
                <p><span className="text-slate-500">Assigned To:</span> <strong className="text-emerald-700">{eligibleReviewers.find(u => u.id === assignedReviewerId)?.name || 'Assigned Reviewer'}</strong> ({eligibleReviewers.find(u => u.id === assignedReviewerId)?.position || eligibleReviewers.find(u => u.id === assignedReviewerId)?.title || 'Reviewer'})</p>
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
