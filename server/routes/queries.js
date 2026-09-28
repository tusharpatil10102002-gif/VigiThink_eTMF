import express from 'express';
import { Query } from '../models/Query.js';
import { Document } from '../models/Document.js';
import { AuditLog } from '../models/AuditLog.js';

const router = express.Router();

// GET /api/queries - Get all quality queries
router.get('/', async (req, res) => {
  try {
    const { study_id, status } = req.query;
    const filter = {};
    if (study_id && study_id !== 'ALL') filter.study_id = study_id;
    if (status && status !== 'ALL') filter.status = status;

    const queries = await Query.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: queries.length, data: queries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/queries - Raise a new quality query
router.post('/', async (req, res) => {
  try {
    const queryId = req.body.query_id || `QRY-${Date.now().toString().substring(6)}`;
    const query = new Query({
      ...req.body,
      query_id: queryId,
      study_id: req.body.study_id || 'CLIN-001',
      issue_type: req.body.issue_type || 'Quality / ALCOA+ Query',
      comment: req.body.comment || 'Quality review query raised for remediation.',
      raised_by_id: req.body.raised_by_id || 'usr_qc',
      raised_by_name: req.body.raised_by_name || 'QC Reviewer',
      raised_date: req.body.raised_date || new Date().toISOString().split('T')[0],
      status: 'Open'
    });
    const saved = await query.save();

    // Also flag document in Document model
    await Document.findOneAndUpdate(
      { document_id: req.body.document_id },
      { 
        qc_status: 'Query Raised',
        qc_score: 'Red',
        qc_comments: req.body.comment || 'Quality query raised.',
        quality_issue_flag: true,
        quality_issue_type: req.body.issue_type || 'Quality / ALCOA+ Query'
      }
    );

    // Audit log
    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: req.body.raised_by_id || 'usr_qc',
      user_name: req.body.raised_by_name || 'QC Reviewer',
      user_role: 'QC Reviewer',
      action: 'QUERY_RAISED',
      target_type: 'DOCUMENT',
      target_id: req.body.document_id,
      target_title: `Query (${queryId}): ${req.body.issue_type || 'Quality Query'}`,
      study_id: req.body.study_id || 'CLIN-001',
      reason: req.body.comment || 'Quality query raised'
    });
    await auditRecord.save();

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/queries/:id/resolve - Resolve query
router.put('/:id/resolve', async (req, res) => {
  try {
    const query = await Query.findOne({ query_id: req.params.id });
    if (!query) {
      return res.status(404).json({ success: false, error: 'Query not found' });
    }

    query.status = req.body.status || 'Resolved';
    query.response = req.body.response || 'Resolved and verified by reviewer';
    query.resolved_by_name = req.body.user?.name || 'Reviewer';
    query.resolved_date = new Date().toISOString().split('T')[0];
    const updated = await query.save();

    // Check if other queries exist for this document
    const remainingOpenQueries = await Query.countDocuments({
      document_id: query.document_id,
      status: { $in: ['Open', 'In Progress'] }
    });

    if (remainingOpenQueries === 0) {
      await Document.findOneAndUpdate(
        { document_id: query.document_id },
        { 
          quality_issue_flag: false, 
          qc_status: 'Passed',
          qc_score: 'Green',
          status: 'Approved',
          qc_comments: `Query ${query.query_id} resolved: ${query.response}`
        }
      );
    }

    // Audit log
    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: req.body.user?.id || 'sys_user',
      user_name: req.body.user?.name || 'Reviewer',
      user_role: req.body.user?.roleId || 'Reviewer',
      action: 'QUERY_RESOLVED',
      target_type: 'QUERY',
      target_id: query.query_id,
      target_title: query.issue_type,
      study_id: query.study_id,
      reason: query.response
    });
    await auditRecord.save();

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
