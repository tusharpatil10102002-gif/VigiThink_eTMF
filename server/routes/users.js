import express from 'express';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { ROLES_DEFINITION, ROTATION_SCHEDULE } from '../../src/data/initialRolesData.js';

const router = express.Router();

const logUserAudit = async (adminUser, action, targetId, targetTitle, oldVal, newVal, reason) => {
  try {
    const log = new AuditLog({
      id: `aud_usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: adminUser?.id || 'usr_tushar_admin',
      user_name: adminUser?.name || 'Tushar Patil (Admin)',
      user_role: adminUser?.roleId || 'system_admin',
      action,
      target_type: 'USER_RBAC',
      target_id: targetId,
      target_title: targetTitle,
      study_id: 'GLOBAL',
      old_value: oldVal || 'N/A',
      new_value: newVal || 'N/A',
      reason: reason || 'RBAC / User Credential Governance Action'
    });
    await log.save();
  } catch (e) {
    console.error('[AuditLog Error]', e);
  }
};

// 1. GET /api/users — List all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: 1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST /api/users/login — Authenticate user by Login ID / Email & Password
router.post('/login', async (req, res) => {
  try {
    const { loginInput, password } = req.body;
    if (!loginInput) {
      return res.status(400).json({ success: false, error: 'Please enter Login ID or Email.' });
    }

    const cleanInput = loginInput.trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { loginId: { $regex: new RegExp(`^${cleanInput}$`, 'i') } },
        { email: { $regex: new RegExp(`^${cleanInput}$`, 'i') } },
        { id: cleanInput },
        { name: { $regex: new RegExp(`^${cleanInput}$`, 'i') } }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid Login ID / Email. User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated by the System Administrator (admin@clinidea.in).'
      });
    }

    // Verify password (allow exact password or master training pin for admin convenience)
    const isPasswordValid =
      user.password === password ||
      (user.roleId === 'system_admin' && (password === 'admin123' || password === 'Admin@Clinidea2026' || password === 'admin@clinidea.in')) ||
      (user.roleId === 'tmf_manager' && (password === 'sukriti123' || password === 'Sukriti@Clinidea2026'));

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Incorrect password. Please check your assigned credential.' });
    }

    await logUserAudit(
      user,
      'USER_LOGIN_SUCCESS',
      user.loginId,
      `${user.name} (${user.title})`,
      'Logged Out',
      `Logged In as ${user.roleId}`,
      'Authenticated into Clinidea VigiThink eTMF'
    );

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/users — Create new user credential (Admin Only)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      loginId,
      email,
      password,
      mobile,
      course,
      position,
      roleId,
      trainingRole,
      studyScope,
      countryScope,
      siteScope,
      assignedSite,
      primaryResponsibility,
      adminUser
    } = req.body;

    if (!name || !loginId || !password) {
      return res.status(400).json({ success: false, error: 'Name, Login ID, and Password are required.' });
    }

    const roleObj = ROLES_DEFINITION.find(r => r.id === (roleId || 'cra')) || ROLES_DEFINITION[3];
    const newId = `usr_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

    const newUser = new User({
      id: newId,
      name,
      loginId: loginId.trim(),
      email: (email || loginId).trim(),
      password: password.trim(),
      mobile: mobile || '',
      course: course || 'Clinical Research & Pharmacovigilance',
      position: position || 'Student',
      roleId: roleObj.id,
      trainingRole: trainingRole || `${roleObj.name} – Rotation 1`,
      organization: 'Clinidea Education',
      title: roleObj.name,
      studyScope: studyScope || roleObj.scopeDefaults.study || 'CLIN-001',
      countryScope: countryScope || roleObj.scopeDefaults.country || 'India',
      siteScope: siteScope || roleObj.scopeDefaults.site || 'ALL',
      assignedSite: assignedSite || siteScope || 'ALL',
      primaryResponsibility: primaryResponsibility || roleObj.description,
      accessPrinciple: roleObj.id === 'system_admin' ? 'Full administrative access' : 'Least privilege; role-based access',
      isActive: true
    });

    const saved = await newUser.save();

    await logUserAudit(
      adminUser,
      'USER_CREDENTIAL_CREATED',
      saved.loginId,
      `${saved.name} (${saved.title})`,
      'None',
      `Role: ${saved.roleId} | Scope: ${saved.studyScope} / ${saved.siteScope}`,
      'Created new user credential in eTMF RBAC'
    );

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. PUT /api/users/:id — Update user role, scope, password, or details (Admin can change anyone's role)
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const oldRole = user.roleId;
    const {
      name,
      loginId,
      email,
      password,
      mobile,
      course,
      position,
      roleId,
      trainingRole,
      studyScope,
      countryScope,
      siteScope,
      assignedSite,
      primaryResponsibility,
      isActive,
      adminUser
    } = req.body;

    if (name !== undefined) user.name = name;
    if (loginId !== undefined) user.loginId = loginId;
    if (email !== undefined) user.email = email;
    if (password !== undefined && password.trim() !== '') user.password = password.trim();
    if (mobile !== undefined) user.mobile = mobile;
    if (course !== undefined) user.course = course;
    if (position !== undefined) user.position = position;

    if (roleId !== undefined) {
      const roleObj = ROLES_DEFINITION.find(r => r.id === roleId);
      user.roleId = roleId;
      if (roleObj) {
        user.title = roleObj.name;
        if (!trainingRole) {
          user.trainingRole = `${roleObj.name}`;
        }
      }
    }

    if (trainingRole !== undefined) user.trainingRole = trainingRole;
    if (studyScope !== undefined) user.studyScope = studyScope;
    if (countryScope !== undefined) user.countryScope = countryScope;
    if (siteScope !== undefined) user.siteScope = siteScope;
    if (assignedSite !== undefined) user.assignedSite = assignedSite;
    if (primaryResponsibility !== undefined) user.primaryResponsibility = primaryResponsibility;
    if (isActive !== undefined) user.isActive = isActive;

    const updated = await user.save();

    await logUserAudit(
      adminUser,
      oldRole !== updated.roleId ? 'USER_ROLE_CHANGED' : 'USER_CREDENTIAL_UPDATED',
      updated.loginId,
      `${updated.name}`,
      `Role: ${oldRole}`,
      `Role: ${updated.roleId} | Scope: ${updated.studyScope}/${updated.siteScope} | Active: ${updated.isActive}`,
      `Administrator updated user role/credentials`
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. PUT /api/users/:id/toggle-active — Activate / Deactivate user credential
router.put('/:id/toggle-active', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    user.isActive = !user.isActive;
    const saved = await user.save();

    await logUserAudit(
      req.body.adminUser,
      saved.isActive ? 'USER_ACCOUNT_ACTIVATED' : 'USER_ACCOUNT_DEACTIVATED',
      saved.loginId,
      saved.name,
      `Active: ${!saved.isActive}`,
      `Active: ${saved.isActive}`,
      `User account status toggled by System Administrator`
    );

    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. DELETE /api/users/:id — Delete user credential
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (user.loginId === 'admin@clinidea.in') {
      return res.status(400).json({ success: false, error: 'Cannot delete the primary Founder / System Administrator account.' });
    }

    await User.deleteOne({ id: req.params.id });

    await logUserAudit(
      req.body?.adminUser,
      'USER_CREDENTIAL_DELETED',
      user.loginId,
      user.name,
      `Role: ${user.roleId}`,
      'DELETED',
      'User credential permanently removed by System Administrator'
    );

    res.json({ success: true, message: `User ${user.name} (${user.loginId}) deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. POST /api/users/apply-rotation — Apply Rotation 1 to 6 across all 6 students
router.post('/apply-rotation', async (req, res) => {
  try {
    const { rotationName, adminUser } = req.body;
    const rotObj = ROTATION_SCHEDULE.find(r => r.rotation === rotationName);
    if (!rotObj) {
      return res.status(400).json({ success: false, error: 'Invalid rotation selected.' });
    }

    const updatedUsers = [];
    for (const [userId, assignment] of Object.entries(rotObj.assignments)) {
      const user = await User.findOne({ id: userId });
      if (user) {
        const roleDef = ROLES_DEFINITION.find(r => r.id === assignment.roleId);
        user.roleId = assignment.roleId;
        user.title = roleDef ? roleDef.name : assignment.label;
        user.trainingRole = `${assignment.label} – ${rotObj.rotation} (${rotObj.weeks})`;
        // Scope adjustment based on role
        if (assignment.roleId === 'cra' || assignment.roleId === 'site_user') {
          user.siteScope = user.assignedSite || 'Site 001 - AIIMS RPC Eye Centre, New Delhi';
        } else {
          user.siteScope = 'ALL';
        }
        await user.save();
        updatedUsers.push(user);
      }
    }

    await logUserAudit(
      adminUser,
      'ROTATION_MATRIX_APPLIED',
      rotObj.rotation,
      `${rotObj.rotation} (${rotObj.weeks})`,
      'Previous Rotation',
      `Applied ${rotObj.rotation}: ${rotObj.objective}`,
      `Batch role rotation executed for 6 students`
    );

    const allUsers = await User.find({}).sort({ createdAt: 1 });
    res.json({
      success: true,
      message: `${rotObj.rotation} (${rotObj.weeks}) applied successfully to all 6 students!`,
      data: allUsers
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
