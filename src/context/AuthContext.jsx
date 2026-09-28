import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLES_DEFINITION, DEMO_USERS, ROTATION_SCHEDULE, INITIAL_SETUP_CHECKLIST } from '../data/initialRolesData';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [usersList, setUsersList] = useState(DEMO_USERS);
  const [currentUser, setCurrentUser] = useState(DEMO_USERS[0]); // Default: Tushar Patil (admin@clinidea.in)
  const [activeRoleId, setActiveRoleId] = useState(DEMO_USERS[0].roleId);
  const [setupChecklist, setSetupChecklist] = useState(INITIAL_SETUP_CHECKLIST);

  // 4D Scoping State
  const [selectedStudyScope, setSelectedStudyScope] = useState(DEMO_USERS[0].studyScope);
  const [selectedCountryScope, setSelectedCountryScope] = useState(DEMO_USERS[0].countryScope);
  const [selectedSiteScope, setSelectedSiteScope] = useState(DEMO_USERS[0].siteScope);
  const [isInspectorMode, setIsInspectorMode] = useState(false);

  // Fetch live users from MongoDB
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setUsersList(json.data);
          // Sync currentUser if updated in DB
          const syncedCurrent = json.data.find(u => u.id === currentUser.id || u.loginId === currentUser.loginId);
          if (syncedCurrent) {
            setCurrentUser(syncedCurrent);
            setActiveRoleId(syncedCurrent.roleId);
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

  // Login with Credentials (supports Login ID @clinidea.in, Personal Email @gmail.com, & Password)
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
        setCurrentUser(u);
        setActiveRoleId(u.roleId);
        setSelectedStudyScope(u.studyScope || 'CLIN-001');
        setSelectedCountryScope(u.countryScope || 'India');
        setSelectedSiteScope(u.siteScope || 'ALL');
        setIsInspectorMode(u.roleId === 'auditor');
        setIsAuthenticated(true);
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
      return { success: false, error: 'Invalid Login ID or Email. Please check your Clinidea Education credential.' };
    }

    if (foundUser.isActive === false) {
      return { success: false, error: 'Your account has been deactivated by System Administrator (admin@clinidea.in).' };
    }

    const isPassValid =
      foundUser.password === password ||
      (foundUser.roleId === 'system_admin' && (password === 'admin123' || password === 'Admin@Clinidea2026')) ||
      (foundUser.roleId === 'tmf_manager' && (password === 'sukriti123' || password === 'Sukriti@Clinidea2026'));

    if (!isPassValid) {
      return { success: false, error: 'Incorrect Password. Please use your assigned password.' };
    }

    setCurrentUser(foundUser);
    setActiveRoleId(foundUser.roleId);
    setSelectedStudyScope(foundUser.studyScope || 'CLIN-001');
    setSelectedCountryScope(foundUser.countryScope || 'India');
    setSelectedSiteScope(foundUser.siteScope || 'ALL');
    setIsInspectorMode(foundUser.roleId === 'auditor');
    setIsAuthenticated(true);
    return { success: true, user: foundUser };
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  // Switch active persona (for quick testing / supervision)
  const switchUserPersona = (userIdOrRole) => {
    const found =
      usersList.find(u => u.id === userIdOrRole || u.loginId === userIdOrRole) ||
      usersList.find(u => u.roleId === userIdOrRole);
    if (found) {
      setCurrentUser(found);
      setActiveRoleId(found.roleId);
      setSelectedStudyScope(found.studyScope || 'CLIN-001');
      setSelectedCountryScope(found.countryScope || 'India');
      setSelectedSiteScope(found.siteScope || 'ALL');
      setIsInspectorMode(found.roleId === 'auditor');
      setIsAuthenticated(true);
    }
  };

  const switchRole = (roleOrUserId) => {
    switchUserPersona(roleOrUserId);
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

  // Admin / Mentor: Apply Rotation 1 to 6 across all 6 students
  const applyStudentRotation = async (rotationName) => {
    try {
      const res = await fetch('/api/users/apply-rotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rotationName, adminUser: currentUser })
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUsersList(json.data);
        const updatedCurrent = json.data.find(u => u.id === currentUser.id);
        if (updatedCurrent) {
          setCurrentUser(updatedCurrent);
          setActiveRoleId(updatedCurrent.roleId);
          setSelectedSiteScope(updatedCurrent.siteScope);
        }
        return { success: true, message: json.message };
      }
      return { success: false, error: json.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Check action permissions (View, Download, Upload, Edit, Review, Approve, Delete, Admin)
  const hasPermission = (permissionKey) => {
    if (activeRoleId === 'system_admin') return true; // Admin (Tushar Patil) has full access to everything
    if (isInspectorMode || activeRoleId === 'auditor') {
      if (permissionKey === 'view' || permissionKey === 'download' || permissionKey === 'comment' || permissionKey === 'inspectorView' || permissionKey === 'review') return true;
      return false;
    }
    return !!currentRole?.permissions?.[permissionKey];
  };

  // Verify if document is accessible under 4D scope (Role x Study x Country x Site)
  const isDocumentInScope = (doc) => {
    if (!doc) return false;
    if (activeRoleId === 'system_admin' || activeRoleId === 'tmf_manager') return true;

    if (selectedStudyScope !== 'ALL' && doc.study_id !== selectedStudyScope) return false;
    if (selectedCountryScope !== 'ALL' && doc.country_code !== selectedCountryScope && doc.country_code !== 'GLOBAL' && doc.country_code !== 'IND') return false;
    if (selectedSiteScope !== 'ALL' && doc.site_id !== selectedSiteScope && doc.site_id !== 'CENTRAL' && doc.site_id !== 'GLOBAL') return false;
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
      rotationSchedule: ROTATION_SCHEDULE,
      setupChecklist,
      setSetupChecklist,
      loginWithCredentials,
      logout,
      switchUserPersona,
      switchRole,
      createUserCredential,
      updateUserCredential,
      toggleUserActiveStatus,
      deleteUserCredential,
      applyStudentRotation,
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
      isDocumentInScope
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
