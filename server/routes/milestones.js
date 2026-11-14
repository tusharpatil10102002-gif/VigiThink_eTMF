import express from 'express';
import { Milestone } from '../models/Milestone.js';
import { Study } from '../models/Study.js';
import { AuditLog } from '../models/AuditLog.js';

const router = express.Router();

// GET /api/milestones - Fetch milestones by study
router.get('/', async (req, res) => {
  try {
    const { study_id } = req.query;
    const filter = study_id ? { study_id } : {};
    const milestones = await Milestone.find(filter).sort({ seq: 1 });
    res.json({ success: true, count: milestones.length, data: milestones });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/milestones/:id - Update milestone planned/actual date
router.put('/:id', async (req, res) => {
  try {
    const milestone = await Milestone.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!milestone) {
      return res.status(404).json({ success: false, error: 'Milestone not found' });
    }

    // Audit log
    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: req.body.user?.id || 'sys_user',
      user_name: req.body.user?.name || 'VigiThink User',
      user_role: req.body.user?.roleId || 'TMF Lead',
      action: 'MILESTONE_UPDATED',
      target_type: 'MILESTONE',
      target_id: milestone._id.toString(),
      target_title: milestone.milestone,
      study_id: milestone.study_id,
      new_value: JSON.stringify({ planned: milestone.planned, actual: milestone.actual }),
      reason: 'Trial milestone schedule update'
    });
    await auditRecord.save();

    res.json({ success: true, data: milestone });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/milestones - Create / import milestones
router.post('/', async (req, res) => {
  try {
    const totalStudies = await Study.countDocuments();
    if (totalStudies === 0) {
      return res.status(422).json({
        success: false,
        error: 'Clinical Protocol Required: No active clinical study found. A clinical study protocol must exist before milestones can be configured.'
      });
    }

    const studyId = req.body.study_id;
    if (studyId) {
      const targetStudy = await Study.findOne({ id: studyId });
      if (!targetStudy) {
        return res.status(404).json({
          success: false,
          error: `Clinical Study Protocol '${studyId}' does not exist.`
        });
      }
    }

    const milestone = new Milestone(req.body);
    const saved = await milestone.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
