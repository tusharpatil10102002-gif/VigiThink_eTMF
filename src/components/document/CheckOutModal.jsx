import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

export default function CheckOutModal({ docTitle = "Protocol_DEC 2023 BATCH_1_pdf", onClose, onConfirm }) {
  const [purpose, setPurpose] = useState("");
  const [copyAssociatedUsers, setCopyAssociatedUsers] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onConfirm) onConfirm(purpose, copyAssociatedUsers);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-xs font-sans">
        
        {/* Header matching Screenshot Page 19 top */}
        <div className="bg-clinevo-blue text-white px-4 py-2.5 flex items-center justify-between font-bold">
          <span className="text-sm flex items-center gap-1.5">
            <Lock className="w-4 h-4" /> Check Out
          </span>
          <button onClick={onClose} className="p-1 text-white hover:bg-blue-700 rounded cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Purpose :</label>
            <textarea
              rows={4}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Enter reason for document checkout..."
              className="w-full bg-white border border-slate-300 rounded p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-inner"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="copyUsers"
              checked={copyAssociatedUsers}
              onChange={(e) => setCopyAssociatedUsers(e.target.checked)}
              className="accent-blue-600 rounded"
            />
            <label htmlFor="copyUsers" className="text-slate-700 font-semibold cursor-pointer">
              Copy Associated Users In Checkout
            </label>
          </div>

          <div className="flex justify-center gap-3 pt-3 border-t border-slate-200">
            <button
              type="submit"
              className="bg-clinevo-blue hover:bg-blue-700 text-white font-bold px-5 py-1.5 rounded shadow-xs cursor-pointer"
            >
              Check Out
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-5 py-1.5 rounded cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
