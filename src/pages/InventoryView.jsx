import React, { useState } from 'react';
import { useTMFData } from '../context/TMFDataContext';
import { Package, Search, Download, Barcode, ShieldCheck, MapPin, Box, Filter } from 'lucide-react';
import DocumentViewerDrawer from '../components/document/DocumentViewerDrawer';

export default function InventoryView() {
  const { documents, selectedStudyId, activeStudy, downloadDocumentFile } = useTMFData();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const studyDocs = documents.filter(d => d.study_id === selectedStudyId);
  const certifiedCopies = studyDocs.filter(d => d.is_certified_copy);
  const electronicNative = studyDocs.filter(d => !d.is_certified_copy);

  const filteredDocs = studyDocs.filter(d => {
    if (filterType === 'CERTIFIED' && !d.is_certified_copy) return false;
    if (filterType === 'ELECTRONIC' && d.is_certified_copy) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.document_id.toLowerCase().includes(q) || d.document_title.toLowerCase().includes(q) || (d.folder_path || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full font-sans text-xs">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-700" />
            TMF Inventory, Physical & Electronic Repository Manager
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Module 11 & Storage Tracking: Master index of certified copies, physical archive barcodes, and long-term retention boxes
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="px-3 py-1 bg-teal-50 text-teal-800 rounded border border-teal-200 font-bold">
            Trial: {activeStudy.id}
          </span>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded border border-slate-300">
            Total Inventory: {studyDocs.length} Items
          </span>
        </div>
      </div>

      {/* Storage Vault Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-teal-600 space-y-1">
          <span className="text-slate-500 text-xs font-mono">Physical Box Location</span>
          <p className="text-xl font-bold text-slate-900 font-mono">VAULT-A / BOX-9402</p>
          <span className="text-[10px] text-teal-700 flex items-center gap-1 font-semibold">
            <MapPin className="w-3 h-3" /> Central GxP Repository (Rack 14)
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-blue-600 space-y-1">
          <span className="text-slate-500 text-xs font-mono">Electronic Native Records</span>
          <p className="text-2xl font-bold text-blue-700 font-mono">{electronicNative.length}</p>
          <span className="text-[10px] text-slate-500 font-mono">SHA-256 Validated</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-emerald-600 space-y-1">
          <span className="text-slate-500 text-xs font-mono">Certified Paper Scans</span>
          <p className="text-2xl font-bold text-emerald-700 font-mono">{certifiedCopies.length}</p>
          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> ALCOA+ Certified Copy
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-purple-600 space-y-1">
          <span className="text-slate-500 text-xs font-mono">Retention Expiration</span>
          <p className="text-xl font-bold text-purple-700 font-mono">2051-12-31</p>
          <span className="text-[10px] text-slate-500 font-mono">25 Years Statutory Horizon</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search inventory by Document ID, Title, or Folder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded pl-9 pr-3 py-1.5 focus:border-teal-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
          >
            <option value="ALL">All Inventory Types</option>
            <option value="ELECTRONIC">Electronic Native Only</option>
            <option value="CERTIFIED">Certified Paper Copies Only</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-panel p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="font-bold text-slate-900 text-xs">Inventory Assets List ({filteredDocs.length})</h3>
          <span className="text-[11px] text-slate-500 font-mono">Barcode Format: CODE-128 / GxP Certified</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-mono text-[11px] uppercase border-b border-slate-200">
                <th className="p-3">Asset / Barcode ID</th>
                <th className="p-3">Document Title</th>
                <th className="p-3">TMF Zone & Artifact</th>
                <th className="p-3">Media Format</th>
                <th className="p-3">Physical Box Reference</th>
                <th className="p-3">Retention End Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredDocs.map((doc, idx) => (
                <tr key={doc.document_id} className="hover:bg-slate-50/80">
                  <td className="p-3">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="text-teal-700 hover:underline font-mono font-bold text-xs cursor-pointer block"
                    >
                      {doc.document_id}
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">BAR-{1000 + idx}</span>
                  </td>
                  <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">
                    {doc.document_title}
                  </td>
                  <td className="p-3 font-mono text-slate-600 text-[11px]">
                    Zone {doc.tmf_zone_id} → {doc.tmf_artifact_id}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                      doc.is_certified_copy ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-blue-50 text-blue-800 border-blue-300'
                    }`}>
                      {doc.is_certified_copy ? 'Certified Scan' : 'Electronic Native'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-700 text-[11px]">
                    {doc.is_certified_copy ? `BOX-CT-${doc.study_id}-01` : 'Digital Cloud / AWS S3'}
                  </td>
                  <td className="p-3 font-mono text-slate-600 text-[11px]">
                    {doc.retention_end_date || '2051-01-01'}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => downloadDocumentFile(doc)}
                      className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded border border-teal-200 text-xs font-semibold cursor-pointer"
                    >
                      Manifest
                    </button>
                  </td>
                </tr>
              ))}
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
