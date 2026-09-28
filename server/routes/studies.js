import express from 'express';
import { Study } from '../models/Study.js';
import { Document } from '../models/Document.js';
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

// POST /api/studies - Create new study
router.post('/', async (req, res) => {
  try {
    const newStudy = new Study(req.body);
    const saved = await newStudy.save();

    // Audit log
    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: req.body.user?.id || 'sys_user',
      user_name: req.body.user?.name || 'Clinidea User',
      user_role: req.body.user?.roleId || 'System Admin',
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
      user_id: req.body.user?.id || 'sys_user',
      user_name: req.body.user?.name || 'Clinidea User',
      user_role: req.body.user?.roleId || 'TMF Manager',
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

// POST /api/studies/:id/site - Add clinical trial site to country
router.post('/:id/site', async (req, res) => {
  try {
    const study = await Study.findOne({ id: req.params.id });
    if (!study) {
      return res.status(404).json({ success: false, error: 'Study not found' });
    }

    const { countryId, site } = req.body;
    const targetCountry = study.countries.find(c => c.id === countryId || c.code === countryId);
    if (!targetCountry) {
      return res.status(404).json({ success: false, error: 'Country not found in study' });
    }

    targetCountry.sites.push(site);
    const updated = await study.save();

    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: req.body.user?.id || 'sys_user',
      user_name: req.body.user?.name || 'Clinidea User',
      user_role: req.body.user?.roleId || 'CRA',
      action: 'SITE_ADDED',
      target_type: 'SITE',
      target_id: site.id || site.number,
      target_title: `Site ${site.number} — ${site.name} (PI: ${site.piName})`,
      study_id: study.id,
      reason: `Site ${site.number} added under country ${targetCountry.name}`
    });
    await auditRecord.save();

    res.status(201).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/studies/:id/archive - Study Close-Out & Archiving
router.put('/:id/archive', async (req, res) => {
  try {
    const study = await Study.findOne({ id: req.params.id });
    if (!study) {
      return res.status(404).json({ success: false, error: 'Study not found' });
    }

    study.status = 'Archived';
    const updated = await study.save();

    // Lock all documents in this study as Read-Only Archived
    await Document.updateMany(
      { study_id: study.id },
      { status: 'Effective', checkout_status: 'Checked In', locked_by_user_id: null }
    );

    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: req.body.user?.id || 'sys_user',
      user_name: req.body.user?.name || 'Clinidea User',
      user_role: req.body.user?.roleId || 'QA Auditor',
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

// DELETE /api/studies/:id - Delete a study and its associated documents (System Admin)
router.delete('/:id', async (req, res) => {
  try {
    const studyId = req.params.id;
    const study = await Study.findOneAndDelete({ id: studyId });
    await Document.deleteMany({ study_id: studyId });

    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: req.body?.user?.id || 'usr_tushar_admin',
      user_name: req.body?.user?.name || 'Tushar Patil (Admin)',
      user_role: req.body?.user?.role || req.body?.user?.roleId || 'system_admin',
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

