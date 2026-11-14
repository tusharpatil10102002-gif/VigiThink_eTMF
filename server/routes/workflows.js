import express from 'express';
import { WorkflowConfig } from '../models/WorkflowConfig.js';
import { AuditLog } from '../models/AuditLog.js';

const router = express.Router();

export const DEFAULT_WORKFLOWS = [
  {
    id: 'wf_cv',
    document_type: 'Investigator CV',
    tmf_zone_id: '06',
    tmf_artifact_id: '06.01.02',
    originator_role: 'site_user',
    qc_role: 'doc_controller',
    requires_content_review: true,
    content_reviewer_role: 'cra',
    requires_approval: true,
    approver_role: 'tmf_manager',
    filing_role: 'doc_controller',
    sla_days_qc: 2,
    sla_days_review: 3,
    sla_days_approval: 2,
    description: 'Site submits CV -> Document Controller performs ALCOA+ QC -> CRA verifies qualifications -> TMF Lead grants final approval -> Document Controller files.'
  },
  {
    id: 'wf_protocol',
    document_type: 'Clinical Protocol',
    tmf_zone_id: '01',
    tmf_artifact_id: '01.01.01',
    originator_role: 'ctm',
    qc_role: 'doc_controller',
    requires_content_review: true,
    content_reviewer_role: 'tmf_manager',
    requires_approval: true,
    approver_role: 'tmf_manager',
    filing_role: 'doc_controller',
    sla_days_qc: 2,
    sla_days_review: 5,
    sla_days_approval: 3,
    description: 'Sponsor/CTM authors Protocol -> Doc Controller QC -> TMF Lead review -> Authorized Sponsor Approver sign-off -> Filing.'
  },
  {
    id: 'wf_ethics',
    document_type: 'Ethics Approval Letter',
    tmf_zone_id: '04',
    tmf_artifact_id: '04.01.01',
    originator_role: 'site_user',
    qc_role: 'doc_controller',
    requires_content_review: true,
    content_reviewer_role: 'cra',
    requires_approval: false,
    approver_role: 'none',
    filing_role: 'doc_controller',
    sla_days_qc: 1,
    sla_days_review: 2,
    sla_days_approval: 0,
    description: 'External IEC approval uploaded -> Doc Controller QC -> CRA regulatory review -> Filing (eTMF does not re-issue IRB approvals).'
  },
  {
    id: 'wf_mvr',
    document_type: 'Monitoring Visit Report',
    tmf_zone_id: '05',
    tmf_artifact_id: '05.02.01',
    originator_role: 'cra',
    qc_role: 'doc_controller',
    requires_content_review: true,
    content_reviewer_role: 'ctm',
    requires_approval: true,
    approver_role: 'ctm',
    filing_role: 'doc_controller',
    sla_days_qc: 2,
    sla_days_review: 3,
    sla_days_approval: 2,
    description: 'CRA submits visit report -> Doc Controller QC -> CTM oversight review and sign-off -> Filing.'
  },
  {
    id: 'wf_doa',
    document_type: 'Delegation of Authority Log',
    tmf_zone_id: '05',
    tmf_artifact_id: '05.03.01',
    originator_role: 'site_user',
    qc_role: 'doc_controller',
    requires_content_review: true,
    content_reviewer_role: 'cra',
    requires_approval: true,
    approver_role: 'investigator',
    filing_role: 'doc_controller',
    sla_days_qc: 2,
    sla_days_review: 3,
    sla_days_approval: 2,
    description: 'Site prepares DOA Log -> Doc Controller QC -> CRA site verification -> PI Part 11 sign-off -> Filing.'
  },
  {
    id: 'wf_training',
    document_type: 'GCP Training Certificate',
    tmf_zone_id: '05',
    tmf_artifact_id: '05.03.03',
    originator_role: 'site_user',
    qc_role: 'doc_controller',
    requires_content_review: true,
    content_reviewer_role: 'cra',
    requires_approval: false,
    approver_role: 'none',
    filing_role: 'doc_controller',
    sla_days_qc: 2,
    sla_days_review: 2,
    sla_days_approval: 0,
    description: 'Staff training uploaded -> Doc Controller QC -> CRA verification of expiration date -> Filing.'
  }
];

// Seed default workflows on initialization
export async function seedWorkflows() {
  for (const wf of DEFAULT_WORKFLOWS) {
    const existing = await WorkflowConfig.findOne({ id: wf.id });
    if (!existing) {
      await WorkflowConfig.create(wf);
    }
  }
}

// GET /api/workflows - Get all configurable document workflows
router.get('/', async (req, res) => {
  try {
    let workflows = await WorkflowConfig.find().sort({ tmf_zone_id: 1, document_type: 1 });
    if (workflows.length === 0) {
      await seedWorkflows();
      workflows = await WorkflowConfig.find().sort({ tmf_zone_id: 1, document_type: 1 });
    }
    res.json({ success: true, count: workflows.length, data: workflows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/workflows/lookup/:docType - Lookup workflow rule for given document type
router.get('/lookup/:docType', async (req, res) => {
  try {
    const docType = req.params.docType;
    let wf = await WorkflowConfig.findOne({
      $or: [
        { document_type: new RegExp(`^${docType}$`, 'i') },
        { document_type: new RegExp(docType, 'i') }
      ]
    });
    if (!wf) {
      // Default fallback workflow
      wf = {
        id: 'wf_default',
        document_type: docType,
        tmf_zone_id: '01',
        originator_role: 'site_user',
        qc_role: 'doc_controller',
        requires_content_review: false,
        content_reviewer_role: 'cra',
        requires_approval: true,
        approver_role: 'tmf_manager',
        filing_role: 'doc_controller'
      };
    }
    res.json({ success: true, data: wf });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/workflows - Admin create/update workflow configuration
router.post('/', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'system_admin') {
      return res.status(403).json({ success: false, error: 'Only System Administrator can configure workflow rules.' });
    }

    const { id, document_type } = req.body;
    const wfId = id || `wf_${Date.now()}`;
    const updated = await WorkflowConfig.findOneAndUpdate(
      { $or: [{ id: wfId }, { document_type }] },
      { ...req.body, id: wfId },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
