import React, { useState } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  Building, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Upload, 
  Eye, 
  Download,
  X,
  History
} from 'lucide-react';
import { useTMFData } from '../context/TMFDataContext';
import { useAuth } from '../context/AuthContext';

export default function MonitoringVisitsView() {
  const { studies, selectedStudyId } = useTMFData();
  const { currentUser, currentRole, hasPermission } = useAuth();

  const [visits, setVisits] = useState([
    {
      id: "VISIT-001",
      studyId: "CLI-001",
      siteId: "SITE-001",
      siteName: "AIIMS RPC Eye Centre, New Delhi",
      visitType: "Site Initiation Visit (SIV)",
      visitDate: "2026-10-15",
      craName: "Shweta Pagare",
      status: "Submitted & Approved",
      reportFileName: "SIV_Report_Site001_Final.pdf",
      followUpRequired: false,
      followUpRemarks: "All staff trained. Delegation log signed. Ready for first patient.",
      nextVisitDate: "2026-11-20"
    },
    {
      id: "VISIT-002",
      studyId: "CLI-001",
      siteId: "SITE-002",
      siteName: "Sankara Nethralaya, Chennai",
      visitType: "Periodic Interim Monitoring (IMV)",
      visitDate: "2026-11-01",
      craName: "Shweta Pagare",
      status: "Pending Action",
      reportFileName: "IMV_Visit_Report_Site002_Draft.pdf",
      followUpRequired: true,
      followUpRemarks: "Pending PI counter-signature on Delegation Log and calibration certificate of drug storage fridge.",
      nextVisitDate: "2026-12-05"
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Form State
  const [formStudyId, setFormStudyId] = useState(selectedStudyId || "CLI-001");
  const [formSiteId, setFormSiteId] = useState("SITE-001");
  const [formVisitType, setFormVisitType] = useState("Periodic Interim Monitoring (IMV)");
  const [formVisitDate, setFormVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [formReportFile, setFormReportFile] = useState(null);
  const [formFollowUp, setFormFollowUp] = useState(true);
  const [formRemarks, setFormRemarks] = useState("");
  const [formNextDate, setFormNextDate] = useState("2026-12-15");

  const activeStudyObj = studies.find(s => s.id === formStudyId) || studies[0];
  const activeSites = activeStudyObj?.sites || [
    { id: "SITE-001", name: "AIIMS RPC Eye Centre, New Delhi" },
    { id: "SITE-002", name: "Sankara Nethralaya, Chennai" }
  ];

  const handleAddVisit = (e, isDraft = false) => {
    e.preventDefault();
    const newVisitObj = {
      id: `VISIT-${Math.floor(100 + Math.random() * 900)}`,
      studyId: formStudyId,
      siteId: formSiteId,
      siteName: activeSites.find(s => s.id === formSiteId)?.name || formSiteId,
      visitType: formVisitType,
      visitDate: formVisitDate,
      craName: currentUser.name || "Shweta Pagare",
      status: isDraft ? "Draft" : "Submitted for QC",
      reportFileName: formReportFile ? formReportFile.name : `Monitoring_Visit_Report_${formSiteId}.pdf`,
      followUpRequired: formFollowUp,
      followUpRemarks: formRemarks || "Routine monitoring verification completed.",
      nextVisitDate: formNextDate
    };

    setVisits(prev => [newVisitObj, ...prev]);
    setIsModalOpen(false);
    setFormRemarks("");
    setFormReportFile(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-xs">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">CRA Monitoring Visits &amp; Site Follow-up</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              CRA Site Oversight
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Site Selection, Initiation (SIV), Routine Interim (IMV), and Close-out (COV) Trip Reports &amp; DIA Artifact 05.04.01 Filing
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Monitoring Visit
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-slate-500 font-medium text-xs">Total Visits Conducted</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{visits.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-slate-500 font-medium text-xs">Reports Approved</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {visits.filter(v => v.status.includes('Approved')).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-slate-500 font-medium text-xs">Follow-ups Required</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {visits.filter(v => v.followUpRequired).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-slate-500 font-medium text-xs">Next Scheduled Visit</p>
          <p className="text-sm font-bold text-indigo-700 mt-2 font-mono">20 Nov 2026</p>
        </div>
      </div>

      {/* Visits Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-800">Site Monitoring Trip Records</h2>
          <span className="text-slate-400 text-[11px] font-mono">ICH GCP E6 (R2/R3) Section 5.18</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Visit ID</th>
                <th className="py-3 px-4">Study / Site</th>
                <th className="py-3 px-4">Visit Type</th>
                <th className="py-3 px-4">Visit Date</th>
                <th className="py-3 px-4">Trip Report File</th>
                <th className="py-3 px-4">Action Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {visits.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">{v.id}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 block">{v.studyId} · {v.siteId}</span>
                    <span className="text-[11px] text-slate-500 truncate max-w-xs block">{v.siteName}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{v.visitType}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{v.visitDate}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    <span className="flex items-center gap-1 text-blue-700 font-semibold">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      {v.reportFileName}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      v.status.includes('Approved') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      v.followUpRequired ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {v.status}
                    </span>
                    {v.followUpRequired && (
                      <span className="block text-[10px] text-rose-700 font-semibold mt-0.5">
                        Action Item Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedVisit(v)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-md font-medium text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD MONITORING VISIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden text-xs font-sans max-h-[92vh] flex flex-col my-auto">
            
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-sky-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Add Monitoring Visit Report</h3>
                  <p className="text-[10px] text-blue-200 font-mono">DIA Zone 05 Site Oversight Documentation</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-blue-200 hover:text-white cursor-pointer p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => handleAddVisit(e, false)} className="p-5 space-y-3.5 overflow-y-auto flex-1">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Study ID *</label>
                  <select
                    value={formStudyId}
                    onChange={(e) => setFormStudyId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
                  >
                    {studies.map(s => (
                      <option key={s.id} value={s.id}>{s.id} ({s.shortName})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Site ID *</label>
                  <select
                    value={formSiteId}
                    onChange={(e) => setFormSiteId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
                  >
                    {activeSites.map(site => (
                      <option key={site.id} value={site.id}>{site.id}: {site.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Visit Type *</label>
                  <select
                    value={formVisitType}
                    onChange={(e) => setFormVisitType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
                  >
                    <option value="Site Selection Visit (SSV)">Site Selection Visit (SSV)</option>
                    <option value="Site Initiation Visit (SIV)">Site Initiation Visit (SIV)</option>
                    <option value="Periodic Interim Monitoring (IMV)">Periodic Interim Monitoring (IMV)</option>
                    <option value="Close-Out Visit (COV)">Close-Out Visit (COV)</option>
                    <option value="For-Cause Audit / Inspection">For-Cause Audit / Inspection</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Visit Date *</label>
                  <input
                    type="date"
                    value={formVisitDate}
                    onChange={(e) => setFormVisitDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Visit Report PDF *</label>
                <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center bg-slate-50">
                  <input
                    type="file"
                    id="visit-report-file"
                    className="hidden"
                    accept=".pdf,.docx"
                    onChange={(e) => setFormReportFile(e.target.files[0])}
                  />
                  <label htmlFor="visit-report-file" className="cursor-pointer block space-y-1">
                    <Upload className="w-5 h-5 text-blue-600 mx-auto" />
                    <p className="text-xs font-semibold text-slate-800">
                      {formReportFile ? formReportFile.name : "Click to select signed monitoring report PDF"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">Max size: 25MB (21 CFR Part 11 compliant)</p>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Follow-up Required? *</label>
                  <select
                    value={formFollowUp ? "yes" : "no"}
                    onChange={(e) => setFormFollowUp(e.target.value === "yes")}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 text-xs"
                  >
                    <option value="yes">Yes (Corrective Action Needed)</option>
                    <option value="no">No (Fully Compliant)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Next Scheduled Visit Date</label>
                  <input
                    type="date"
                    value={formNextDate}
                    onChange={(e) => setFormNextDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Follow-up Action Remarks &amp; Action Items</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Verified 100% ICFs for subjects 001-008. Reminded CRC to obtain signed DOA log amendment from Dr. Jenkins..."
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 text-xs"
                />
              </div>

              {/* Action Buttons as specified in Section 4.E */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleAddVisit(e, true)}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-semibold shadow-2xs cursor-pointer"
                  >
                    Save Draft
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Report
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DETAILS DRAWER */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{selectedVisit.id}</h3>
                  <p className="text-slate-500 text-xs">{selectedVisit.visitType}</p>
                </div>
                <button onClick={() => setSelectedVisit(null)} className="p-1 hover:bg-slate-100 rounded">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p><span className="text-slate-400">Study / Site:</span> <strong>{selectedVisit.studyId} · {selectedVisit.siteId}</strong></p>
                <p><span className="text-slate-400">Facility:</span> {selectedVisit.siteName}</p>
                <p><span className="text-slate-400">CRA Name:</span> <strong>{selectedVisit.craName}</strong></p>
                <p><span className="text-slate-400">Visit Date:</span> {selectedVisit.visitDate}</p>
                <p><span className="text-slate-400">Next Scheduled:</span> {selectedVisit.nextVisitDate}</p>
                <p><span className="text-slate-400">Trip Report File:</span> <span className="font-mono text-blue-700">{selectedVisit.reportFileName}</span></p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                  <span className="text-slate-500 font-bold block mb-1">Follow-up &amp; Remarks:</span>
                  <p className="text-slate-800 leading-relaxed">{selectedVisit.followUpRemarks}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedVisit(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}