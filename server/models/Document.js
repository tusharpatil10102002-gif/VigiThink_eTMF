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
  is_placeholder: { type: Boolean, default: false },
  is_essential_document: { type: Boolean, default: true },
  is_certified_copy: { type: Boolean, default: false },
  source_type: { type: String, default: 'Electronic Native' },
  
  // Quality Control
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
