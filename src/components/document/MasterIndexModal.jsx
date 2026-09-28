import React, { useState } from 'react';
import { X, ListOrdered, Download, Search } from 'lucide-react';
import { useTMFData } from '../../context/TMFDataContext';

export default function MasterIndexModal({ onClose }) {
  const { zonesTaxonomy } = useTMFData();
  const [search, setSearch] = useState("");

  const flattenedArtifacts = [];
  zonesTaxonomy.forEach(z => {
    z.sections.forEach(s => {
      s.artifacts.forEach(a => {
        flattenedArtifacts.push({
          zoneId: z.id,
          zoneName: z.name,
          sectionId: s.id,
          sectionName: s.name,
          artifactId: a.id,
          artifactName: a.name
        });
      });
    });
  });

  const filtered = flattenedArtifacts.filter(item => 
    item.artifactName.toLowerCase().includes(search.toLowerCase()) ||
    item.artifactId.includes(search) ||
    item.zoneName.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownloadCsv = () => {
    const headers = ['Zone ID', 'Zone Name', 'Section ID', 'Section Name', 'Artifact ID', 'Artifact Name'];
    const rows = flattenedArtifacts.map(i => [
      `"${i.zoneId}"`,
      `"${i.zoneName}"`,
      `"${i.sectionId}"`,
      `"${i.sectionName}"`,
      `"${i.artifactId}"`,
      `"${i.artifactName}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DIA_TMF_Reference_Model_v3.1_Master_Index.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden text-xs font-sans">
        
        {/* Header */}
        <div className="bg-clinevo-header text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">DIA TMF Reference Model v3.1 — Master Index</h3>
              <p className="text-[10px] text-blue-200 font-mono">Standardized Clinical Trial Artifact Taxonomy (11 Zones / Sections / Artifacts)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search DIA artifacts or zones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded pl-8 pr-3 py-1 text-xs text-slate-800 focus:border-blue-500 shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono">Showing {filtered.length} of {flattenedArtifacts.length} artifacts</span>
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export Master Index (CSV)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-clinevo-table-header text-white font-bold text-[11px] sticky top-0">
                <th className="p-2 border border-blue-800">Artifact ID</th>
                <th className="p-2 border border-blue-800">Artifact Name</th>
                <th className="p-2 border border-blue-800">Zone</th>
                <th className="p-2 border border-blue-800">Section</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filtered.map(item => (
                <tr key={item.artifactId} className="hover:bg-sky-50/60">
                  <td className="p-2 border border-slate-200 font-mono font-bold text-blue-900">{item.artifactId}</td>
                  <td className="p-2 border border-slate-200 font-semibold">{item.artifactName}</td>
                  <td className="p-2 border border-slate-200 text-slate-600 font-sans">Zone {item.zoneId}: {item.zoneName}</td>
                  <td className="p-2 border border-slate-200 text-slate-500 font-mono text-[11px]">{item.sectionId} {item.sectionName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
