import mongoose from 'mongoose';

const WorkflowConfigSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  document_type: { type: String, required: true, unique: true, trim: true },
  tmf_zone_id: { type: String, required: true },
  tmf_artifact_id: { type: String },
  originator_role: { type: String, required: true, default: 'site_user' },
  qc_role: { type: String, required: true, default: 'doc_controller' },
  requires_content_review: { type: Boolean, default: false },
  content_reviewer_role: { type: String, default: 'cra' },
  requires_approval: { type: Boolean, default: true },
  approver_role: { type: String, default: 'tmf_manager' },
  filing_role: { type: String, default: 'doc_controller' },
  sla_days_qc: { type: Number, default: 2 },
  sla_days_review: { type: Number, default: 3 },
  sla_days_approval: { type: Number, default: 2 },
  description: { type: String, default: '' },
  is_active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const WorkflowConfig = mongoose.model('WorkflowConfig', WorkflowConfigSchema);
