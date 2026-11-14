import mongoose from 'mongoose';

const DocumentCommentSchema = new mongoose.Schema({
  id: { type: String, default: () => `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` },
  user: { type: String, required: true },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  text: { type: String, required: true }
}, { _id: false });

const DocumentSchema = new mongoose.Schema({
  document_id: { type: String, required: true, unique: true, index: true },
  document_title: { type: String, required: true, trim: true },
  study_id: { type: String, required: true, index: true },
  country_code: { type: String, default: 'US' },
  site_id: { type: String, default: 'SITE-01' },
  
  // DIA TMF Reference Model v3.1 Taxonomy
  tmf_zone_id: { type: String, required: true, index: true },
  tmf_zone_name: { type: String },
  tmf_section_id: { type: String, required: true },
  tmf_section_name: { type: String },
  tmf_artifact_id: { type: String, required: true, index: true },
  tmf_artifact_name: { type: String, required: true },
  
  // Document Lifecycle & Status
  version_number: { type: String, default: '1.0' },
  status: { 
    type: String, 
    default: 'Draft',
    index: true
  },
  lifecycle_stage: { type: Number, default: 5, min: 1, max: 11, index: true },
  lifecycle_stage_name: { type: String, default: '5. Metadata Entry' },
  lifecycle_status: { type: String, default: 'Metadata Validated' },
  lifecycle_history: [{
    stage_number: { type: Number },
    stage_name: { type: String },
    status: { type: String },
    actor_name: { type: String },
    actor_role: { type: String },
    timestamp: { type: String, default: () => new Date().toISOString() },
    notes: { type: String }
  }],
  is_placeholder: { type: Boolean, default: false },
  is_essential_document: { type: Boolean, default: true },
  is_certified_copy: { type: Boolean, default: false },
  source_type: { type: String, default: 'Electronic Native' },

  // Workflow Submission & Review Routing
  workflow_type: { type: String, default: 'Standard Trial Document' },
  assigned_reviewer_id: { type: String, default: 'usr_sukriti_mentor', index: true },
  assigned_reviewer_name: { type: String, default: 'Sukriti Singh (TMF Lead)' },
  assigned_reviewer_role: { type: String, default: 'tmf_manager' },
  submitted_by_id: { type: String, default: null },
  submitted_by_name: { type: String, default: null },
  submitted_by_role: { type: String, default: null },
  submitted_date: { type: String, default: () => new Date().toISOString() },
  submission_notes: { type: String, default: '' },
  workflow_action: { type: String, default: 'Submit for QC Review' },
  
  // Quality Control (QC Milestone)
  qc_status: { 
    type: String, 
    default: 'Not Started',
    index: true
  },
  qc_score: { type: String, default: 'Amber' },
  qc_comments: { type: String, default: '' },
  qc_reviewer_id: { type: String },
  qc_reviewer_name: { type: String },
  qc_review_date: { type: String },
  quality_issue_flag: { type: Boolean, default: false },
  quality_issue_type: { type: String },

  // Content Review Milestone (CRA / CTM)
  content_review_status: { type: String, default: 'Not Required' }, // 'Not Required' | 'Review Pending' | 'Under Review' | 'Revision Required' | 'Passed'
  content_reviewer_id: { type: String },
  content_reviewer_name: { type: String },
  content_reviewer_role: { type: String },
  content_review_date: { type: String },
  content_review_comments: { type: String },

  // Rejection & Remediation Lifecycle (ICH GCP E6 / 21 CFR Part 11)
  rejection_reason: { type: String },
  rejection_remarks: { type: String },
  rejected_by_id: { type: String },
  rejected_by_name: { type: String },
  rejection_date_time: { type: String },
  assigned_back_to_id: { type: String },
  assigned_back_to_name: { type: String },
  correction_due_date: { type: String },
  previous_version_number: { type: String },
  resubmitted_version_number: { type: String },

  // Immutable Version History (Zero Data Loss - Never overwrite past versions)
  versions_history: [{
    version_number: { type: String },
    file_name: { type: String },
    file_path: { type: String },
    uploaded_by_id: { type: String },
    uploaded_by_name: { type: String },
    upload_date_time: { type: String },
    checksum_hash: { type: String },
    notes: { type: String },
    status: { type: String }
  }],
  
  // 21 CFR Part 11 Electronic Signature Manifest
  signature_type: { type: String, default: 'None' },
  approver_name: { type: String },
  approval_date: { type: String },
  checksum_hash: { type: String, default: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
  
  // Concurrency & Locking
  checkout_status: { type: String, enum: ['Checked In', 'Checked Out'], default: 'Checked In' },
  locked_by_user_id: { type: String, default: null },
  locked_by_user_name: { type: String, default: null },
  lock_timestamp: { type: String, default: null },
  checkout_purpose: { type: String, default: null },
  
  // Dates & Metadata
  document_date: { type: String },
  filing_date: { type: String },
  effective_date: { type: String },
  expiration_date: { type: String },
  retention_end_date: { type: String },
  upload_date_time: { type: String, default: () => new Date().toISOString() },
  uploaded_by_id: { type: String },
  uploaded_by_name: { type: String },
  
  // File details
  file_name: { type: String },
  file_path: { type: String },
  file_size: { type: Number },
  file_mimetype: { type: String },
  ocr_text: { type: String, default: '' },
  folder_path: { type: String },
  doc_due_status: { type: String, default: 'Open' },

  // Collaboration
  comments: [DocumentCommentSchema],
  blinding_level: { type: String, enum: ['Unblinded', 'Blinded', 'Not Blinded'], default: 'Not Blinded' }
}, {
  timestamps: true
});

export const Document = mongoose.model('Document', DocumentSchema);
