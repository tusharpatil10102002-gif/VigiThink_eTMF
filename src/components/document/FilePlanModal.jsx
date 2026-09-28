import React, { useState } from 'react';
import { X, FileSpreadsheet, Plus, Download, Check, Search } from 'lucide-react';
import { useTMFData } from '../../context/TMFDataContext';

export default function FilePlanModal({ onClose }) {
  const { documents, activeStudy } = useTMFData();
  const [filterDocNum, setFilterDocNum] = useState("");
  const [filterMandatory, setFilterMandatory] = useState("(All)");
  const [filterQc, setFilterQc] = useState("(All)");

  // Sample File Plan items
  const filePlanItems = [
    { id: 1, name: "01.04.02 Trial Team Training Material", path: "Study > 01 Trial Management > 01.04 Meetings > 01.04.02 Trial Team Training Material", type: "Trial Training Material", docsNum: 1, mandatory: "Yes", qcRequired: "No", milestone: "02 Clinical Infrastructure Ready", workflow: "AutoPublish" },
    { id: 2, name: "01.04.03 Investigators Meeting Material", path: "Study > 01 Trial Management > 01.04 Meetings > 01.04.03 Investigators Meeting Material", type: "Investigators Meeting Material", docsNum: 2, mandatory: "Yes", qcRequired: "No", milestone: "02 Clinical Infrastructure Ready", workflow: "AutoPublish" },
    { id: 3, name: "01.04.04 Trial Team Evidence of Training", path: "Study > 01 Trial Management > 01.04 Meetings > 01.04.04 Trial Team Evidence of Training", type: "Evidence of Training", docsNum: 1, mandatory: "Yes", qcRequired: "No", milestone: "02 Clinical Infrastructure Ready", workflow: "AutoPublish" },
    { id: 4, name: "01.05.01 Relevant Communications", path: "Study > 01 Trial Management > 01.05 General > 01.05.01 Relevant Communications", type: "Relevant Communications", docsNum: 5, mandatory: "Yes", qcRequired: "No", milestone: "11 Ongoing", workflow: "AutoPublish" },
    { id: 5, name: "01.05.02 Tracking Information", path: "Study > 01 Trial Management > 01.05 General > 01.05.02 Tracking Information", type: "Tracking Information", docsNum: 2, mandatory: "Yes", qcRequired: "No", milestone: "11 Ongoing", workflow: "AutoPublish" },
    { id: 6, name: "02.01.01 Investigator's Brochure", path: "Study > 02 Central Trial Documents > 02.01 Product and Trial Documentation > 02.01.01 Investigator's Brochure", type: "Investigator's Brochure", docsNum: 1, mandatory: "Yes", qcRequired: "No", milestone: "01 First Country RA approval", workflow: "AutoPublish" },
    { id: 7, name: "02.01.02 Protocol", path: "Study > 02 Central Trial Documents > 02.01 Product and Trial Documentation > 02.01.02 Protocol", type: "Protocol", docsNum: 1, mandatory: "Yes", qcRequired: "No", milestone: "01 First Country RA approval", workflow: "AutoPublish" },
    { id: 8, name: "02.01.03 Protocol Synopsis", path: "Study > 02 Central Trial Documents > 02.01 Product and Trial Documentation > 02.01.03 Protocol Synopsis", type: "Protocol Synopsis", docsNum: 1, mandatory: "Yes", qcRequired: "No", milestone: "01 First Country RA approval", workflow: "AutoPublish" }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] text-xs font-sans">
        
        {/* Header matching Screenshot Page 14 */}
        <div className="bg-clinevo-blue text-white px-4 py-2.5 flex items-center justify-between font-bold">
          <span className="text-sm flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> File Plan
          </span>
          <button onClick={onClose} className="p-1 text-white hover:bg-blue-700 rounded cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub Header Action Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <span>Structure Name:</span>
            <span className="font-bold text-blue-900 bg-sky-100 px-2 py-0.5 rounded border border-sky-300">Study</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1 rounded font-semibold shadow-xs flex items-center gap-1 cursor-pointer">
              <Download className="w-3.5 h-3.5 text-emerald-600" /> To Excel
            </button>
            <button className="bg-clinevo-blue hover:bg-blue-700 text-white px-3 py-1 rounded font-semibold shadow-xs flex items-center gap-1 cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Add Placeholder
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-clinevo-table-header text-white font-bold text-[11px]">
                <th className="p-2 border border-blue-800 text-center w-8">
                  <input type="checkbox" className="accent-blue-600" />
                </th>
                <th className="p-2 border border-blue-800">Name</th>
                <th className="p-2 border border-blue-800">Path</th>
                <th className="p-2 border border-blue-800">Document Type</th>
                <th className="p-2 border border-blue-800 text-center">Docs #</th>
                <th className="p-2 border border-blue-800 text-center">Is Mandatory?</th>
                <th className="p-2 border border-blue-800 text-center">Is QC Required</th>
                <th className="p-2 border border-blue-800">Milestone Status</th>
                <th className="p-2 border border-blue-800">Workflow Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans text-slate-800">
              {filePlanItems.map((item) => (
                <tr key={item.id} className="hover:bg-sky-50/60">
                  <td className="p-2 border border-slate-200 text-center">
                    <input type="checkbox" className="accent-blue-600" />
                  </td>
                  <td className="p-2 border border-slate-200 font-bold text-slate-900">{item.name}</td>
                  <td className="p-2 border border-slate-200 text-[11px] text-slate-600">{item.path}</td>
                  <td className="p-2 border border-slate-200 text-slate-700">{item.type}</td>
                  <td className="p-2 border border-slate-200 text-center font-mono font-bold text-slate-700">{item.docsNum}</td>
                  <td className="p-2 border border-slate-200 text-center font-semibold text-emerald-700">{item.mandatory}</td>
                  <td className="p-2 border border-slate-200 text-center text-slate-500">{item.qcRequired}</td>
                  <td className="p-2 border border-slate-200 text-slate-700">{item.milestone}</td>
                  <td className="p-2 border border-slate-200 text-slate-600 font-mono text-[10px]">{item.workflow}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex justify-end">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-1.5 rounded cursor-pointer">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
