import React from 'react';
import { X, Package, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTMFData } from '../../context/TMFDataContext';

export default function InventoryModal({ onClose }) {
  const { documents, selectedStudyId, activeStudy } = useTMFData();
  const navigate = useNavigate();

  const studyDocs = documents.filter(d => d.study_id === selectedStudyId);
  const certifiedCopies = studyDocs.filter(d => d.is_certified_copy).length;
  const electronicNative = studyDocs.length - certifiedCopies;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-xs font-sans">
        
        {/* Header */}
        <div className="bg-clinevo-header text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-400" />
            <h3 className="font-bold text-sm">TMF Inventory Summary — {activeStudy.id}</h3>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
              <span className="text-slate-500 text-[10px] block">Total Active Records</span>
              <span className="text-2xl font-bold text-slate-900">{studyDocs.length}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
              <span className="text-emerald-700 text-[10px] block">Certified Copies</span>
              <span className="text-2xl font-bold text-emerald-700">{certifiedCopies}</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
              <span className="text-blue-700 text-[10px] block">Electronic Native</span>
              <span className="text-2xl font-bold text-blue-700">{electronicNative}</span>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-center">
              <span className="text-purple-700 text-[10px] block">Storage Barcode</span>
              <span className="text-base font-bold text-purple-700">BOX-CT-9402</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] space-y-1 text-slate-600">
            <p><strong className="text-slate-800">Archive Facility:</strong> Clinidea Central GxP Repository (Rack A-14)</p>
            <p><strong className="text-slate-800">Retention Horizon:</strong> 25 Years (Post-trial closeout until 2051)</p>
            <p><strong className="text-slate-800">Fire & Environmental Protection:</strong> ISO 14644 Certified Vault</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/inventory');
              }}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              Open Full Inventory Manager <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
