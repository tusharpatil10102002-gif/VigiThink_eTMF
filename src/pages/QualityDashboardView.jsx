import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTMFData } from '../context/TMFDataContext';
import { Star, ShieldCheck, TrendingUp, ClipboardList, HelpCircle, FolderOpen } from 'lucide-react';

export default function QualityDashboardView() {
  const { documents, selectedStudyId, activeStudy, zonesTaxonomy } = useTMFData();
  const navigate = useNavigate();

  const studyDocs = documents.filter(d => d.study_id === selectedStudyId);
  const greenDocs = studyDocs.filter(d => d.qc_score === 'Green' || d.status === 'Effective' || d.qc_status === 'Passed').length;
  const amberDocs = studyDocs.filter(d => d.qc_score === 'Amber' || d.qc_status === 'In Progress').length;
  const redDocs = studyDocs.filter(d => d.qc_score === 'Red' || d.qc_status === 'Failed' || d.qc_status === 'Query Raised' || d.status === 'Placeholder').length;

  const total = studyDocs.length || 1;
  const qualityIndex = studyDocs.length === 0 ? 100 : Math.round((greenDocs / total) * 100);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            TMF Quality Metrics & Zone Compliance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Study: {activeStudy.id} ({activeStudy.shortName}) · Real-time ALCOA+ & SOP-TMF-04 Quality Overview
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/qc-queue')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            Open QC Review Queue
          </button>
          <button
            type="button"
            onClick={() => navigate('/queries')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-amber-500" />
            Manage Queries
          </button>
        </div>
      </div>

      {/* KPI Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-500 text-xs font-medium">TMF Quality Index</span>
          <p className="text-2xl font-bold text-blue-600">{qualityIndex}%</p>
          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> SOP-TMF-04 Target: &gt; 95%
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-500 text-xs font-medium">Green (Passed QC)</span>
          <p className="text-2xl font-bold text-emerald-600">{greenDocs}</p>
          <span className="text-[11px] text-slate-400">Approved & Verified</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-500 text-xs font-medium">Amber (Pending QC)</span>
          <p className="text-2xl font-bold text-amber-600">{amberDocs}</p>
          <span className="text-[11px] text-slate-400">Awaiting Inspection</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-500 text-xs font-medium">Red (Queries / Rejected)</span>
          <p className="text-2xl font-bold text-rose-600">{redDocs}</p>
          <span className="text-[11px] text-rose-500 font-medium">Remediation Needed</span>
        </div>
      </div>

      {/* Zone Quality Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            DIA TMF Reference Model Zone Quality Breakdown
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-3.5">DIA Zone</th>
                <th className="p-3.5">Total Artifacts</th>
                <th className="p-3.5">Passed QC</th>
                <th className="p-3.5">Queries Pending</th>
                <th className="p-3.5">Quality Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {zonesTaxonomy.map(z => {
                const zoneDocs = studyDocs.filter(d => d.tmf_zone_id === z.id);
                const passed = zoneDocs.filter(d => d.status === 'Effective' || d.status === 'Approved' || d.qc_status === 'Passed').length;
                const queries = zoneDocs.filter(d => d.qc_status === 'Query Raised' || d.qc_status === 'Failed').length;
                const rag = queries > 0 ? 'Attention' : zoneDocs.length === 0 ? 'Empty' : 'Compliant';

                return (
                  <tr key={z.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-semibold text-slate-900">
                      Zone {z.id}: {z.name}
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">{zoneDocs.length}</td>
                    <td className="p-3.5 font-mono text-emerald-600 font-bold">{passed}</td>
                    <td className="p-3.5 font-mono text-amber-600 font-bold">{queries}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        rag === 'Compliant'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : rag === 'Attention'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {rag}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/explorer?study=${encodeURIComponent(selectedStudyId)}&zone=${encodeURIComponent(z.id)}`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg font-medium text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <FolderOpen className="w-3.5 h-3.5" /> Open Zone
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
