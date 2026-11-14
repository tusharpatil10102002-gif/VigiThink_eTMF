import express from 'express';
import { Query } from '../models/Query.js';
import { Document } from '../models/Document.js';
import { Study } from '../models/Study.js';
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
    const user = req.body.user ? (typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body.user) : {};
    const userRole = user.roleId || user.role || req.headers['x-user-role'];

    // RBAC Security Guard: Site User (CRC), Investigator (PI), CRA, and Auditor cannot raise formal sponsor queries
    if (userRole === 'site_user' || userRole === 'investigator' || userRole === 'cra' || userRole === 'auditor') {
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Role '${userRole}' is not authorized to raise formal sponsor queries. Quality queries are governed by QA, CTM, and TMF Management.`
      });
    }

    // Protocol Precondition Guard: A Clinical Study Protocol must exist before quality queries can be raised
    const totalStudies = await Study.countDocuments();
    if (totalStudies === 0) {
      return res.status(422).json({
        success: false,
        error: 'Clinical Protocol Required: No active clinical study found. A clinical study protocol must exist before quality queries can be raised.'
      });
    }

    const studyId = req.body.study_id;
    if (!studyId) {
      return res.status(400).json({
        success: false,
        error: 'Clinical Study Protocol ID (study_id) is required to raise a quality query.'
      });
    }

    const targetStudy = await Study.findOne({ id: studyId });
    if (!targetStudy) {
      return res.status(404).json({
        success: false,
        error: `Clinical Study Protocol '${studyId}' does not exist.`
      });
    }

    const queryId = req.body.query_id || `QRY-${Date.now().toString().substring(6)}`;
    const query = new Query({
      ...req.body,
      query_id: queryId,
      study_id: studyId,
      issue_type: req.body.issue_type || 'Quality / ALCOA+ Query',
      comment: req.body.comment || 'Quality review query raised for remediation.',
      raised_by_id: user.id || req.body.raised_by_id || 'usr_qc',
      raised_by_name: user.name || req.body.raised_by_name || 'QC Reviewer',
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
      user_id: user.id || req.body.raised_by_id || 'usr_qc',
      user_name: user.name || req.body.raised_by_name || 'QC Reviewer',
      user_role: userRole || 'QC Reviewer',
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

// PUT /api/queries/:id/resolve - Resolve or respond to quality query
router.put('/:id/resolve', async (req, res) => {
  try {
    const query = await Query.findOne({ query_id: req.params.id });
    if (!query) {
      return res.status(404).json({ success: false, error: 'Query not found' });
    }

    const user = req.body.user ? (typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body.user) : {};
    const userRole = user.roleId || user.role || req.headers['x-user-role'];
    const requestedStatus = req.body.status || 'Resolved';

    // RBAC Security Guard: If trying to mark 'Resolved' or 'Closed' (which clears document QC), user MUST have qcPass permission
    const unauthorizedApprovers = ['site_user', 'investigator', 'cra', 'auditor'];
    if (requestedStatus === 'Resolved' || requestedStatus === 'Closed') {
      if (userRole && unauthorizedApprovers.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: `403 Forbidden: Role '${userRole}' (${user.name || 'User'}) cannot close quality queries or grant QC clearance. Approvals are restricted to QA and TMF Management.`
        });
      }
    }

    // If site user (CRC) or CRA provides remediation response, set status to 'Response Provided'
    const finalStatus = (unauthorizedApprovers.includes(userRole) && requestedStatus !== 'Response Provided')
      ? 'Response Provided'
      : requestedStatus;

    query.status = finalStatus;
    query.response = req.body.response || 'Remediation details provided by site staff';
    if (finalStatus === 'Resolved' || finalStatus === 'Closed') {
      query.resolved_by_name = user.name || 'QC Reviewer';
      query.resolved_date = new Date().toISOString().split('T')[0];
    }
    const updated = await query.save();

    // Only approve target document if query is officially Resolved/Closed by authorized QA/Lead!
    if (finalStatus === 'Resolved' || finalStatus === 'Closed') {
      const remainingOpenQueries = await Query.countDocuments({
        document_id: query.document_id,
        status: { $in: ['Open', 'In Progress', 'Response Provided'] }
      });

      if (remainingOpenQueries === 0) {
        await Document.findOneAndUpdate(
          { document_id: query.document_id },
          { 
            quality_issue_flag: false, 
            qc_status: 'Passed',
            qc_score: 'Green',
            status: 'Approved',
            qc_reviewer_id: user.id || 'usr_qa',
            qc_reviewer_name: user.name || 'QA Specialist',
            qc_review_date: new Date().toISOString().split('T')[0],
            qc_comments: `Query ${query.query_id} resolved: ${query.response}`
          }
        );
      }
    }

    // Audit log
    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: user.id || 'sys_user',
      user_name: user.name || 'VigiThink User',
      user_role: userRole || 'Clinical Staff',
      action: finalStatus === 'Resolved' ? 'QUERY_RESOLVED' : 'QUERY_RESPONSE_PROVIDED',
      target_type: 'QUERY',
      target_id: query.query_id,
      target_title: `Query for ${query.document_id}`,
      study_id: query.study_id,
      old_value: 'Open',
      new_value: finalStatus,
      reason: query.response
    });
    await auditRecord.save();

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/queries/:id - Delete query (System Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const userRole = req.body?.user?.roleId || req.headers['x-user-role'];
    if (userRole !== 'system_admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin only' });
    }
    await Query.deleteOne({ query_id: req.params.id });
    res.json({ success: true, deletedId: req.params.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
