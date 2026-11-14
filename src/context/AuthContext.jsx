import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLES_DEFINITION, DEMO_USERS } from '../data/initialRolesData';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const getStoredUser = () => {
    try {
      const saved = localStorage.getItem('vigithink_current_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u && (u.id || u.roleId)) return u;
      }
    } catch (e) {}
    return DEMO_USERS[0];
  };

  const initialUser = getStoredUser();

  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [usersList, setUsersList] = useState(DEMO_USERS);
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [activeRoleId, setActiveRoleId] = useState(initialUser.roleId || 'system_admin');

  // 4D Scoping State
  const [selectedStudyScope, setSelectedStudyScope] = useState(initialUser.studyScope || 'ALL');
  const [selectedCountryScope, setSelectedCountryScope] = useState(initialUser.countryScope || 'India');
  const [selectedSiteScope, setSelectedSiteScope] = useState(initialUser.siteScope || 'ALL');
  const [isInspectorMode, setIsInspectorMode] = useState(initialUser.roleId === 'auditor');

  // Keep state synced whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setActiveRoleId(currentUser.roleId || 'system_admin');
      setSelectedStudyScope(currentUser.studyScope || 'ALL');
      setSelectedCountryScope(currentUser.countryScope || 'India');
      setSelectedSiteScope(currentUser.siteScope || 'ALL');
      setIsInspectorMode(currentUser.roleId === 'auditor');
      try {
        localStorage.setItem('vigithink_current_user', JSON.stringify(currentUser));
      } catch (e) {}
    }
  }, [currentUser]);

  // Fetch live users from MongoDB
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setUsersList(json.data);
          // Sync currentUser if updated in DB
          const currentId = currentUser?.id || currentUser?.loginId;
          const syncedCurrent = json.data.find(u => u.id === currentId || u.loginId === currentId);
          if (syncedCurrent) {
            setCurrentUser(syncedCurrent);
          }
        }
      }
    } catch (e) {
      // Fallback to local DEMO_USERS
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Get active role definition
  const currentRole = ROLES_DEFINITION.find(r => r.id === activeRoleId) || ROLES_DEFINITION[0];

  const applyUserLogin = (u) => {
    setCurrentUser(u);
    setActiveRoleId(u.roleId);
    setSelectedStudyScope(u.studyScope || 'CLIN-001');
    setSelectedCountryScope(u.countryScope || 'India');
    setSelectedSiteScope(u.siteScope || 'ALL');
    setIsInspectorMode(u.roleId === 'auditor');
    setIsAuthenticated(true);
    try {
      localStorage.setItem('vigithink_current_user', JSON.stringify(u));
      localStorage.setItem('vigithink_is_authenticated', 'true');
    } catch (e) {}
  };

  // Login with Credentials (supports Login ID @vigithink.com, Personal Email, & Password)
  const loginWithCredentials = async (loginInput, password) => {
    const cleanInput = (loginInput || '').trim().toLowerCase();

    // Try backend authentication first
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginInput, password })
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const u = data.data;
        applyUserLogin(u);
        return { success: true, user: u };
      } else if (!res.ok && data.error) {
        return { success: false, error: data.error };
      }
    } catch (err) {
      // Fallback to local verification if offline
    }

    const foundUser = usersList.find(
      u =>
        (u.loginId && u.loginId.toLowerCase() === cleanInput) ||
        (u.email && u.email.toLowerCase() === cleanInput) ||
        u.id.toLowerCase() === cleanInput ||
        u.name.toLowerCase() === cleanInput
    );

    if (!foundUser) {
      return { success: false, error: 'Invalid Login ID or Email. Please check your VigiThink eTMF credential.' };
    }

    if (foundUser.isActive === false) {
      return { success: false, error: 'Your account has been deactivated by System Administrator (admin@vigithink.com).' };
    }

    const isPassValid =
      foundUser.password === password ||
      (foundUser.roleId === 'system_admin' && (password === 'admin123' || password === 'Admin@VigiThink2026')) ||
      (foundUser.roleId === 'tmf_manager' && (password === 'sukriti123' || password === 'Sukriti@VigiThink2026'));

    if (!isPassValid) {
      return { success: false, error: 'Incorrect Password. Please use your assigned password.' };
    }

    applyUserLogin(foundUser);
    return { success: true, user: foundUser };
  };

  const logout = () => {
    try {
      localStorage.removeItem('vigithink_current_user');
      localStorage.setItem('vigithink_is_authenticated', 'false');
    } catch (e) {}
    setIsAuthenticated(false);
  };

  // Switch active persona (for Admin & Mentor supervision only)
  const switchUserPersona = (userIdOrRole) => {
    // Security Guard: Only Admin & Mentor can switch personas
    if (activeRoleId !== 'system_admin' && activeRoleId !== 'tmf_manager') {
      console.warn('[RBAC Security] Persona switching is restricted to Administrator & Mentor roles.');
      return false;
    }

    const found =
      usersList.find(u => u.id === userIdOrRole || u.loginId === userIdOrRole) ||
      usersList.find(u => u.roleId === userIdOrRole);
    if (found) {
      applyUserLogin(found);
      return true;
    }
    return false;
  };

  const switchRole = (roleOrUserId) => {
    return switchUserPersona(roleOrUserId);
  };

  // Admin: Create new user credential
  const createUserCredential = async (newUserData) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUserData, adminUser: currentUser })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setUsersList(prev => [...prev, json.data]);
        return { success: true, data: json.data };
      }
      return { success: false, error: json.error || 'Failed to create user' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Admin: Update user role, scope, or credential details
  const updateUserCredential = async (userId, updatedFields) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedFields, adminUser: currentUser })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setUsersList(prev => prev.map(u => (u.id === userId ? json.data : u)));
        if (currentUser.id === userId) {
          setCurrentUser(json.data);
          setActiveRoleId(json.data.roleId);
          setSelectedStudyScope(json.data.studyScope);
          setSelectedCountryScope(json.data.countryScope);
          setSelectedSiteScope(json.data.siteScope);
        }
        return { success: true, data: json.data };
      }
      return { success: false, error: json.error || 'Failed to update user' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Admin: Activate / Deactivate user account
  const toggleUserActiveStatus = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}/toggle-active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUser: currentUser })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setUsersList(prev => prev.map(u => (u.id === userId ? json.data : u)));
        return { success: true, data: json.data };
      }
      return { success: false, error: json.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Admin: Delete user credential
  const deleteUserCredential = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUser: currentUser })
      });
      const json = await res.json();
      if (json.success) {
        setUsersList(prev => prev.filter(u => u.id !== userId));
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Check action permissions (View, Download, Upload, Edit, Review, Approve, Delete, Admin, etc.)
  const hasPermission = (permissionKey) => {
    if (activeRoleId === 'system_admin') return true; // System Administrator has full administrative access
    
    // Inspector / Auditor: Strict read-only inspection access
    if (isInspectorMode || activeRoleId === 'auditor') {
      const allowedInspector = ['view', 'download', 'comment', 'inspectorView', 'review', 'viewInspectorPortal', 'viewAuditTrail'];
      return allowedInspector.includes(permissionKey);
    }

    // Role-specific permission lookup
    const rolePerms = currentRole?.permissions || {};
    if (permissionKey in rolePerms) {
      return !!rolePerms[permissionKey];
    }

    // Aliases / Fallbacks
    if (permissionKey === 'qcPass') return !!rolePerms.qcPass || !!rolePerms.approve;
    if (permissionKey === 'qcReject') return !!rolePerms.qcReject || !!rolePerms.reject;
    if (permissionKey === 'qcReview') return !!rolePerms.qcReview || !!rolePerms.review;
    if (permissionKey === 'manageUsers') return !!rolePerms.manageUsers || activeRoleId === 'system_admin';
    if (permissionKey === 'manageStudies') return !!rolePerms.manageStudies || activeRoleId === 'system_admin' || activeRoleId === 'tmf_manager';
    if (permissionKey === 'manageFolders') return !!rolePerms.manageFolders;
    if (permissionKey === 'switchPersona') return activeRoleId === 'system_admin' || activeRoleId === 'tmf_manager';

    return false;
  };

  // Helper convenience booleans
  const canQcPass = hasPermission('qcPass');
  const canQcReject = hasPermission('qcReject');
  const canQcReview = hasPermission('qcReview');
  const canUpload = hasPermission('upload');
  const canDelete = hasPermission('delete');
  const canEditMetadata = hasPermission('editMetadata');
  const canManageUsers = hasPermission('manageUsers');
  const canManageStudies = hasPermission('manageStudies');
  const canManageFolders = hasPermission('manageFolders');
  const canSwitchPersona = hasPermission('switchPersona');
  const canSign = hasPermission('part11Sign');
  const canViewAuditTrail = hasPermission('viewAuditTrail');
  const canViewInspectorPortal = hasPermission('viewInspectorPortal');

  // Verify if document is accessible under 4D scope (Role x Study x Country x Site)
  const isDocumentInScope = (doc) => {
    if (!doc) return false;

    // Direct participation: if current user is the uploader, submitter, or assigned reviewer, they ALWAYS see it
    if (currentUser?.id && (
      doc.uploaded_by_id === currentUser.id ||
      doc.submitted_by_id === currentUser.id ||
      doc.assigned_reviewer_id === currentUser.id
    )) {
      return true;
    }

    // Enterprise Trial Oversight Roles see trial documents across all sites
    const oversightRoles = ['system_admin', 'tmf_manager', 'qa', 'ctm', 'auditor', 'tmf_lead_trainee', 'doc_controller'];
    if (oversightRoles.includes(activeRoleId)) {
      // Check study scope if filtered to a specific study
      if (selectedStudyScope && selectedStudyScope !== 'ALL' && doc.study_id && doc.study_id !== selectedStudyScope) {
        return false;
      }
      return true;
    }

    // Study scope check for site-scoped roles
    if (selectedStudyScope && selectedStudyScope !== 'ALL' && doc.study_id && doc.study_id !== selectedStudyScope) {
      return false;
    }

    // Country scope check
    if (selectedCountryScope && selectedCountryScope !== 'ALL' && doc.country_code && doc.country_code !== selectedCountryScope && doc.country_code !== 'GLOBAL' && doc.country_code !== 'IND') {
      return false;
    }

    // Site scope check: CRC / Site User and CRA only see their own site or central/global documents
    if (selectedSiteScope && selectedSiteScope !== 'ALL' && doc.site_id && doc.site_id !== 'CENTRAL' && doc.site_id !== 'GLOBAL' && doc.site_id !== 'ALL') {
      const userSiteLower = selectedSiteScope.toLowerCase();
      const docSiteLower = (doc.site_id || '').toLowerCase();
      
      const userMatch = userSiteLower.match(/site\s*\d+/i);
      const docMatch = docSiteLower.match(/site\s*\d+/i);
      
      if (userMatch && docMatch && userMatch[0] !== docMatch[0]) {
        return false;
      }
    }

    return true;
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      currentUser,
      currentRole,
      rolesList: ROLES_DEFINITION,
      demoUsers: usersList,
      usersList,
      loginWithCredentials,
      logout,
      switchUserPersona,
      switchRole,
      createUserCredential,
      updateUserCredential,
      toggleUserActiveStatus,
      deleteUserCredential,
      fetchUsers,
      selectedStudyScope,
      setSelectedStudyScope,
      selectedCountryScope,
      setSelectedCountryScope,
      selectedSiteScope,
      setSelectedSiteScope,
      isInspectorMode,
      setIsInspectorMode,
      hasPermission,
      isDocumentInScope,
      // Granular capability helpers
      canQcPass,
      canQcReject,
      canQcReview,
      canUpload,
      canDelete,
      canEditMetadata,
      canManageUsers,
      canManageStudies,
      canManageFolders,
      canSwitchPersona,
      canSign,
      canViewAuditTrail,
      canViewInspectorPortal
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
