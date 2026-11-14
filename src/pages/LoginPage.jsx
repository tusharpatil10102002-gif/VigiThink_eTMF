import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import logoImg from '../assets/vigithink_logo.png';

export default function LoginPage() {
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [enterpriseName, setEnterpriseName] = useState("VigiThink Clinical");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!userName) {
      setError("Please enter your Login ID or Email.");
      return;
    }

    setIsLoggingIn(true);
    setError("");
    const result = await loginWithCredentials(userName, password);
    setIsLoggingIn(false);

    if (result && result.success) {
      navigate('/');
    } else {
      setError(result?.error || "Invalid Login ID or Password.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 font-sans select-none">
      
      {/* Veeva / SAP Style Login Container */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl border border-slate-300 p-6 sm:p-8 space-y-5">
        
        {/* Brand Header */}
        <div className="text-center space-y-2 border-b border-slate-200 pb-4">
          <div className="flex justify-center mb-1">
            <img src={logoImg} alt="VigiThink Logo" className="h-9 w-auto object-contain" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">VigiThink eTMF Enterprise Trial Master File</h1>
          <p className="text-xs text-slate-600 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            21 CFR Part 11 &amp; DIA TMF Reference Model v3.1
          </p>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-xs">User Login ID / Email</label>
            <input
              type="text"
              placeholder="e.g. admin@vigithink.com"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setError("");
              }}
              className="w-full bg-white border border-slate-300 focus:border-blue-700 rounded px-3 py-2 text-slate-900 focus:outline-none text-xs transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-xs">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="w-full bg-white border border-slate-300 focus:border-blue-700 rounded px-3 py-2 text-slate-900 focus:outline-none text-xs transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-xs">Organization / Sponsor</label>
            <input
              type="text"
              value={enterpriseName}
              onChange={(e) => setEnterpriseName(e.target.value)}
              placeholder="VigiThink eTMF"
              className="w-full bg-white border border-slate-300 focus:border-blue-700 rounded px-3 py-2 text-slate-900 focus:outline-none text-xs transition-colors"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 rounded flex items-center gap-2 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded shadow-xs transition-colors cursor-pointer text-xs disabled:opacity-50"
            >
              {isLoggingIn ? "Authenticating Session..." : "Sign In to eTMF Vault"}
            </button>
          </div>
        </form>

        {/* Enterprise Security Notice */}
        <div className="pt-3 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-500 font-sans">
            Authorized Personnel Only · 21 CFR Part 11 Electronic Records Compliance
          </p>
        </div>
      </div>
    </div>
  );
}
