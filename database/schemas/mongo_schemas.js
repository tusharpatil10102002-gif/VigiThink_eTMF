/**
 * VigiThink eTMF — Enterprise MongoDB Schemas & Collection Definitions
 * 
 * Standards & Compliance:
 *  - ICH GCP E6 (R2/R3) Good Clinical Practice
 *  - US FDA 21 CFR Part 11 Electronic Records & Electronic Signatures
 *  - DIA TMF Reference Model v3.1 (11 Standard Regulatory Zones)
 *  - Database: Native MongoDB 6.0+ (WiredTiger Storage Engine)
 */

import mongoose from 'mongoose';

// =============================================================================
// 1. USER & ROLE-BASED ACCESS CONTROL (users collection)
// =============================================================================
export const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  loginId: { type: String, required: true, unique: true, index: true, lowercase: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true },
  password: { type: String, required: true },
  mobile: { type: String, default: '' },
  course: { type: String, default: 'Clinical Research & Pharmacovigilance' },
  position: { type: String, default: 'Clinical Research Professional' },
  roleId: { 
    type: String, 
    required: true, 
    enum: [
      'system_admin',
      'tmf_manager',
      'cra',
      'site_user',
      'doc_controller',
      'qa',
      'ctm',
      'tmf_lead_trainee',
      'auditor'
    ],
    index: true 
  },
  trainingRole: { type: String, default: '' },
  organization: { type: String, default: 'VigiThink Clinical Research' },
  title: { type: String, default: '' },
  studyScope: { type: String, default: 'ALL' },
  countryScope: { type: String, default: 'ALL' },
  siteScope: { type: String, default: 'ALL' },
  assignedSite: { type: String, default: '' },
  primaryResponsibility: { type: String, default: '' },
  accessPrinciple: { type: String, default: 'Least privilege' },
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,
  collection: 'users'
});

// =============================================================================
// 2. CLINICAL STUDY PROTOCOLS (studies collection)
// =============================================================================
export const SiteSubSchema = new mongoose.Schema({
  id: { type: String, required: true },
  number: { type: String, default: 'Site 001' },
  name: { type: String, required: true },
  country: { type: String, default: 'India' },
  piName: { type: String, required: true },
  piLicense: { type: String, default: '' },
  assignedStudent: { type: String, default: '' },
  status: { type: String, default: 'Active', enum: ['Setup', 'Active', 'Activation', 'Suspended', 'Closed'] },
  targetEnrollment: { type: Number, default: 25 },
  actualEnrollment: { type: Number, default: 0 },
  enrolledCount: { type: Number, default: 0 },
  initiationDate: { type: String, default: null },
  activationDate: { type: String, default: null }
}, { _id: false });

export const StudySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  shortName: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  protocolNumber: { type: String, required: true, index: true },
  version: { type: String, default: '1.0 (Final)' },
  phase: { 
    type: String, 
    required: true,
    enum: ['Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Observational Cohort', 'Post-Marketing']
  },
  therapeuticArea: { type: String, required: true },
  indication: { type: String, default: '' },
  investigationalProduct: { type: String, default: '' },
  comparator: { type: String, default: '' },
  backgroundTherapy: { type: String, default: '' },
  studyDesign: { type: String, default: '' },
  sponsor: { type: String, required: true, default: 'VigiThink BioPharma Ltd.' },
  cro: { type: String, required: true, default: 'VigiThink Clinical Operations' },
  status: { 
    type: String, 
    default: 'Active', 
    enum: ['Setup', 'Active', 'Activation', 'Close-Out', 'Archived'],
    index: true 
  },
  startDate: { type: String, default: null },
  targetEndDate: { type: String, default: null },
  estimatedCompletionDate: { type: String, default: null },
  targetEnrollment: { type: Number, default: 100 },
  actualEnrollment: { type: Number, default: 0 },
  currentEnrollment: { type: Number, default: 0 },
  filingLagDays: { type: Number, default: 0 },
  countries: { type: Array, default: [] },
  milestones: { type: Array, default: [] },
  closeoutChecklist: { type: mongoose.Schema.Types.Mixed, default: {} },
  sites: [SiteSubSchema]
}, {
  timestamps: true,
  collection: 'studies'
});

// =============================================================================
// 3. TMF DOCUMENTS & 11-STAGE REGULATORY LIFECYCLE (documents collection)
// =============================================================================
export const DocumentCommentSubSchema = new mongoose.Schema({
  id: { type: String, default: () => `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` },
  user: { type: String, required: true },
  date: { type: String, default: () => new Date().toISOString() },
  text: { type: String, required: true }
}, { _id: false });

export const DocumentSchema = new mongoose.Schema({
  document_id: { type: String, required: true, unique: true, index: true },
  document_title: { type: String, required: true, trim: true },
  study_id: { type: String, required: true, index: true },
  country_code: { type: String, default: 'IND', index: true },
  site_id: { type: String, default: 'ALL', index: true },
  
  // DIA TMF Reference Model v3.1 Standard Taxonomy
  tmf_zone_id: { type: String, required: true, index: true },
  tmf_zone_name: { type: String, default: '' },
  tmf_section_id: { type: String, required: true, index: true },
  tmf_section_name: { type: String, default: '' },
  tmf_artifact_id: { type: String, required: true, index: true },
  tmf_artifact_name: { type: String, required: true },
  
  // Versioning & Lifecycle State
  version_number: { type: String, default: '1.0' },
  status: { 
    type: String, 
    default: 'Draft',
    enum: ['Draft', 'In Review', 'Rework Required', 'Approved', 'Effective', 'Superseded', 'Placeholder', 'Archived'],
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

  // Workflow Routing
  assigned_reviewer_id: { type: String, default: 'usr_sukriti_mentor', index: true },
  assigned_reviewer_name: { type: String, default: 'Sukriti Singh (TMF Lead)' },
  assigned_reviewer_role: { type: String, default: 'tmf_manager' },
  submitted_by_id: { type: String, default: null },
  submitted_by_name: { type: String, default: null },
  submitted_by_role: { type: String, default: null },
  submitted_date: { type: String, default: () => new Date().toISOString() },
  submission_notes: { type: String, default: '' },
  workflow_action: { type: String, default: 'Submit for QC Review' },
  
  // Quality Control (QC Review Loop)
  qc_status: { 
    type: String, 
    default: 'Not Started',
    enum: ['Not Started', 'In Progress', 'Query Raised', 'Passed', 'Rejected'],
    index: true
  },
  qc_score: { type: String, default: 'Amber', enum: ['Green', 'Amber', 'Red'] },
  qc_comments: { type: String, default: '' },
  qc_reviewer_id: { type: String, default: null },
  qc_reviewer_name: { type: String, default: null },
  qc_review_date: { type: String, default: null },
  quality_issue_flag: { type: Boolean, default: false, index: true },
  quality_issue_type: { type: String, default: null },
  
  // 21 CFR Part 11 Electronic Signature & Cryptographic Seal
  signature_type: { type: String, default: 'None' },
  approver_name: { type: String, default: null },
  approval_date: { type: String, default: null },
  checksum_hash: { type: String, default: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
  
  // Check-In / Check-Out Concurrency Locks
  checkout_status: { type: String, enum: ['Checked In', 'Checked Out'], default: 'Checked In', index: true },
  locked_by_user_id: { type: String, default: null },
  locked_by_user_name: { type: String, default: null },
  lock_timestamp: { type: String, default: null },
  checkout_purpose: { type: String, default: null },
  
  // Dates & Metadata
  document_date: { type: String, default: null },
  filing_date: { type: String, default: null },
  effective_date: { type: String, default: null },
  expiration_date: { type: String, default: null },
  retention_end_date: { type: String, default: null },
  upload_date_time: { type: String, default: () => new Date().toISOString() },
  uploaded_by_id: { type: String, default: null },
  uploaded_by_name: { type: String, default: null },
  
  // Storage & Physical File Manifest
  file_name: { type: String, default: '' },
  file_path: { type: String, default: '' },
  file_size: { type: Number, default: 0 },
  file_mimetype: { type: String, default: 'application/pdf' },
  ocr_text: { type: String, default: '' },
  folder_path: { type: String, default: '' },
  doc_due_status: { type: String, default: 'Open' },

  // Collaboration & Blinding Control
  comments: [DocumentCommentSubSchema],
  blinding_level: { type: String, enum: ['Unblinded', 'Blinded', 'Not Blinded'], default: 'Not Blinded', index: true }
}, {
  timestamps: true,
  collection: 'documents'
});

// Compound Indexes for fast enterprise queries
DocumentSchema.index({ study_id: 1, tmf_zone_id: 1, status: 1 });
DocumentSchema.index({ study_id: 1, site_id: 1, tmf_artifact_id: 1 });
DocumentSchema.index({ study_id: 1, qc_status: 1 });

// =============================================================================
// 4. 21 CFR PART 11 AUDIT TRAIL (auditlogs collection)
// =============================================================================
export const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  timestamp: { type: String, required: true, index: true },
  user_id: { type: String, required: true, index: true },
  user_name: { type: String, required: true },
  user_role: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  target_type: { type: String, required: true, enum: ['DOCUMENT', 'STUDY', 'SITE', 'USER', 'FOLDER', 'QUERY', 'MILESTONE'], index: true },
  target_id: { type: String, required: true, index: true },
  target_title: { type: String, default: '' },
  study_id: { type: String, default: '', index: true },
  old_value: { type: String, default: 'N/A' },
  new_value: { type: String, default: 'N/A' },
  ip_address: { type: String, default: '127.0.0.1' },
  reason: { type: String, default: 'User operation' },
  checksum_signature: { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'auditlogs'
});

AuditLogSchema.index({ study_id: 1, timestamp: -1 });

// =============================================================================
// 5. QUALITY QUERIES & DEFECT MANAGEMENT (queries collection)
// =============================================================================
export const QuerySchema = new mongoose.Schema({
  query_id: { type: String, required: true, unique: true, index: true },
  document_id: { type: String, required: true, index: true },
  study_id: { type: String, required: true, index: true },
  issue_type: { type: String, required: true },
  comment: { type: String, required: true },
  raised_by_id: { type: String, required: true },
  raised_by_name: { type: String, required: true },
  raised_date: { type: String, required: true },
  status: { type: String, default: 'Open', enum: ['Open', 'In Progress', 'Response Provided', 'Resolved', 'Closed'], index: true },
  response: { type: String, default: null },
  resolved_by_name: { type: String, default: null },
  resolved_date: { type: String, default: null }
}, {
  timestamps: true,
  collection: 'queries'
});

// =============================================================================
// 6. CLINICAL MILESTONES (milestones collection)
// =============================================================================
export const MilestoneSchema = new mongoose.Schema({
  study_id: { type: String, required: true, index: true },
  level: { type: String, default: 'Study' },
  folder: { type: String, default: '' },
  seq: { type: String, default: '1' },
  milestone: { type: String, required: true },
  planned: { type: String, default: '' },
  actual: { type: String, default: '' },
  status: { type: String, default: 'Pending', enum: ['Pending', 'In Progress', 'Completed'] }
}, {
  timestamps: true,
  collection: 'milestones'
});

// =============================================================================
// 7. CUSTOM USER REPOSITORY FOLDERS (folders collection)
// =============================================================================
export const FolderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  study_id: { type: String, required: true, index: true },
  tmf_zone_id: { type: String, default: null },
  tmf_section_id: { type: String, default: null },
  site_id: { type: String, default: null },
  created_by: { type: String, default: 'VigiThink User' },
  created_by_role: { type: String, default: 'User' },
  created_at: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, {
  timestamps: true,
  collection: 'folders'
});
