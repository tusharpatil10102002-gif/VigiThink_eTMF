import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';
import logoImg from '../assets/vigithink_logo.png';

export default function LoginPage() {
  const { loginWithCredentials, demoUsers } = useAuth();
  const navigate = useNavigate();

  const [userName, setUserName] = useState("admin@clinidea.in");
  const [password, setPassword] = useState("Admin@Clinidea2026");
  const [enterpriseName, setEnterpriseName] = useState("Clinidea Education");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showDemoUsersModal, setShowDemoUsersModal] = useState(false);

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

  const handleQuickDemoLogin = async (demoUser) => {
    setUserName(demoUser.loginId || demoUser.email);
    setPassword(demoUser.password);
    setError("");
    const res = await loginWithCredentials(demoUser.loginId || demoUser.email, demoUser.password);
    if (res && res.success) {
      setShowDemoUsersModal(false);
      navigate('/');
    } else {
      setError(res?.error || "Account cannot be logged into.");
      setShowDemoUsersModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 font-sans select-none">
      {/* Main Centered Clean Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-slate-200/80 space-y-6">
        <div className="text-center space-y-2 border-b border-slate-100 pb-5">
          <div className="flex justify-center mb-2">
            <img src={logoImg} alt="VigiThink Logo" className="h-9 w-auto object-contain" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Clinidea Education — VigiThink eTMF</h1>
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            21 CFR Part 11 & ICH-GCP Validated Portal
          </p>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 text-xs">Login ID / Email</label>
            <input
              type="text"
              placeholder="e.g. admin@clinidea.in"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setError("");
              }}
              className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none text-xs transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 text-xs">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none text-xs transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 text-xs">Organization</label>
            <input
              type="text"
              value={enterpriseName}
              onChange={(e) => setEnterpriseName(e.target.value)}
              placeholder="Clinidea Education"
              className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none text-xs transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer text-xs disabled:opacity-50"
            >
              {isLoggingIn ? "Signing in..." : "Sign In"}
            </button>

            <button
              type="button"
              onClick={() => setShowDemoUsersModal(true)}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium py-2 rounded-lg border border-slate-200 transition-colors cursor-pointer text-xs flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              Quick Role / Student Login
            </button>
          </div>
        </form>
      </div>

      {/* Role & Student Selector Modal */}
      {showDemoUsersModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Select Account to Sign In
              </h3>
              <button
                onClick={() => setShowDemoUsersModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleQuickDemoLogin(u)}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-slate-900 text-xs">{u.name}</p>
                    <p className="text-[11px] text-slate-500">{u.title} · {u.email}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                    {u.siteScope || 'ALL'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
