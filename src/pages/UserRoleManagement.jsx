import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTMFData } from '../context/TMFDataContext';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Edit3,
  Trash2,
  Power,
  CheckCircle2,
  Download,
  Lock,
  Building,
  ShieldAlert,
  FileKey,
  Database,
  History,
  FileCheck,
  Clock,
  X
} from 'lucide-react';

export default function UserRoleManagement() {
  const {
    currentUser,
    rolesList,
    usersList,
    createUserCredential,
    updateUserCredential,
    toggleUserActiveStatus,
    deleteUserCredential,
    switchUserPersona
  } = useAuth();

  const { studies } = useTMFData();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'permissions' | 'security'
  const [bannerMessage, setBannerMessage] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const isAdminOrMentor = currentUser?.roleId === 'system_admin' || currentUser?.roleId === 'tmf_manager';
  const isSystemAdmin = currentUser?.roleId === 'system_admin';

  // Form state for Create User
  const [formData, setFormData] = useState({
    name: '',
    loginId: '',
    email: '',
    password: '',
    mobile: '',
    department: 'Clinical Operations',
    position: 'Clinical Research Associate',
    roleId: 'cra',
    studyScope: 'ALL',
    countryScope: 'India',
    siteScope: 'ALL'
  });

  const showToast = (msg) => {
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(''), 5000);
  };

  // Inline Role Change Handler
  const handleInlineRoleChange = async (user, newRoleId) => {
    const roleObj = rolesList.find(r => r.id === newRoleId);
    const newSiteScope =
      newRoleId === 'cra' || newRoleId === 'site_user' || newRoleId === 'investigator'
        ? user.assignedSite || (studies[0]?.sites?.[0]?.name ? `${studies[0].sites[0].number || 'Site 001'} - ${studies[0].sites[0].name}` : 'ALL')
        : 'ALL';

    const res = await updateUserCredential(user.id, {
      roleId: newRoleId,
      title: roleObj?.name || newRoleId,
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
        department: 'Clinical Operations',
        position: 'Clinical Research Associate',
        roleId: 'cra',
        studyScope: 'ALL',
        countryScope: 'India',
        siteScope: 'ALL'
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

  // Export Users & Credentials CSV
  const handleExportCredentialsCsv = () => {
    const headers = [
      'User Name',
      'Position',
      'Department',
      'Login ID',
      'Personal Email',
      'Password Security',
      'Mobile Number',
      'Active eTMF Role',
      'Study Scope',
      'Country Scope',
      'Site Scope',
      'Account Status'
    ];
    const rows = usersList.map(u => [
      `"${u.name}"`,
      `"${u.position || u.title || ''}"`,
      `"${u.department || 'Clinical Operations'}"`,
      `"${u.loginId}"`,
      `"${u.email}"`,
      `"[PROTECTED / BCRYPT ENCRYPTED]"`,
      `"${u.mobile || ''}"`,
      `"${u.title || u.roleId}"`,
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
    link.setAttribute('download', 'VigiThink_eTMF_User_Access_Governance.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allSitesList = Array.from(
    new Set([
      ...studies.flatMap(s => (s.sites || []).map(st => `${st.number || st.id} - ${st.name}`)),
      ...studies.flatMap(s => (s.countries || []).flatMap(c => (c.sites || []).map(st => `${st.number || st.id} - ${st.name}`)))
    ])
  ).filter(Boolean);

  const getSitesForStudy = (studyId) => {
    if (!studyId || studyId === 'ALL') {
      return allSitesList;
    }
    const target = studies.find(s => s.id === studyId);
    if (!target) return allSitesList;
    const sites = [
      ...(target.sites || []).map(st => `${st.number || st.id} - ${st.name}`),
      ...(target.countries || []).flatMap(c => (c.sites || []).map(st => `${st.number || st.id} - ${st.name}`))
    ];
    const unique = Array.from(new Set(sites)).filter(Boolean);
    return unique.length > 0 ? unique : allSitesList;
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full text-xs font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h1 className="text-base font-extrabold tracking-wide">
              VIGITHINK eTMF: USER ACCESS &amp; GOVERNANCE CENTER
            </h1>
          </div>
          <p className="text-xs text-slate-300 font-mono">
            Logged in as: <span className="text-emerald-300 font-bold">{currentUser?.name}</span> ({currentUser?.loginId}) | Active Role:{' '}
            <span className="text-sky-300 font-bold">{currentUser?.title || currentUser?.roleId}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCredentialsCsv}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-300" /> Export Governance Manifest (CSV)
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
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> 1. User &amp; Personnel Directory ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'permissions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" /> 2. Master Role Permission Matrix ({rolesList.length} Roles)
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 3. System Security &amp; Access Governance
        </button>
      </div>

      {/* TAB 1: USER DIRECTORY & LIVE ROLE ASSIGNMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Active User Accounts &amp; Role-Based Access Scopes
              </h2>
              <p className="text-[11px] text-slate-500">
                Enterprise RBAC controls: System Administrator can update eTMF roles, study scopes, facility bindings, or active account status.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#132E52] text-white font-bold text-[11px] uppercase">
                  <th className="p-3">User &amp; Department</th>
                  <th className="p-3">Login ID &amp; Credential Security</th>
                  <th className="p-3">Assigned eTMF Role</th>
                  <th className="p-3">Assigned 4D Scope (Study / Site)</th>
                  <th className="p-3 text-center">Permissions Summary</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {usersList.map(u => {
                  const roleDef = rolesList.find(r => r.id === u.roleId) || rolesList[0];
                  const perms = roleDef.permissions || {};

                  return (
                    <tr key={u.id} className={`hover:bg-sky-50/50 transition-colors ${u.isActive === false ? 'bg-rose-50/30 opacity-70' : ''}`}>
                      {/* Column 1: User & Position Info */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{u.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-mono">
                            {u.position || u.title || 'Staff'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">Email: {u.email}</p>
                        <p className="text-[10px] text-blue-800 font-semibold mt-0.5">
                          Department: {u.department || 'Clinical Operations'}
                        </p>
                      </td>

                      {/* Column 2: Login ID & Credential Security */}
                      <td className="p-3 font-mono">
                        <p className="text-blue-900 font-bold text-[11px]">{u.loginId}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-mono font-medium flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            bcrypt hashed
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Role Selector */}
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
                            <p className="text-[10px] text-slate-500 font-mono">{roleDef.category || 'Operational Scope'}</p>
                          </div>
                        ) : (
                          <div>
                            <span className={`px-2.5 py-1 rounded text-xs font-bold border ${roleDef.badgeColor}`}>
                              {roleDef.name}
                            </span>
                            <p className="text-[10px] text-slate-500 font-mono mt-1">{roleDef.category}</p>
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
                                value={u.studyScope || 'ALL'}
                                onChange={(e) => handleInlineScopeChange(u, 'studyScope', e.target.value)}
                                className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-[11px] font-mono"
                              >
                                <option value="ALL">ALL Studies</option>
                                {studies.map(st => (
                                  <option key={st.id} value={st.id}>
                                    {st.id} ({st.protocolNumber || st.shortName})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 w-10">Site:</span>
                              <select
                                value={u.siteScope || 'ALL'}
                                onChange={(e) => handleInlineScopeChange(u, 'siteScope', e.target.value)}
                                className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-[11px] font-mono max-w-[190px] truncate"
                              >
                                <option value="ALL">ALL Sites</option>
                                {getSitesForStudy(u.studyScope).map(siteName => (
                                  <option key={siteName} value={siteName}>
                                    {siteName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div className="font-mono text-[11px]">
                            <p className="font-bold text-slate-800">Study: {u.studyScope || 'ALL'}</p>
                            <p className="text-slate-600">Country: {u.countryScope || 'India'}</p>
                            <p className="text-blue-700 truncate max-w-[180px]">Site: {u.siteScope || 'ALL'}</p>
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

                      {/* Column 7: Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              switchUserPersona(u.id);
                              showToast(`Switched active session into ${u.name} (${u.title || u.roleId})`);
                            }}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-blue-700 border border-sky-200 rounded text-[11px] font-semibold cursor-pointer"
                            title="Test / Switch Active Session to this User"
                          >
                            Switch To
                          </button>

                          {isAdminOrMentor && (
                            <>
                              <button
                                onClick={() => setEditingUser({ ...u })}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 cursor-pointer"
                                title="Edit User Credentials & Scope"
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

                              {isSystemAdmin && u.loginId !== 'admin@vigithink.com' && (
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

      {/* TAB 2: MASTER PERMISSION MATRIX */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              eTMF Master Role Permission &amp; Governance Matrix
            </h2>
            <p className="text-[11px] text-slate-500">
              System access is governed by strictly defined privileges aligned with regulatory compliance (ICH GCP, 21 CFR Part 11, and DIA TMF Model v3.1).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#132E52] text-white font-bold text-[11px]">
                  <th className="p-3">Role</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Regulatory Purpose</th>
                  <th className="p-3 text-center">View</th>
                  <th className="p-3 text-center">Download</th>
                  <th className="p-3 text-center">Upload</th>
                  <th className="p-3 text-center">Edit Metadata</th>
                  <th className="p-3 text-center">QC / Review</th>
                  <th className="p-3 text-center">Part 11 Sign</th>
                  <th className="p-3 text-center">Delete</th>
                  <th className="p-3 text-center">Admin</th>
                  <th className="p-3">Recommended Scope</th>
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
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{r.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{r.id}</span>
                      </td>
                      <td className="p-3 font-semibold text-blue-900">{r.department || r.category}</td>
                      <td className="p-3 text-slate-600 max-w-xs">{r.purpose}</td>
                      <td className="p-3 text-center">{renderYesNo(p.view)}</td>
                      <td className="p-3 text-center">{renderYesNo(p.download)}</td>
                      <td className="p-3 text-center">{renderYesNo(p.upload, r.id === 'tmf_lead_trainee')}</td>
                      <td className="p-3 text-center">{renderYesNo(p.editMetadata, r.id === 'tmf_lead_trainee')}</td>
                      <td className="p-3 text-center">{renderYesNo(p.review)}</td>
                      <td className="p-3 text-center">{renderYesNo(p.part11Sign)}</td>
                      <td className="p-3 text-center">{renderYesNo(p.delete)}</td>
                      <td className="p-3 text-center">{renderYesNo(p.admin)}</td>
                      <td className="p-3 font-mono text-[11px] text-blue-800">{r.recommendedScope}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM SECURITY & ACCESS GOVERNANCE */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Enterprise Security &amp; Regulatory Compliance Architecture
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              VigiThink eTMF implements defense-in-depth security, strict separation of duties, and statutory compliance controls required by 21 CFR Part 11 and ICH GCP E6(R2/R3).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: 21 CFR Part 11 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-purple-700">
                <FileKey className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-xs">21 CFR Part 11 E-Signature Mandate</h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Dual-factor authentication required for electronic sign-offs. The signature manifest records the signer&apos;s full name, role, timestamp (UTC), IP address, and regulatory reason for signing, establishing non-repudiation.
              </p>
              <div className="bg-purple-50 p-2.5 rounded border border-purple-200 text-[10px] font-mono text-purple-900">
                Standard: 21 CFR §11.50 &amp; §11.70
              </div>
            </div>

            {/* Card 2: Password & Inactivity Policy */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-blue-700">
                <Clock className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-xs">Session &amp; Credential Security</h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                All passwords are encrypted using one-way bcrypt salted hashing (10 rounds). User sessions automatically lock after 15 minutes of inactivity to prevent unauthorized terminal access.
              </p>
              <div className="bg-blue-50 p-2.5 rounded border border-blue-200 text-[10px] font-mono text-blue-900">
                Timeout: 15 Minutes Idle | Bcrypt Salting
              </div>
            </div>

            {/* Card 3: 25-Year Retention Lock */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-700">
                <Database className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-xs">Statutory 25-Year Retention Lock</h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Archived clinical studies enter a permanent write-once, read-many (WORM) lock state. Essential trial documentation is preserved immutably for the statutory 25-year post-closeout inspection window.
              </p>
              <div className="bg-emerald-50 p-2.5 rounded border border-emerald-200 text-[10px] font-mono text-emerald-900">
                Regulation: EU CTR 536/2014 &amp; ICH GCP §8.1
              </div>
            </div>

            {/* Card 4: Append-Only Audit Trail */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-700">
                <History className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-xs">Immutable Audit Trail</h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Every action (including document ingestion, metadata modification, version increment, QC status change, and user role updates) is recorded in an append-only transaction ledger with zero deletion privileges.
              </p>
              <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-[10px] font-mono text-amber-900">
                Compliance: 21 CFR §11.10(e) Append-Only
              </div>
            </div>

            {/* Card 5: Separation of Duties */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-xs">Separation of Duties (SoD)</h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Strict functional segregation prevents conflicts of interest. Document uploaders cannot execute their own QC clearance; only qualified TMF Leads or QA Specialists can pass quality gates.
              </p>
              <div className="bg-rose-50 p-2.5 rounded border border-rose-200 text-[10px] font-mono text-rose-900">
                Control: Segregated QC Inspection Gate
              </div>
            </div>

            {/* Card 6: Least-Privilege 4D Scoping */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-700">
                <FileCheck className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-xs">Least-Privilege 4D Scoping</h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                User access is partitioned across four dimensions: Study Protocol, Country Authority, Investigational Site, and DIA Zone. Site coordinators and PIs only view and submit records for their assigned facility.
              </p>
              <div className="bg-indigo-50 p-2.5 rounded border border-indigo-200 text-[10px] font-mono text-indigo-900">
                Dimensions: Protocol · Country · Site · Zone
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE NEW USER CREDENTIAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-[#132E52] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Create New VigiThink eTMF User
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
                    placeholder="e.g. Dr. Rajesh Rao, MD"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  >
                    <option value="Clinical Operations">Clinical Operations</option>
                    <option value="Clinical Monitoring">Clinical Monitoring</option>
                    <option value="Investigational Site Staff">Investigational Site Staff</option>
                    <option value="Medical Affairs">Medical Affairs</option>
                    <option value="Quality Assurance & Regulatory">Quality Assurance &amp; Regulatory</option>
                    <option value="Information Technology">Information Technology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login ID (@vigithink.com) *</label>
                  <input
                    type="text"
                    required
                    placeholder="rajesh.rao@vigithink.com"
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
                    placeholder="Rajesh@VigiThink2026"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Business Email</label>
                  <input
                    type="email"
                    placeholder="rajesh.rao@hospital.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile / Phone</label>
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
                <label className="block font-bold text-slate-700 mb-1">Position / Job Designation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Principal Investigator, Senior CRA, CRC, CTM"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
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
                    <option value="ALL">ALL Studies</option>
                    {studies.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.id} ({s.shortName || s.title?.substring(0, 25)})
                      </option>
                    ))}
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
                    {getSitesForStudy(formData.studyScope).map(sName => (
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
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Create User Account
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
                <Edit3 className="w-4 h-4 text-emerald-400" /> Edit User Credential &amp; Role: {editingUser.name}
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
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={editingUser.department || 'Clinical Operations'}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  >
                    <option value="Clinical Operations">Clinical Operations</option>
                    <option value="Clinical Monitoring">Clinical Monitoring</option>
                    <option value="Investigational Site Staff">Investigational Site Staff</option>
                    <option value="Medical Affairs">Medical Affairs</option>
                    <option value="Quality Assurance & Regulatory">Quality Assurance &amp; Regulatory</option>
                    <option value="Information Technology">Information Technology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login ID</label>
                  <input
                    type="text"
                    value={editingUser.loginId}
                    onChange={(e) => setEditingUser({ ...editingUser, loginId: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="text"
                    value={editingUser.password}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono text-emerald-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Position / Job Title</label>
                  <input
                    type="text"
                    value={editingUser.position || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, position: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 font-semibold text-slate-800"
                  />
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Study Scope</label>
                  <select
                    value={editingUser.studyScope || 'ALL'}
                    onChange={(e) => setEditingUser({ ...editingUser, studyScope: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  >
                    <option value="ALL">ALL Studies</option>
                    {studies.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.id} ({s.shortName || s.title?.substring(0, 25)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Site Scope</label>
                  <select
                    value={editingUser.siteScope || 'ALL'}
                    onChange={(e) => setEditingUser({ ...editingUser, siteScope: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  >
                    <option value="ALL">ALL Sites</option>
                    {getSitesForStudy(editingUser.studyScope).map(sName => (
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
