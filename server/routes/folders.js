import express from 'express';
import { Folder } from '../models/Folder.js';
import { Study } from '../models/Study.js';
import { AuditLog } from '../models/AuditLog.js';

const router = express.Router();

const logFolderAudit = async (req, action, folder, oldVal, newVal, reason) => {
  try {
    const user = req.body?.user || {};
    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: user.id || req.headers['x-user-id'] || 'sys_user',
      user_name: user.name || req.headers['x-user-name'] || 'VigiThink User',
      user_role: user.roleId || req.headers['x-user-role'] || 'TMF User',
      action,
      target_type: 'FOLDER',
      target_id: folder.id,
      target_title: folder.name,
      study_id: folder.study_id || '',
      old_value: oldVal || 'N/A',
      new_value: newVal || 'N/A',
      ip_address: req.ip || '127.0.0.1',
      reason: reason || 'Custom folder operation'
    });
    await auditRecord.save();
  } catch (err) {
    console.error('[FolderAudit] Error:', err);
  }
};

// GET /api/folders - List all custom folders
router.get('/', async (req, res) => {
  try {
    const { study_id } = req.query;
    const filter = {};
    if (study_id && study_id !== 'ALL') {
      filter.$or = [{ study_id }, { study_id: 'ALL' }];
    }
    const folders = await Folder.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: folders.length, data: folders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/folders - Create a new custom folder
router.post('/', async (req, res) => {
  try {
    const { id, name, study_id, tmf_zone_id, tmf_section_id, site_id, user } = req.body;
    const userRole = user?.roleId || user?.role || req.headers['x-user-role'];

    // RBAC Security Guard: Only TMF Lead, CTM, Doc Controller & Admin can manage folders
    const unauthorizedFolderRoles = ['site_user', 'investigator', 'cra', 'auditor', 'qa'];
    if (userRole && unauthorizedFolderRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Role '${userRole}' is not authorized to create custom folders in the eTMF structure.`
      });
    }

    // Protocol Precondition Guard: A Clinical Study Protocol must exist before creating custom folders
    const totalStudies = await Study.countDocuments();
    if (totalStudies === 0) {
      return res.status(422).json({
        success: false,
        error: 'Clinical Protocol Required: No active clinical study found. A clinical study protocol must be created by the System Administrator before custom folders can be added to the eTMF structure.'
      });
    }

    if (study_id && study_id !== 'ALL') {
      const targetStudy = await Study.findOne({ id: study_id });
      if (!targetStudy) {
        return res.status(404).json({
          success: false,
          error: `Clinical Study Protocol '${study_id}' does not exist.`
        });
      }
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Folder name is required' });
    }

    const folderId = id || `fld_${Date.now()}`;
    const newFolder = new Folder({
      id: folderId,
      name: name.trim(),
      study_id: study_id || 'ALL',
      tmf_zone_id: tmf_zone_id || null,
      tmf_section_id: tmf_section_id || null,
      site_id: site_id || null,
      created_by_id: user?.id || 'sys_user',
      created_by: user?.name || 'TMF User',
      created_by_role: user?.title || user?.roleId || 'Authorized User',
      created_at: new Date().toISOString().split('T')[0]
    });

    const saved = await newFolder.save();
    await logFolderAudit(req, 'FOLDER_CREATED', saved, 'None', `Folder: ${saved.name}`, `Created custom folder in ${saved.tmf_zone_id ? `Zone ${saved.tmf_zone_id}` : 'Study Root'}`);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/folders/:id - Rename custom folder
router.put('/:id', async (req, res) => {
  try {
    const { name, user } = req.body;
    const userRole = user?.roleId || user?.role || req.headers['x-user-role'];

    const unauthorizedFolderRoles = ['site_user', 'investigator', 'cra', 'auditor', 'qa'];
    if (userRole && unauthorizedFolderRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Role '${userRole}' cannot rename eTMF folders.`
      });
    }

    const folder = await Folder.findOne({ id: req.params.id });
    if (!folder) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }

    const oldName = folder.name;
    folder.name = (name || folder.name).trim();
    const updated = await folder.save();

    await logFolderAudit(req, 'FOLDER_RENAMED', updated, oldName, updated.name, 'User renamed custom folder');
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/folders/:id - Delete custom folder
router.delete('/:id', async (req, res) => {
  try {
    const user = req.body?.user ? (typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body.user) : {};
    const userRole = user?.roleId || user?.role || req.headers['x-user-role'];

    const unauthorizedFolderRoles = ['site_user', 'investigator', 'cra', 'auditor', 'qa'];
    if (userRole && unauthorizedFolderRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Role '${userRole}' cannot delete eTMF folders.`
      });
    }

    const folder = await Folder.findOne({ id: req.params.id });
    if (!folder) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }

    await Folder.deleteOne({ id: req.params.id });
    await logFolderAudit(req, 'FOLDER_DELETED', folder, folder.name, 'DELETED', 'User deleted custom folder');
    res.json({ success: true, message: `Folder ${folder.name} deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
