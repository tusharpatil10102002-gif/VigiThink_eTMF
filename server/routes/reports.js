import express from 'express';
import { Document } from '../models/Document.js';
import { Study } from '../models/Study.js';
import { AuditLog } from '../models/AuditLog.js';

const router = express.Router();

// GET /api/reports/completeness - Calculate completeness by study & zone
router.get('/completeness', async (req, res) => {
  try {
    const { study_id = 'CLIN-001' } = req.query;
    const docs = await Document.find({ study_id });

    const total = docs.length;
    const completed = docs.filter(d => d.status === 'Effective' || d.status === 'Approved').length;
    const inProgress = docs.filter(d => d.status === 'Draft' || d.status === 'In Review').length;
    const inQc = docs.filter(d => d.qc_status === 'In Progress' || d.qc_status === 'Query Raised').length;
    const missing = docs.filter(d => d.status === 'Placeholder' || d.is_placeholder).length;
    const expected = total > 0 ? total + 15 : 100;

    res.json({
      success: true,
      data: {
        study_id,
        total,
        completed,
        inProgress,
        inQc,
        missing,
        expected,
        completenessPct: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/copy-logs - Copy history from audit trail
router.get('/copy-logs', async (req, res) => {
  try {
    const copyLogs = await AuditLog.find({
      $or: [
        { action: 'DOCUMENT_UPLOADED' },
        { action: 'METADATA_UPDATED' }
      ]
    }).limit(20);

    const formatted = copyLogs.map((log, idx) => ({
      id: log.target_id,
      version: 1,
      source: `Study > CM Folder > ${log.study_id} > Central Documents`,
      target: `Study > CM Folder > ${log.study_id} > Sites > ${log.target_title}`,
      copiedOn: log.timestamp.replace('T', ' ').substring(0, 19),
      copiedBy: log.user_name
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
