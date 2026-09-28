import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTMFData } from '../context/TMFDataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  RefreshCw, 
  FileText, 
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderOpen,
  Eye
} from 'lucide-react';
import DocumentViewerDrawer from '../components/document/DocumentViewerDrawer';

export default function Dashboard() {
  const { documents, fetchData, activeStudy } = useTMFData();
  const { isDocumentInScope } = useAuth();
  const navigate = useNavigate();
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [tableSearch, setTableSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (fetchData) await fetchData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const scopedDocs = documents.filter(isDocumentInScope);

  const countApproved = scopedDocs.filter(d => d.status === 'Effective' || d.status === 'Approved').length;
  const countOpen = scopedDocs.filter(d => d.status === 'Draft' || d.status === 'In Progress' || d.status === 'Open').length;
  const countPendingReview = scopedDocs.filter(d => d.status === 'In Review' || d.qc_status === 'In Progress').length;
  const countQueries = scopedDocs.filter(d => d.qc_status === 'Query Raised' || d.qc_status === 'Failed').length;

  const filterTabs = [
    { id: "All", label: "All Documents", count: scopedDocs.length },
    { id: "Open", label: "Draft / Open", count: countOpen },
    { id: "Review", label: "Pending QC Review", count: countPendingReview },
    { id: "Approved", label: "Approved / Effective", count: countApproved },
    { id: "Queries", label: "Queries", count: countQueries }
  ];

  const filteredDocs = scopedDocs.filter(d => {
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      return (
        (d.document_id || '').toLowerCase().includes(q) ||
        (d.document_title || '').toLowerCase().includes(q) ||
        (d.folder_path || '').toLowerCase().includes(q)
      );
    }
    if (activeCategory === "Open") return d.status === 'Draft' || d.status === 'In Progress' || d.status === 'Open';
    if (activeCategory === "Review") return d.status === 'In Review' || d.qc_status === 'In Progress';
    if (activeCategory === "Approved") return d.status === 'Effective' || d.status === 'Approved';
    if (activeCategory === "Queries") return d.qc_status === 'Query Raised' || d.qc_status === 'Failed';
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-xs">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Study Overview & Active Documents</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeStudy?.id} — {activeStudy?.shortName || activeStudy?.title}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/explorer')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-amber-500" />
            Open eTMF Repository
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Clean KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-medium text-xs">Total Documents</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{scopedDocs.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-medium text-xs">Approved / Effective</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{countApproved}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-medium text-xs">Pending QC Review</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{countPendingReview}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-medium text-xs">Open Queries</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{countQueries}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Documents & Tasks Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        
        {/* Filter Pills & Search Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === tab.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  activeCategory === tab.id ? 'bg-blue-700 text-white' : 'bg-white text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter table..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Clean Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Document ID</th>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Study / Site</th>
                <th className="py-3 px-4">Folder Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Filed Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No documents found in this view. Click "Upload Document" in the top bar to add a file.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr 
                    key={doc.document_id}
                    onClick={() => setSelectedDoc(doc)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                      {doc.document_id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {doc.document_title}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {doc.study_id} {doc.site_id ? `· ${doc.site_id}` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {doc.folder_path || `Zone ${doc.tmf_zone_id} > ${doc.tmf_artifact_name}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                        doc.status === 'Effective' || doc.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : doc.qc_status === 'Query Raised'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {doc.filing_date || doc.document_date || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoc(doc);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-md font-medium text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDoc && (
        <DocumentViewerDrawer doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </div>
  );
}
