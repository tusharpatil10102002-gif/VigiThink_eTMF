import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTMFData } from '../context/TMFDataContext';
import {
  Users,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Power,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Download,
  UserCheck,
  Lock,
  Calendar,
  ClipboardCheck,
  X
} from 'lucide-react';

export default function UserRoleManagement() {
  const {
    currentUser,
    rolesList,
    usersList,
    rotationSchedule,
    setupChecklist,
    setSetupChecklist,
    createUserCredential,
    updateUserCredential,
    toggleUserActiveStatus,
    deleteUserCredential,
    applyStudentRotation,
    switchUserPersona
  } = useAuth();

  const { studies } = useTMFData();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'rotations' | 'permissions' | 'checklist'
  const [showPasswords, setShowPasswords] = useState({});
  const [bannerMessage, setBannerMessage] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const isAdminOrMentor = currentUser.roleId === 'system_admin' || currentUser.roleId === 'tmf_manager';
  const isSystemAdmin = currentUser.roleId === 'system_admin';

  // Form state for Create / Edit User
  const [formData, setFormData] = useState({
    name: '',
    loginId: '',
    email: '',
    password: '',
    mobile: '',
    course: 'Clinical Research, Pharmacovigilance & Clinical Data Management',
    position: 'Student',
    roleId: 'cra',
    trainingRole: 'CRA – Rotation 1',
    studyScope: 'CLIN-001',
    countryScope: 'India',
    siteScope: 'Site 001 - AIIMS RPC Eye Centre, New Delhi'
  });

  const showToast = (msg) => {
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(''), 5000);
  };

  const togglePasswordVisibility = (uid) => {
    setShowPasswords(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  // Inline Role Change Handler
  const handleInlineRoleChange = async (user, newRoleId) => {
    const roleObj = rolesList.find(r => r.id === newRoleId);
    const newSiteScope =
      newRoleId === 'cra' || newRoleId === 'site_user'
        ? user.assignedSite || 'Site 001 - AIIMS RPC Eye Centre, New Delhi'
        : 'ALL';

    const res = await updateUserCredential(user.id, {
      roleId: newRoleId,
      trainingRole: `${roleObj ? roleObj.name : newRoleId} (Updated by Admin)`,
      siteScope: newSiteScope
    });

    if (res.success) {
      showToast(`Role for ${user.name} updated to "${roleObj?.name || newRoleId}"!`);
    }
  };

  // Inline Study / Site Scope Change
  const handleInlineScopeChange = async (user, field, value) => {
    const res = await updateUserCredential(user.id, { [field]: value });
    if (res.success) {
      showToast(`Updated ${field} for ${user.name} to "${value}".`);
    }
  };

  // Handle Create User Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const res = await createUserCredential(formData);
    if (res.success) {
      showToast(`Created credential for ${formData.name} (${formData.loginId})!`);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        loginId: '',
        email: '',
        password: '',
        mobile: '',
        course: 'Clinical Research & Pharmacovigilance',
        position: 'Student',
        roleId: 'cra',
        trainingRole: 'CRA – Rotation 1',
        studyScope: 'CLIN-001',
        countryScope: 'India',
        siteScope: 'Site 001 - AIIMS RPC Eye Centre, New Delhi'
      });
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  // Handle Edit User Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    const res = await updateUserCredential(editingUser.id, editingUser);
    if (res.success) {
      showToast(`Updated credentials & access for ${editingUser.name}!`);
      setEditingUser(null);
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  // Apply Rotation Matrix
  const handleApplyRotation = async (rotationName) => {
    const res = await applyStudentRotation(rotationName);
    if (res.success) {
      showToast(res.message);
    }
  };

  // Export Users & Credentials CSV
  const handleExportCredentialsCsv = () => {
    const headers = [
      'User Name',
      'Position',
      'Login ID',
      'Personal Email',
      'Password',
      'Mobile Number',
      'Registered Course',
      'Active eTMF Role',
      'Training Role',
      'Study Scope',
      'Country Scope',
      'Site Scope',
      'Account Status'
    ];
    const rows = usersList.map(u => [
      `"${u.name}"`,
      `"${u.position || ''}"`,
      `"${u.loginId}"`,
      `"${u.email}"`,
      `"${u.password}"`,
      `"${u.mobile || ''}"`,
      `"${u.course || ''}"`,
      `"${u.title || u.roleId}"`,
      `"${u.trainingRole || ''}"`,
      `"${u.studyScope}"`,
      `"${u.countryScope}"`,
      `"${u.siteScope}"`,
      `"${u.isActive !== false ? 'Active' : 'Deactivated'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Clinidea_Education_eTMF_User_Credentials_RBAC.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allSitesList = studies
    .flatMap(s => (s.countries || []).flatMap(c => c.sites || []))
    .map(st => st.name);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full text-xs font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h1 className="text-base font-extrabold tracking-wide">
              CLINIDEA EDUCATION — eTMF ROLE & CREDENTIAL GOVERNANCE CENTER
            </h1>
          </div>
          <p className="text-xs text-slate-300 font-mono">
            Logged in as: <span className="text-emerald-300 font-bold">{currentUser.name}</span> ({currentUser.loginId}) | Active Role:{' '}
            <span className="text-sky-300 font-bold">{currentUser.title}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCredentialsCsv}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-300" /> Export Credentials CSV
          </button>

          {isAdminOrMentor && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <UserPlus className="w-4 h-4" /> + Create User Credential
            </button>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {bannerMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <button onClick={() => setBannerMessage('')} className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'users'
              ? 'bg-clinevo-blue text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> 1. Student & Admin Credentials ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('rotations')}
          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'rotations'
              ? 'bg-clinevo-blue text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> 2. 6-Rotation Schedule (Weeks 1–12)
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'permissions'
              ? 'bg-clinevo-blue text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" /> 3. Master Role Permission Matrix (9 Roles)
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'checklist'
              ? 'bg-clinevo-blue text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" /> 4. Setup & Governance Checklist
        </button>
      </div>

      {/* TAB 1: USER CREDENTIALS & LIVE ROLE CHANGER */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Clinidea Education — Active User Accounts, Credentials & Live Role Assignment
              </h2>
              <p className="text-[11px] text-slate-500">
                Admin (admin@clinidea.in) can change anyone&apos;s eTMF role, study/site scope, password, or active status in real time.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-clinevo-table-header text-white font-bold text-[11px] uppercase">
                  <th className="p-3">User / Student Details</th>
                  <th className="p-3">Login ID & Password</th>
                  <th className="p-3">Assigned eTMF Role (Admin Editable)</th>
                  <th className="p-3">4D Scope (Study / Site)</th>
                  <th className="p-3 text-center">Permissions Summary</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {usersList.map(u => {
                  const roleDef = rolesList.find(r => r.id === u.roleId) || rolesList[3];
                  const perms = roleDef.permissions || {};
                  const isPassVisible = !!showPasswords[u.id];

                  return (
                    <tr key={u.id} className={`hover:bg-sky-50/50 transition-colors ${u.isActive === false ? 'bg-rose-50/30 opacity-70' : ''}`}>
                      {/* Column 1: Student/User Info */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{u.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-mono">
                            {u.position || 'Student'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">Email: {u.email}</p>
                        {u.mobile && <p className="text-[10px] text-slate-500 font-mono">Mobile: {u.mobile}</p>}
                        {u.course && <p className="text-[10px] text-blue-700 font-medium mt-0.5 truncate max-w-xs">{u.course}</p>}
                      </td>

                      {/* Column 2: Login ID & Password */}
                      <td className="p-3 font-mono">
                        <p className="text-blue-800 font-bold text-[11px]">{u.loginId}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] text-emerald-800 font-bold">
                            {isPassVisible ? u.password : '••••••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                            title={isPassVisible ? 'Hide Password' : 'Show Password'}
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Column 3: Live Role Dropdown */}
                      <td className="p-3">
                        {isAdminOrMentor ? (
                          <div className="space-y-1">
                            <select
                              value={u.roleId}
                              onChange={(e) => handleInlineRoleChange(u, e.target.value)}
                              className="w-full bg-white border border-blue-300 rounded px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer text-xs"
                            >
                              {rolesList.map(r => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                            <p className="text-[10px] text-slate-500 font-mono">{u.trainingRole}</p>
                          </div>
                        ) : (
                          <div>
                            <span className={`px-2.5 py-1 rounded text-xs font-bold border ${roleDef.badgeColor}`}>
                              {roleDef.name}
                            </span>
                            <p className="text-[10px] text-slate-500 font-mono mt-1">{u.trainingRole}</p>
                          </div>
                        )}
                      </td>

                      {/* Column 4: 4D Scope */}
                      <td className="p-3">
                        {isAdminOrMentor ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 w-10">Study:</span>
                              <select
                                value={u.studyScope}
                                onChange={(e) => handleInlineScopeChange(u, 'studyScope', e.target.value)}
                                className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-[11px] font-mono"
                              >
                                <option value="ALL">ALL Studies</option>
                                {studies.map(st => (
                                  <option key={st.id} value={st.id}>
                                    {st.id} ({st.protocolNumber})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 w-10">Site:</span>
                              <select
                                value={u.siteScope}
                                onChange={(e) => handleInlineScopeChange(u, 'siteScope', e.target.value)}
                                className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-[11px] font-mono max-w-[190px] truncate"
                              >
                                <option value="ALL">ALL Sites in Study</option>
                                {allSitesList.map(siteName => (
                                  <option key={siteName} value={siteName}>
                                    {siteName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div className="font-mono text-[11px]">
                            <p className="font-bold text-slate-800">Study: {u.studyScope}</p>
                            <p className="text-slate-600">Country: {u.countryScope}</p>
                            <p className="text-blue-700 truncate max-w-[180px]">Site: {u.siteScope}</p>
                          </div>
                        )}
                      </td>

                      {/* Column 5: Permissions Badges */}
                      <td className="p-3 text-center">
                        <div className="flex flex-wrap justify-center gap-1 max-w-[200px] mx-auto">
                          {perms.view && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[9px] font-mono">View</span>}
                          {perms.download && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[9px] font-mono">Download</span>}
                          {perms.upload && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[9px] font-mono">Upload</span>}
                          {perms.editMetadata && <span className="px-1.5 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded text-[9px] font-mono">Metadata</span>}
                          {perms.review && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-mono">QC/Review</span>}
                          {perms.part11Sign && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded text-[9px] font-mono font-bold">Part11 Sign</span>}
                          {perms.delete && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-[9px] font-mono font-bold">Delete</span>}
                          {perms.admin && <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[9px] font-mono font-bold">ADMIN</span>}
                        </div>
                      </td>

                      {/* Column 6: Status */}
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            u.isActive !== false
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive !== false ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                          {u.isActive !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      {/* Column 7: Admin Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              switchUserPersona(u.id);
                              showToast(`Switched active session into ${u.name} (${u.title})`);
                            }}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-blue-700 border border-sky-200 rounded text-[11px] font-semibold cursor-pointer"
                            title="Test / Impersonate this User Account"
                          >
                            Switch To
                          </button>

                          {isAdminOrMentor && (
                            <>
                              <button
                                onClick={() => setEditingUser({ ...u })}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 cursor-pointer"
                                title="Edit Credentials / Password / Scope"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={async () => {
                                  const res = await toggleUserActiveStatus(u.id);
                                  if (res.success) {
                                    showToast(`Toggled account status for ${u.name}.`);
                                  }
                                }}
                                className={`p-1.5 rounded border cursor-pointer ${
                                  u.isActive !== false
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                                }`}
                                title={u.isActive !== false ? 'Deactivate Account' : 'Activate Account'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>

                              {isSystemAdmin && u.loginId !== 'admin@clinidea.in' && (
                                <button
                                  onClick={async () => {
                                    const res = await deleteUserCredential(u.id);
                                    if (res.success) {
                                      showToast(`Deleted credential ${u.loginId}.`);
                                    }
                                  }}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded border border-rose-200 cursor-pointer"
                                  title="Delete User Credential"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: 6-ROTATION SCHEDULE ENGINE */}
      {activeTab === 'rotations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Clinidea Education — 12-Week Student Role Rotation Schedule (Rotations 1 to 6)
              </h2>
              <p className="text-[11px] text-slate-500">
                Click &quot;Apply Rotation&quot; to automatically assign the exact roles and scopes for all 6 students for that 2-week block.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-clinevo-table-header text-white font-bold text-[11px]">
                  <th className="p-3">Rotation</th>
                  <th className="p-3">Weeks</th>
                  <th className="p-3">Shweta Pagare</th>
                  <th className="p-3">Sanjay Pawar</th>
                  <th className="p-3">Somesh Patidar</th>
                  <th className="p-3">Gourish Chouksey</th>
                  <th className="p-3">Shubham Sharnagat</th>
                  <th className="p-3">Mary Vismaya</th>
                  <th className="p-3">Main Learning Objective</th>
                  <th className="p-3 text-right">Execute Rotation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rotationSchedule.map(rot => (
                  <tr key={rot.rotation} className="hover:bg-sky-50/60">
                    <td className="p-3 font-bold text-blue-800">{rot.rotation}</td>
                    <td className="p-3 font-mono font-semibold text-slate-700">{rot.weeks}</td>
                    <td className="p-3 font-semibold text-slate-900">{rot.assignments.usr_shweta.label}</td>
                    <td className="p-3 font-semibold text-slate-900">{rot.assignments.usr_sanjay.label}</td>
                    <td className="p-3 font-semibold text-slate-900">{rot.assignments.usr_somesh.label}</td>
                    <td className="p-3 font-semibold text-slate-900">{rot.assignments.usr_gourish.label}</td>
                    <td className="p-3 font-semibold text-slate-900">{rot.assignments.usr_shubham.label}</td>
                    <td className="p-3 font-semibold text-slate-900">{rot.assignments.usr_mary.label}</td>
                    <td className="p-3 text-[11px] text-slate-600 max-w-xs">{rot.objective}</td>
                    <td className="p-3 text-right">
                      {isAdminOrMentor && (
                        <button
                          onClick={() => handleApplyRotation(rot.rotation)}
                          className="px-3 py-1.5 bg-clinevo-blue hover:bg-blue-700 text-white font-bold rounded shadow-xs cursor-pointer whitespace-nowrap"
                        >
                          Apply {rot.rotation}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER PERMISSION REFERENCE MATRIX */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              CLINIDEA EDUCATION — eTMF MASTER ROLE PERMISSION REFERENCE
            </h2>
            <p className="text-[11px] text-slate-500">
              Students receive only the access needed for their current rotation. Founder (Tushar Patil) holds full System Administrator privileges.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-clinevo-table-header text-white font-bold text-[11px]">
                  <th className="p-3">Role</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3 text-center">View</th>
                  <th className="p-3 text-center">Download</th>
                  <th className="p-3 text-center">Upload</th>
                  <th className="p-3 text-center">Edit Metadata</th>
                  <th className="p-3 text-center">QC / Review</th>
                  <th className="p-3 text-center">Part 11 Sign</th>
                  <th className="p-3 text-center">Delete</th>
                  <th className="p-3 text-center">Admin</th>
                  <th className="p-3">Recommended Scope</th>
                  <th className="p-3">Use in Clinidea Training</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rolesList.map(r => {
                  const p = r.permissions || {};
                  const renderYesNo = (val, isLimited = false) =>
                    isLimited ? (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Limited</span>
                    ) : val ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Yes</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[10px]">No</span>
                    );

                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{r.name}</td>
                      <td className="p-3 text-slate-600">{r.purpose}</td>
                      <td className="p-3 text-center">{renderYesNo(p.view)}</td>
                      <td className="p-3 text-center">{renderYesNo(p.download)}</td>
                      <td className="p-3 text-center">{renderYesNo(p.upload, r.id === 'tmf_lead_trainee')}</td>
                      <td className="p-3 text-center">{renderYesNo(p.editMetadata, r.id === 'tmf_lead_trainee')}</td>
                      <td className="p-3 text-center">{renderYesNo(p.review)}</td>
                      <td className="p-3 text-center">{renderYesNo(p.part11Sign)}</td>
                      <td className="p-3 text-center">{renderYesNo(p.delete)}</td>
                      <td className="p-3 text-center">{renderYesNo(p.admin)}</td>
                      <td className="p-3 font-mono text-[11px] text-blue-800">{r.recommendedScope}</td>
                      <td className="p-3 font-semibold text-slate-700">{r.trainingUse}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: 11-POINT SETUP & GOVERNANCE CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Clinidea Education — eTMF Implementation & Supervision Checklist
            </h2>
            <p className="text-[11px] text-slate-500">
              Joint operational checklist for Founder/Admin (Tushar Patil) and Clinical Research Mentor (Sukriti Singh).
            </p>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-clinevo-table-header text-white font-bold text-[11px]">
                <th className="p-3">No.</th>
                <th className="p-3">Setup Item</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Status</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {setupChecklist.map((item, idx) => (
                <tr key={item.no} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-700">{item.no}</td>
                  <td className="p-3 font-bold text-slate-900">{item.item}</td>
                  <td className="p-3 font-semibold text-blue-800">{item.owner}</td>
                  <td className="p-3">
                    <select
                      value={item.status}
                      onChange={(e) => {
                        const next = [...setupChecklist];
                        next[idx].status = e.target.value;
                        setSetupChecklist(next);
                      }}
                      className={`px-2.5 py-1 rounded font-bold text-[11px] border cursor-pointer ${
                        item.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : item.status === 'Active' || item.status === 'In Progress'
                          ? 'bg-sky-100 text-sky-800 border-sky-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      <option value="Completed">Completed</option>
                      <option value="Active">Active</option>
                      <option value="In Progress">In Progress</option>
                      <option value="To Do">To Do</option>
                    </select>
                  </td>
                  <td className="p-3 text-slate-600">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: CREATE NEW USER CREDENTIAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-clinevo-blue text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Create New Clinidea eTMF Credential
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Verma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Position</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  >
                    <option value="Student">Student</option>
                    <option value="Clinical Research Trainer / Mentor">Trainer / Mentor</option>
                    <option value="Founder / Admin">Founder / Admin</option>
                    <option value="Auditor">Auditor / Inspector</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login ID (@clinidea.in) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Rahul.Verma@clinidea.in"
                    value={formData.loginId}
                    onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Rahul@9876543210"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Personal Email</label>
                  <input
                    type="email"
                    placeholder="student@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Registered Course</label>
                <input
                  type="text"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">eTMF Role *</label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2 py-1.5"
                  >
                    {rolesList.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Study Scope</label>
                  <select
                    value={formData.studyScope}
                    onChange={(e) => setFormData({ ...formData, studyScope: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2 py-1.5"
                  >
                    <option value="CLIN-001">CLIN-001 (QVJ499)</option>
                    <option value="CARD-002">CARD-002 (BP Study)</option>
                    <option value="ALL">ALL Studies</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Site Scope</label>
                  <select
                    value={formData.siteScope}
                    onChange={(e) => setFormData({ ...formData, siteScope: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2 py-1.5"
                  >
                    <option value="ALL">ALL Sites</option>
                    {allSitesList.map(sName => (
                      <option key={sName} value={sName}>
                        {sName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-clinevo-blue hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Create Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER CREDENTIAL & ROLE */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" /> Edit User Credential & Role — {editingUser.name}
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login ID</label>
                  <input
                    type="text"
                    value={editingUser.loginId}
                    onChange={(e) => setEditingUser({ ...editingUser, loginId: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="text"
                    value={editingUser.password}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono text-emerald-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={editingUser.mobile || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, mobile: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned eTMF Role</label>
                <select
                  value={editingUser.roleId}
                  onChange={(e) => setEditingUser({ ...editingUser, roleId: e.target.value })}
                  className="w-full border border-blue-400 rounded px-3 py-1.5 font-bold text-slate-900"
                >
                  {rolesList.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Study Scope</label>
                  <select
                    value={editingUser.studyScope}
                    onChange={(e) => setEditingUser({ ...editingUser, studyScope: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  >
                    <option value="ALL">ALL Studies</option>
                    <option value="CLIN-001">CLIN-001 (CE-QVJ499-2026-001)</option>
                    <option value="CARD-002">CARD-002 (CE-CVR-2025-001)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Site Scope</label>
                  <select
                    value={editingUser.siteScope}
                    onChange={(e) => setEditingUser({ ...editingUser, siteScope: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  >
                    <option value="ALL">ALL Sites</option>
                    {allSitesList.map(sName => (
                      <option key={sName} value={sName}>
                        {sName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
