import express from 'express';
import { AuditLog } from '../models/AuditLog.js';

const router = express.Router();

// GET /api/audit-logs - Query immutable audit trail events
router.get('/', async (req, res) => {
  try {
    const { study_id, target_id, action, limit = 100 } = req.query;
    const filter = {};

    if (study_id && study_id !== 'ALL') filter.study_id = study_id;
    if (target_id) filter.target_id = target_id;
    if (action && action !== 'ALL') filter.action = action;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/audit-logs - Record Part 11 compliant audit log
router.post('/', async (req, res) => {
  try {
    const log = new AuditLog({
      ...req.body,
      id: req.body.id || `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    });
    const saved = await log.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 21 CFR Part 11: Audit trail is strictly immutable. Modification or deletion is legally forbidden.
router.use((req, res, next) => {
  if (['PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(405).json({
      success: false,
      error: '405 Method Not Allowed: 21 CFR Part 11 mandates that electronic audit logs are strictly append-only and cannot be altered or deleted.'
    });
  }
  next();
});

export default router;
