import React, { useState } from 'react';
import { X, KeyRound, ShieldCheck, FileCheck, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTMFData } from '../../context/TMFDataContext';

export default function ESignatureModal({ doc, onClose }) {
  const { currentUser, currentRole } = useAuth();
  const { applyPart11ESignature } = useTMFData();

  const [password, setPassword] = useState("");
  const [signerMeaning, setSignerMeaning] = useState("Author Sign-off & Approval");
  const [error, setError] = useState("");

  const handleSignSubmit = (e) => {
    e.preventDefault();
    if (!password || password.length < 4) {
      setError("Please enter your valid security PIN or password to verify identity.");
      return;
    }

    applyPart11ESignature(doc.document_id, signerMeaning, currentUser, password);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-blue-700">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="text-sm font-bold text-slate-900">21 CFR Part 11 Electronic Signature</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSignSubmit} className="p-5 space-y-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 font-mono text-[11px] text-slate-800">
            <p><span className="text-slate-500">Document ID:</span> <span className="text-blue-700 font-bold">{doc?.document_id}</span></p>
            <p className="truncate"><span className="text-slate-500">Title:</span> {doc?.document_title}</p>
            <p><span className="text-slate-500">SHA-256 Digest:</span> <span className="text-slate-600 text-[10px] break-all">{doc?.checksum_hash}</span></p>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Signer Identity & Role</label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
              <span className="text-slate-900 font-semibold">{currentUser.name}</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 font-bold">
                {currentRole.name}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Meaning of Signature *</label>
            <select
              value={signerMeaning}
              onChange={(e) => setSignerMeaning(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:border-blue-500 shadow-xs"
            >
              <option value="Author Sign-off & Approval">I am the Author and approve this document as final.</option>
              <option value="QC Lead Approval">I am the QC Reviewer and verify compliance with SOPs.</option>
              <option value="CTM Final Approval">I am the CTM and approve this document for regulatory filing.</option>
              <option value="Investigator Statement">I am the PI and certify site delegation accuracy.</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Re-authenticate User Password / PIN *</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="password"
                placeholder="Enter PIN (e.g. 1234)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-slate-900 focus:border-blue-500 shadow-xs"
              />
            </div>
            {error && <p className="text-rose-600 text-[11px] mt-1 font-medium">{error}</p>}
          </div>

          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-900 text-[11px]">
            <p className="font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Legally Binding Declaration:
            </p>
            <p className="text-slate-600 text-[10px] leading-relaxed mt-0.5">
              By clicking "Sign Document", you execute a legally binding electronic signature per FDA 21 CFR Part 11 requirements.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" /> Sign & Mark Effective
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
