import express from 'express';
import { Study } from '../models/Study.js';
import { User } from '../models/User.js';
import { Document } from '../models/Document.js';
import { Query } from '../models/Query.js';
import { AuditLog } from '../models/AuditLog.js';

const router = express.Router();

// GET /api/studies - List all clinical studies
router.get('/', async (req, res) => {
  try {
    const studies = await Study.find().sort({ createdAt: -1 });
    res.json({ success: true, count: studies.length, data: studies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/studies/:id - Get study with zone completeness metrics
router.get('/:id', async (req, res) => {
  try {
    const study = await Study.findOne({ id: req.params.id });
    if (!study) {
      return res.status(404).json({ success: false, error: 'Study not found' });
    }

    const docs = await Document.find({ study_id: req.params.id });
    const effectiveDocs = docs.filter(d => d.status === 'Effective' || d.status === 'Approved').length;
    const totalDocs = docs.length || 1;
    const completenessPct = Math.round((effectiveDocs / totalDocs) * 100);

    res.json({
      success: true,
      data: {
        ...study.toObject(),
        totalDocuments: docs.length,
        effectiveDocuments: effectiveDocs,
        calculatedCompletenessPct: completenessPct
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/studies - Create new study (Admin & TMF Manager only)
router.post('/', async (req, res) => {
  try {
    const user = req.body.user ? (typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body.user) : {};
    const userRole = user.roleId || user.role || req.headers['x-user-role'];

    if (userRole && userRole !== 'system_admin' && userRole !== 'tmf_manager') {
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Role '${userRole}' is not authorized to create clinical studies. Privilege restricted to System Administrator & TMF Management.`
      });
    }

    const newStudy = new Study(req.body);
    const saved = await newStudy.save();

    // Audit log
    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: user.id || 'sys_user',
      user_name: user.name || 'VigiThink User',
      user_role: userRole || 'System Admin',
      action: 'STUDY_CREATED',
      target_type: 'STUDY',
      target_id: saved.id,
      target_title: saved.title,
      study_id: saved.id,
      reason: 'New clinical trial protocol initiated in enterprise eTMF'
    });
    await auditRecord.save();

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/studies/:id/country - Add participating country to study
router.post('/:id/country', async (req, res) => {
  try {
    const user = req.body.user ? (typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body.user) : {};
    const userRole = user.roleId || user.role || req.headers['x-user-role'];

    if (userRole && userRole !== 'system_admin' && userRole !== 'tmf_manager') {
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Adding participating countries requires System Administrator or TMF Lead privileges.`
      });
    }

    const study = await Study.findOne({ id: req.params.id });
    if (!study) {
      return res.status(404).json({ success: false, error: 'Study not found' });
    }

    const { country } = req.body;
    study.countries.push(country);
    const updated = await study.save();

    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: user.id || 'sys_user',
      user_name: user.name || 'VigiThink User',
      user_role: userRole || 'TMF Manager',
      action: 'COUNTRY_ADDED',
      target_type: 'STUDY',
      target_id: study.id,
      target_title: `${country.name} (${country.code})`,
      study_id: study.id,
      reason: `Country ${country.name} added to protocol setup`
    });
    await auditRecord.save();

    res.status(201).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/studies/:id/site & /sites - Add clinical trial site to country
router.post(['/:id/site', '/:id/sites'], async (req, res) => {
  try {
    const user = req.body.user ? (typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body.user) : {};
    const userRole = user.roleId || user.role || req.headers['x-user-role'];

    // Only Admin, TMF Manager, and CTM can set up investigator sites
    const allowedSiteSetupRoles = ['system_admin', 'tmf_manager', 'ctm'];
    if (userRole && !allowedSiteSetupRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Role '${userRole}' cannot add trial sites. Site setup is restricted to CTM and TMF Management.`
      });
    }

    const study = await Study.findOne({ id: req.params.id });
    if (!study) {
      return res.status(404).json({ success: false, error: 'Study not found' });
    }

    const { countryId, site } = req.body;
    const targetCountry = study.countries.find(c => c.id === countryId || c.code === countryId);
    if (!targetCountry) {
      return res.status(404).json({ success: false, error: 'Country not found in study' });
    }

    targetCountry.sites = targetCountry.sites || [];
    targetCountry.sites.push(site);

    // Synchronize root study.sites array as well
    study.sites = study.sites || [];
    if (!study.sites.some(s => s.id === (site.id || site.number))) {
      study.sites.push({
        id: site.id || site.number,
        number: site.number || site.id,
        name: site.name,
        country: targetCountry.name || site.country || 'India',
        state: site.state || '',
        city: site.city || '',
        address: site.address || '',
        piName: site.piName || 'Principal Investigator',
        piEmail: site.piEmail || '',
        piContact: site.piContact || '',
        piLicense: site.piLicense || '',
        assignedPiId: site.assignedPiId || null,
        crcName: site.crcName || '',
        crcEmail: site.crcEmail || '',
        assignedCrcId: site.assignedCrcId || null,
        assignedCraId: site.assignedCraId || null,
        assignedCraName: site.assignedCraName || '',
        assignedStudent: site.assignedCraName || site.assignedCraId || '',
        status: site.status || 'Active',
        targetEnrollment: site.targetEnrollment || 20,
        actualEnrollment: site.actualEnrollment || 0,
        enrolledCount: site.enrolledCount || 0,
        activationDate: site.activationDate || new Date().toISOString().split('T')[0],
        completenessPct: site.completenessPct || 0
      });
    }

    study.markModified('countries');
    study.markModified('sites');
    const updated = await study.save();

    // Auto-sync assigned user scopes to this study and site
    const siteScopeName = `${site.number || site.id} - ${site.name}`;
    if (site.assignedPiId && site.assignedPiId !== 'manual') {
      await User.findOneAndUpdate(
        { $or: [{ id: site.assignedPiId }, { loginId: site.assignedPiId }] },
        { studyScope: study.id, siteScope: siteScopeName, roleId: 'investigator' }
      );
    }
    if (site.assignedCrcId && site.assignedCrcId !== 'manual') {
      await User.findOneAndUpdate(
        { $or: [{ id: site.assignedCrcId }, { loginId: site.assignedCrcId }] },
        { studyScope: study.id, siteScope: siteScopeName, roleId: 'site_user' }
      );
    }
    if (site.assignedCraId && site.assignedCraId !== 'manual') {
      await User.findOneAndUpdate(
        { $or: [{ id: site.assignedCraId }, { loginId: site.assignedCraId }] },
        { studyScope: study.id, siteScope: siteScopeName, roleId: 'cra' }
      );
    }

    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: user.id || 'sys_user',
      user_name: user.name || 'VigiThink User',
      user_role: userRole || 'Study Management',
      action: 'SITE_ADDED',
      target_type: 'SITE',
      target_id: site.id || site.number,
      target_title: `Site ${site.number}: ${site.name} (PI: ${site.piName})`,
      study_id: study.id,
      reason: `Site ${site.number} added under country ${targetCountry.name}`
    });
    await auditRecord.save();

    res.status(201).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/studies/:id/status - Update Study Lifecycle State (Planning -> Setup -> Activation -> Conduct -> Closeout -> Archived)
router.put('/:id/status', async (req, res) => {
  try {
    const user = req.body.user ? (typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body.user) : {};
    const userRole = user.roleId || user.role || req.headers['x-user-role'];

    const allowedRoles = ['system_admin', 'tmf_manager', 'ctm'];
    if (userRole && !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Role '${userRole}' is not authorized to modify study lifecycle state. Permitted roles: System Administrator, TMF Lead, Clinical Trial Manager (CTM).`
      });
    }

    const { status, reason } = req.body;
    const ALLOWED_STATUSES = ['Planning', 'Setup', 'Activation', 'Conduct', 'Closeout', 'Archived'];
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status '${status}'. Permitted lifecycle states: ${ALLOWED_STATUSES.join(', ')}`
      });
    }

    const study = await Study.findOne({ id: req.params.id });
    if (!study) {
      return res.status(404).json({ success: false, error: 'Study not found' });
    }

    const oldStatus = study.status;
    study.status = status;
    const updated = await study.save();

    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: user.id || 'sys_user',
      user_name: user.name || 'VigiThink User',
      user_role: userRole || 'CTM',
      action: 'STUDY_STATUS_CHANGED',
      target_type: 'STUDY',
      target_id: study.id,
      target_title: study.title,
      study_id: study.id,
      old_value: oldStatus,
      new_value: status,
      reason: reason || `Study lifecycle state advanced from ${oldStatus} to ${status}`
    });
    await auditRecord.save();

    res.json({ success: true, oldStatus, newStatus: status, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/studies/:id/site/:siteId/status - Update Site Lifecycle State
router.put('/:id/site/:siteId/status', async (req, res) => {
  try {
    const user = req.body.user ? (typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body.user) : {};
    const userRole = user.roleId || user.role || req.headers['x-user-role'];

    const allowedRoles = ['system_admin', 'tmf_manager', 'ctm', 'cra'];
    if (userRole && !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Role '${userRole}' cannot transition site lifecycle states. Permitted roles: CTM, CRA, TMF Lead, System Admin.`
      });
    }

    const { status, reason } = req.body;
    const ALLOWED_SITE_STATUSES = [
      'Site Identification',
      'Selection',
      'Initiation',
      'Activation',
      'Ongoing Monitoring',
      'Closeout',
      'Closed',
      'Active'
    ];
    if (!status || !ALLOWED_SITE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid site status '${status}'. Permitted states: ${ALLOWED_SITE_STATUSES.join(', ')}`
      });
    }

    const study = await Study.findOne({ id: req.params.id });
    if (!study) {
      return res.status(404).json({ success: false, error: 'Study not found' });
    }

    let siteFound = false;
    let oldSiteStatus = 'N/A';
    const siteIdParam = req.params.siteId;

    // Search in study.sites
    if (study.sites && Array.isArray(study.sites)) {
      const s = study.sites.find(item => item.id === siteIdParam || item.number === siteIdParam);
      if (s) {
        oldSiteStatus = s.status;
        s.status = status;
        siteFound = true;
      }
    }

    // Search in study.countries[].sites
    if (study.countries && Array.isArray(study.countries)) {
      for (const c of study.countries) {
        if (c.sites && Array.isArray(c.sites)) {
          const s = c.sites.find(item => item.id === siteIdParam || item.number === siteIdParam);
          if (s) {
            oldSiteStatus = s.status;
            s.status = status;
            siteFound = true;
          }
        }
      }
    }

    if (!siteFound) {
      return res.status(404).json({
        success: false,
        error: `Site '${siteIdParam}' was not found in study ${study.id}`
      });
    }

    study.markModified('sites');
    study.markModified('countries');
    const updated = await study.save();

    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: user.id || 'sys_user',
      user_name: user.name || 'VigiThink User',
      user_role: userRole || 'CRA',
      action: 'SITE_STATUS_CHANGED',
      target_type: 'SITE',
      target_id: siteIdParam,
      target_title: `Site ${siteIdParam} in Study ${study.id}`,
      study_id: study.id,
      old_value: oldSiteStatus,
      new_value: status,
      reason: reason || `Site state transitioned to ${status}`
    });
    await auditRecord.save();

    res.json({ success: true, siteId: siteIdParam, oldStatus: oldSiteStatus, newStatus: status, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/studies/:id/sites/:siteId/personnel - Assign or update site personnel (PI, CRC, CRA)
router.put('/:id/sites/:siteId/personnel', async (req, res) => {
  try {
    const user = req.body.user ? (typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body.user) : {};
    const userRole = user.roleId || user.role || req.headers['x-user-role'];

    // Only Admin, TMF Manager, and CTM can assign site personnel
    const allowedAssignmentRoles = ['system_admin', 'tmf_manager', 'ctm'];
    if (userRole && !allowedAssignmentRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Role '${userRole}' cannot re-assign site personnel. Restricted to System Administrator, CTM, and TMF Management.`
      });
    }

    const study = await Study.findOne({ id: req.params.id });
    if (!study) {
      return res.status(404).json({ success: false, error: 'Study not found' });
    }

    const { siteId } = req.params;
    const { 
      piName, piEmail, piContact, piLicense, assignedPiId,
      crcName, crcEmail, assignedCrcId,
      assignedCraId, assignedCraName,
      reason 
    } = req.body;

    let targetSite = null;

    if (study.sites && Array.isArray(study.sites)) {
      const s = study.sites.find(item => item.id === siteId || item.number === siteId);
      if (s) {
        if (piName !== undefined) s.piName = piName;
        if (piEmail !== undefined) s.piEmail = piEmail;
        if (piContact !== undefined) s.piContact = piContact;
        if (piLicense !== undefined) s.piLicense = piLicense;
        if (assignedPiId !== undefined) s.assignedPiId = assignedPiId;
        if (crcName !== undefined) s.crcName = crcName;
        if (crcEmail !== undefined) s.crcEmail = crcEmail;
        if (assignedCrcId !== undefined) s.assignedCrcId = assignedCrcId;
        if (assignedCraId !== undefined) s.assignedCraId = assignedCraId;
        if (assignedCraName !== undefined) {
          s.assignedCraName = assignedCraName;
          s.assignedStudent = assignedCraName;
        }
        targetSite = s;
      }
    }

    if (study.countries && Array.isArray(study.countries)) {
      for (const c of study.countries) {
        if (c.sites && Array.isArray(c.sites)) {
          const s = c.sites.find(item => item.id === siteId || item.number === siteId);
          if (s) {
            if (piName !== undefined) s.piName = piName;
            if (piEmail !== undefined) s.piEmail = piEmail;
            if (piContact !== undefined) s.piContact = piContact;
            if (piLicense !== undefined) s.piLicense = piLicense;
            if (assignedPiId !== undefined) s.assignedPiId = assignedPiId;
            if (crcName !== undefined) s.crcName = crcName;
            if (crcEmail !== undefined) s.crcEmail = crcEmail;
            if (assignedCrcId !== undefined) s.assignedCrcId = assignedCrcId;
            if (assignedCraId !== undefined) s.assignedCraId = assignedCraId;
            if (assignedCraName !== undefined) {
              s.assignedCraName = assignedCraName;
              s.assignedStudent = assignedCraName;
            }
            targetSite = s;
          }
        }
      }
    }

    if (!targetSite) {
      return res.status(404).json({ success: false, error: `Site '${siteId}' not found in study ${study.id}` });
    }

    study.markModified('sites');
    study.markModified('countries');
    const updated = await study.save();

    // Auto-sync assigned user scopes
    const siteScopeName = `${targetSite.number || targetSite.id} - ${targetSite.name}`;
    if (assignedPiId && assignedPiId !== 'manual') {
      await User.findOneAndUpdate(
        { $or: [{ id: assignedPiId }, { loginId: assignedPiId }] },
        { studyScope: study.id, siteScope: siteScopeName, roleId: 'investigator' }
      );
    }
    if (assignedCrcId && assignedCrcId !== 'manual') {
      await User.findOneAndUpdate(
        { $or: [{ id: assignedCrcId }, { loginId: assignedCrcId }] },
        { studyScope: study.id, siteScope: siteScopeName, roleId: 'site_user' }
      );
    }
    if (assignedCraId && assignedCraId !== 'manual') {
      await User.findOneAndUpdate(
        { $or: [{ id: assignedCraId }, { loginId: assignedCraId }] },
        { studyScope: study.id, siteScope: siteScopeName, roleId: 'cra' }
      );
    }

    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: user.id || 'sys_user',
      user_name: user.name || 'VigiThink User',
      user_role: userRole || 'System Administrator',
      action: 'SITE_PERSONNEL_ASSIGNED',
      target_type: 'SITE',
      target_id: siteId,
      target_title: `Site ${siteId} Personnel Update`,
      study_id: study.id,
      new_value: JSON.stringify({ pi: targetSite.piName, crc: targetSite.crcName, cra: targetSite.assignedCraName }),
      reason: reason || 'Admin updated investigational site personnel delegations (PI, CRC, CRA)'
    });
    await auditRecord.save();

    res.json({ success: true, data: updated, site: targetSite });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/studies/:id/closeout-checklist - Update formal closeout checklist
router.put('/:id/closeout-checklist', async (req, res) => {
  try {
    const user = req.body.user ? (typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body.user) : {};
    const userRole = user.roleId || user.role || req.headers['x-user-role'];

    const allowedRoles = ['system_admin', 'tmf_manager', 'ctm', 'qa'];
    if (userRole && !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Updating closeout checklist requires CTM, QA, or TMF Lead privileges.`
      });
    }

    const study = await Study.findOne({ id: req.params.id });
    if (!study) {
      return res.status(404).json({ success: false, error: 'Study not found' });
    }

    const { checklist, notes } = req.body;
    study.closeoutChecklist = {
      ...(study.closeoutChecklist || {}),
      ...(checklist || {}),
      updatedAt: new Date().toISOString(),
      updatedBy: user.name || 'VigiThink User',
      updatedByRole: userRole || 'CTM',
      notes: notes || study.closeoutChecklist?.notes || ''
    };

    study.markModified('closeoutChecklist');
    const updated = await study.save();

    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: user.id || 'sys_user',
      user_name: user.name || 'VigiThink User',
      user_role: userRole || 'CTM',
      action: 'STUDY_CLOSEOUT_CHECKLIST_UPDATED',
      target_type: 'STUDY',
      target_id: study.id,
      target_title: study.title,
      study_id: study.id,
      reason: notes || 'Formal clinical study closeout checklist verified'
    });
    await auditRecord.save();

    res.json({ success: true, data: updated.closeoutChecklist });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/studies/:id/archive - Study Close-Out & Archiving
router.put('/:id/archive', async (req, res) => {
  try {
    const user = req.body.user ? (typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body.user) : {};
    const userRole = user.roleId || user.role || req.headers['x-user-role'];

    const allowedArchiveRoles = ['system_admin', 'tmf_manager', 'qa'];
    if (!userRole || !allowedArchiveRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Study archiving requires System Administrator, QA, or TMF Lead privileges.`
      });
    }

    const study = await Study.findOne({ id: req.params.id });
    if (!study) {
      return res.status(404).json({ success: false, error: 'Study not found' });
    }

    study.status = 'Archived';
    const updated = await study.save();

    // Lock all documents in this study as Read-Only Archived & transition to Stage 11 (Archival)
    const studyDocs = await Document.find({ study_id: study.id });
    const nowIso = new Date().toISOString();
    const archivistName = user?.name || req.headers['x-user-name'] || 'VigiThink User';
    const archivistRole = userRole || 'system_admin';

    for (const d of studyDocs) {
      d.status = 'Effective';
      d.checkout_status = 'Checked In';
      d.locked_by_user_id = null;
      d.lifecycle_stage = 11;
      d.lifecycle_stage_name = '11. Archival';
      d.lifecycle_status = 'Archived (25-Yr Regulatory Lock)';
      if (!d.lifecycle_history) d.lifecycle_history = [];
      d.lifecycle_history.push({
        stage_number: 11,
        stage_name: '11. Archival',
        status: 'Archived (25-Yr Regulatory Lock)',
        actor_name: archivistName,
        actor_role: archivistRole,
        timestamp: nowIso,
        notes: req.body.reason || 'Study close-out completed. 25-year digital TMF regulatory retention lock engaged.'
      });
      await d.save();
    }

    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: user.id || 'sys_user',
      user_name: user.name || 'VigiThink User',
      user_role: userRole || 'QA Auditor',
      action: 'STUDY_ARCHIVED',
      target_type: 'STUDY',
      target_id: study.id,
      target_title: study.title,
      study_id: study.id,
      old_value: 'Active',
      new_value: 'Archived',
      reason: req.body.reason || 'Formal trial completion and digital TMF archiving with 25-year retention lock'
    });
    await auditRecord.save();

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/studies/:id - Delete a study and its associated documents (System Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const user = req.body?.user ? (typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body.user) : {};
    const userRole = user.roleId || user.role || req.headers['x-user-role'];

    if (!userRole || userRole !== 'system_admin') {
      return res.status(403).json({
        success: false,
        error: '403 Forbidden: Only System Administrator has authorization to delete clinical study protocols.'
      });
    }

    const studyId = req.params.id;
    const study = await Study.findOneAndDelete({ id: studyId });
    await Document.deleteMany({ study_id: studyId });
    await Query.deleteMany({ study_id: studyId });

    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: user.id || 'usr_tushar_admin',
      user_name: user.name || 'Tushar Patil (Admin)',
      user_role: userRole || 'system_admin',
      action: 'STUDY_DELETED',
      target_type: 'STUDY',
      target_id: studyId,
      target_title: study?.title || studyId,
      study_id: studyId,
      old_value: study?.status || 'Active',
      new_value: 'DELETED',
      reason: req.body?.reason || 'Study permanently deleted by System Administrator'
    });
    await auditRecord.save();

    res.json({ success: true, deletedId: studyId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

