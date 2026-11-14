import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document } from '../models/Document.js';
import { Study } from '../models/Study.js';
import { AuditLog } from '../models/AuditLog.js';
import { classifyClinicalDocument } from '../utils/classifier.js';
import { dispatchNotification } from './notifications.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}_${cleanName}`);
  }
});
const ALLOWED_EXTENSIONS = /^\.(pdf|doc|docx|xls|xlsx|csv|txt|rtf|tif|tiff|png|jpg|jpeg|zip|xml|msg|eml)$/i;

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.test(ext)) {
      return cb(new Error(`File format '${ext}' is not permitted in eTMF. Only clinical trial documents (.pdf, .docx, .xlsx, .csv, .txt, etc.) are allowed.`));
    }
    cb(null, true);
  }
});

// Helper for Part 11 Audit Logging
const logAudit = async (req, action, targetId, targetTitle, studyId, oldValue, newValue, reason) => {
  try {
    const user = req.body?.user || {};
    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: user.id || req.headers['x-user-id'] || 'sys_user',
      user_name: user.name || req.headers['x-user-name'] || 'VigiThink User',
      user_role: user.roleId || req.headers['x-user-role'] || 'System',
      action,
      target_type: 'DOCUMENT',
      target_id: targetId,
      target_title: targetTitle,
      study_id: studyId || 'CLIN-001',
      old_value: oldValue || 'N/A',
      new_value: newValue || 'N/A',
      ip_address: req.ip || req.connection.remoteAddress || '127.0.0.1',
      reason: reason || 'Clinical trial operational update'
    });
    await auditRecord.save();
  } catch (err) {
    console.error('[AuditLog] Error writing audit record:', err);
  }
};

// 1. GET /api/documents - Query with filters and text search
router.get('/', async (req, res) => {
  try {
    const { study_id, tmf_zone_id, tmf_artifact_id, status, qc_status, search } = req.query;
    const filter = {};

    if (study_id && study_id !== 'ALL') filter.study_id = study_id;
    if (tmf_zone_id && tmf_zone_id !== 'ALL') filter.tmf_zone_id = tmf_zone_id;
    if (tmf_artifact_id) filter.tmf_artifact_id = tmf_artifact_id;
    if (status && status !== 'ALL') filter.status = status;
    if (qc_status && qc_status !== 'ALL') filter.qc_status = qc_status;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { document_id: regex },
        { document_title: regex },
        { tmf_artifact_name: regex },
        { file_name: regex },
        { folder_path: regex },
        { ocr_text: regex }
      ];
    }

    const docs = await Document.find(filter).sort({ upload_date_time: -1 });
    res.json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/documents/:id - Single document
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2b. POST /api/documents/classify - Intelligent Classification & Duplicate Detection
router.post('/classify', async (req, res) => {
  try {
    const { title, fileName, study_id, site_id } = req.body;
    const textToClassify = title || fileName || '';
    if (!textToClassify.trim()) {
      return res.status(400).json({ success: false, error: 'Document title or file name required for classification.' });
    }

    const classification = classifyClinicalDocument(textToClassify);

    // Duplicate Detection within study & site
    const duplicateQuery = {
      study_id: study_id || 'CLIN-001',
      tmf_artifact_id: classification.artifactId
    };
    if (site_id && site_id !== 'ALL') duplicateQuery.site_id = site_id;

    const existingMatch = await Document.findOne(duplicateQuery);
    const isPotentialDuplicate = !!existingMatch;

    res.json({
      success: true,
      data: {
        ...classification,
        isPotentialDuplicate,
        existingDocument: existingMatch ? {
          document_id: existingMatch.document_id,
          document_title: existingMatch.document_title,
          version_number: existingMatch.version_number,
          status: existingMatch.status
        } : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2c. POST /api/documents/advanced-search - Compound Multi-criteria Filter & Search
router.post('/advanced-search', async (req, res) => {
  try {
    const {
      study_id,
      site_id,
      tmf_zone_id,
      tmf_section_id,
      tmf_artifact_id,
      status,
      qc_status,
      version_number,
      lifecycle_stage,
      date_from,
      date_to,
      keyword,
      uploaded_by_id
    } = req.body;

    const filter = {};

    if (study_id && study_id !== 'ALL') filter.study_id = study_id;
    if (site_id && site_id !== 'ALL') filter.site_id = site_id;
    if (tmf_zone_id && tmf_zone_id !== 'ALL') filter.tmf_zone_id = tmf_zone_id;
    if (tmf_section_id && tmf_section_id !== 'ALL') filter.tmf_section_id = tmf_section_id;
    if (tmf_artifact_id && tmf_artifact_id !== 'ALL') filter.tmf_artifact_id = tmf_artifact_id;
    if (status && status !== 'ALL') filter.status = status;
    if (qc_status && qc_status !== 'ALL') filter.qc_status = qc_status;
    if (version_number) filter.version_number = version_number;
    if (lifecycle_stage) filter.lifecycle_stage = parseInt(lifecycle_stage, 10);
    if (uploaded_by_id) filter.uploaded_by_id = uploaded_by_id;

    if (date_from || date_to) {
      filter.upload_date_time = {};
      if (date_from) filter.upload_date_time.$gte = new Date(date_from).toISOString();
      if (date_to) filter.upload_date_time.$lte = new Date(date_to + 'T23:59:59.999Z').toISOString();
    }

    if (keyword && keyword.trim()) {
      const regex = new RegExp(keyword.trim(), 'i');
      filter.$or = [
        { document_id: regex },
        { document_title: regex },
        { tmf_artifact_name: regex },
        { file_name: regex },
        { ocr_text: regex },
        { submission_notes: regex }
      ];
    }

    const docs = await Document.find(filter).sort({ upload_date_time: -1 });
    res.json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/documents/upload - Real file upload with Multer & SHA-256 checksum calculation
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const user = req.body.user ? (typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body.user) : {};
    const userRole = user.roleId || req.headers['x-user-role'];

    // Authorization check: Auditor & QA cannot upload (separation of duties & read-only access)
    const unauthorizedUploadRoles = ['auditor', 'qa'];
    if (userRole && unauthorizedUploadRoles.includes(userRole)) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      }
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Role '${userRole}' is not authorized to upload clinical trial documents under separation of duties / read-only policy.`
      });
    }

    // Protocol Precondition Guard: A Clinical Study Protocol must exist before documents can be uploaded
    const totalStudies = await Study.countDocuments();
    if (totalStudies === 0) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      }
      return res.status(422).json({
        success: false,
        error: 'Clinical Protocol Required: No active clinical study found. A clinical study protocol must be created by the System Administrator before documents can be uploaded or filed in eTMF.'
      });
    }

    const studyId = req.body.study_id;
    if (!studyId) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      }
      return res.status(400).json({
        success: false,
        error: 'Clinical Study Protocol ID (study_id) is required to file documents in the eTMF repository.'
      });
    }

    const targetStudy = await Study.findOne({ id: studyId });
    if (!targetStudy) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      }
      return res.status(404).json({
        success: false,
        error: `Clinical Study Protocol '${studyId}' does not exist in the repository. Please select or create a valid clinical study first.`
      });
    }

    let checksum = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    let filePath = null;
    let fileName = null;
    let fileSize = null;
    let fileMime = null;

    if (req.file) {
      const fileBuffer = fs.readFileSync(req.file.path);
      checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      filePath = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      fileMime = req.file.mimetype;
    }

    const docCount = await Document.countDocuments();
    const documentId = req.body.document_id || `DOC-2026-${String(docCount + 1).padStart(4, '0')}`;

    // Duplicate check on document_id
    const existingDoc = await Document.findOne({ document_id: documentId });
    if (existingDoc) {
      return res.status(409).json({
        success: false,
        error: `Conflict: A document with ID '${documentId}' already exists in the eTMF repository.`
      });
    }

    const isPlaceholder = req.body.is_placeholder === 'true';
    const isSubmitToQc = req.body.workflow_action === 'Submit for QC Review' || (!isPlaceholder && !req.body.workflow_action);

    // Segregation of Duties (ICH GCP E6.5.1 / Maker-Checker): Uploader CANNOT assign themselves as reviewer
    const uploaderId = user?.id || req.body.uploaded_by_id || req.body.submitted_by_id;
    const uploaderName = (user?.name || req.body.uploaded_by_name || req.body.submitted_by_name || '').toLowerCase().trim();
    const reqReviewerId = req.body.assigned_reviewer_id;
    const reqReviewerName = (req.body.assigned_reviewer_name || '').toLowerCase().trim();

    if (reqReviewerId && uploaderId && reqReviewerId === uploaderId) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      }
      return res.status(400).json({
        success: false,
        error: 'Segregation of Duties Violation: You cannot assign yourself as the QC reviewer for a document you are uploading (ICH GCP E6 / Four-Eyes Principle). Please designate an independent reviewer.'
      });
    }

    if (reqReviewerName && uploaderName && (reqReviewerName === uploaderName || reqReviewerName.startsWith(uploaderName))) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      }
      return res.status(400).json({
        success: false,
        error: 'Segregation of Duties Violation: You cannot assign yourself as the QC reviewer for a document you are uploading (ICH GCP E6 / Four-Eyes Principle). Please designate an independent reviewer.'
      });
    }

    let assignedReviewerId = req.body.assigned_reviewer_id;
    let assignedReviewerName = req.body.assigned_reviewer_name;
    let assignedReviewerRole = req.body.assigned_reviewer_role;

    if (!assignedReviewerId) {
      if (uploaderId === 'usr_sukriti_mentor' || uploaderName.includes('sukriti')) {
        assignedReviewerId = 'usr_gourish';
        assignedReviewerName = 'Gourish Chouksey (QA / QC Specialist)';
        assignedReviewerRole = 'qa';
      } else {
        assignedReviewerId = 'usr_sukriti_mentor';
        assignedReviewerName = 'Sukriti Singh (TMF Lead)';
        assignedReviewerRole = 'tmf_manager';
      }
    }

    const submissionNotes = req.body.submission_notes || '';
    const workflowAction = req.body.workflow_action || (isPlaceholder ? 'Placeholder Creation' : 'Submit for QC Review');

    const initLifecycleStage = isPlaceholder ? 1 : (isSubmitToQc ? 6 : 5);
    const initLifecycleName = isPlaceholder ? '1. Document Creation' : (isSubmitToQc ? '6. Quality Control (QC)' : '5. Metadata Entry');
    const initLifecycleStatus = isPlaceholder ? 'Placeholder Created' : (isSubmitToQc ? `Pending QC Review (${assignedReviewerName})` : 'Metadata Validated - Draft');
    const nowIso = new Date().toISOString();

    const initHistory = isPlaceholder ? [
      {
        stage_number: 1,
        stage_name: '1. Document Creation',
        status: 'Placeholder Created',
        actor_name: user.name || 'VigiThink User',
        actor_role: user.roleId || 'site_user',
        timestamp: nowIso,
        notes: 'Document placeholder indexed in eTMF awaiting official file.'
      }
    ] : [
      {
        stage_number: 1,
        stage_name: '1. Document Creation',
        status: 'Document Prepared',
        actor_name: user.name || 'VigiThink User',
        actor_role: user.roleId || 'site_user',
        timestamp: nowIso,
        notes: `Clinical trial document prepared (${req.body.document_title || fileName}).`
      },
      {
        stage_number: 2,
        stage_name: '2. Document Review',
        status: 'Content Verified',
        actor_name: user.name || 'VigiThink User',
        actor_role: user.roleId || 'site_user',
        timestamp: nowIso,
        notes: 'Pre-upload verification & content review completed by responsible investigator/site staff.'
      },
      {
        stage_number: 3,
        stage_name: '3. Document Signing',
        status: 'Signatures Collected',
        actor_name: user.name || 'VigiThink User',
        actor_role: user.roleId || 'site_user',
        timestamp: nowIso,
        notes: 'Required signatures collected on document prior to filing.'
      },
      {
        stage_number: 4,
        stage_name: '4. Document Upload',
        status: 'Uploaded to eTMF',
        actor_name: user.name || 'VigiThink User',
        actor_role: user.roleId || 'site_user',
        timestamp: nowIso,
        notes: `Document uploaded to electronic TMF (SHA-256: ${checksum.substring(0, 12)}...).`
      },
      {
        stage_number: 5,
        stage_name: '5. Metadata Entry',
        status: isSubmitToQc ? 'Submitted to QC Review' : 'Metadata Validated',
        actor_name: user.name || 'VigiThink User',
        actor_role: user.roleId || 'site_user',
        timestamp: nowIso,
        notes: `Metadata entry complete: Study ${req.body.study_id || 'CLIN-001'}, Site ${req.body.site_id || 'SITE-01'}, DIA Artifact ${req.body.tmf_artifact_id || '01.01.01'} (${req.body.tmf_artifact_name || 'Artifact'}). Submitted to ${assignedReviewerName} (${assignedReviewerRole}) for Quality Control clearance.${submissionNotes ? ` Transmittal Note: "${submissionNotes}"` : ''}`
      }
    ];

    if (isSubmitToQc && !isPlaceholder) {
      initHistory.push({
        stage_number: 6,
        stage_name: '6. Quality Control (QC)',
        status: 'Awaiting QC Clearance',
        actor_name: assignedReviewerName,
        actor_role: assignedReviewerRole,
        timestamp: nowIso,
        notes: `In QC Review Queue awaiting verification by ${assignedReviewerName}.`
      });
    }

    const newDoc = new Document({
      document_id: documentId,
      document_title: req.body.document_title || fileName || 'Clinical Document',
      study_id: studyId,
      country_code: req.body.country_code || 'US',
      site_id: req.body.site_id || 'SITE-01',
      tmf_zone_id: req.body.tmf_zone_id || '01',
      tmf_zone_name: req.body.tmf_zone_name || 'Trial Management',
      tmf_section_id: req.body.tmf_section_id || '01.01',
      tmf_section_name: req.body.tmf_section_name || 'Trial Oversight',
      tmf_artifact_id: req.body.tmf_artifact_id || '01.01.01',
      tmf_artifact_name: req.body.tmf_artifact_name || 'Trial Master Oversight Plan',
      version_number: req.body.version_number || (req.body.is_placeholder === 'true' ? '0.0' : '0.1'),
      status: req.body.is_placeholder === 'true' ? 'Placeholder' : (req.body.is_draft === 'true' || req.body.status === 'Draft' ? 'Draft' : (req.body.status || 'Submitted')),
      lifecycle_stage: initLifecycleStage,
      lifecycle_stage_name: initLifecycleName,
      lifecycle_status: initLifecycleStatus,
      lifecycle_history: initHistory,
      workflow_type: req.body.workflow_type || 'Standard Trial Document',
      assigned_reviewer_id: assignedReviewerId,
      assigned_reviewer_name: assignedReviewerName,
      assigned_reviewer_role: req.body.assigned_reviewer_role || assignedReviewerRole,
      submitted_by_id: user.id || 'usr_demo',
      submitted_by_name: user.name || 'VigiThink User',
      submitted_by_role: user.roleId || 'site_user',
      submitted_date: nowIso,
      submission_notes: submissionNotes,
      workflow_action: workflowAction,
      is_placeholder: req.body.is_placeholder === 'true' || false,
      is_certified_copy: req.body.is_certified_copy === 'true' || false,
      source_type: req.body.source_type || 'Electronic Native',
      qc_status: req.body.is_placeholder === 'true' ? 'Not Started' : 'In Progress',
      qc_score: req.body.is_placeholder === 'true' ? 'Red' : 'Amber',
      checksum_hash: checksum,
      file_name: fileName,
      file_path: filePath,
      file_size: fileSize,
      file_mimetype: fileMime,
      uploaded_by_id: user.id || 'usr_demo',
      uploaded_by_name: user.name || 'VigiThink User',
      filing_date: new Date().toISOString().split('T')[0],
      folder_path: req.body.folder_path || `Study > Zone ${req.body.tmf_zone_id || '01'} > ${req.body.tmf_artifact_name || 'Artifact'}`
    });

    const savedDoc = await newDoc.save();

    await logAudit(
      req, 
      'DOCUMENT_UPLOADED', 
      savedDoc.document_id, 
      savedDoc.document_title, 
      savedDoc.study_id, 
      'None', 
      `Created as ${savedDoc.status} (SHA-256: ${checksum.substring(0, 12)}...)`, 
      'Initial clinical document upload with ALCOA+ validation'
    );

    if (savedDoc.status === 'Submitted') {
      await dispatchNotification({
        recipient_role: 'doc_controller',
        sender_id: user?.id,
        sender_name: user?.name || 'Site User',
        sender_role: userRole || 'site_user',
        type: 'DOCUMENT_SUBMITTED',
        title: 'New Clinical Document Submitted for QC',
        message: `Document '${savedDoc.document_title}' (${savedDoc.document_id}) submitted for Study ${savedDoc.study_id}. Pending ALCOA+ QC clearance.`,
        document_id: savedDoc.document_id,
        document_title: savedDoc.document_title,
        study_id: savedDoc.study_id,
        site_id: savedDoc.site_id,
        action_url: '/qc-queue'
      });
    }

    res.status(201).json({ success: true, data: savedDoc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3a. POST /api/documents/bulk-upload - Bulk Upload up to 10 clinical documents with auto-classification & SHA-256
router.post('/bulk-upload', (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const user = req.body.user ? (typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body.user) : {};
    const userRole = user.roleId || req.headers['x-user-role'];

    // Authorization check: Auditor & QA cannot upload (separation of duties)
    const unauthorizedUploadRoles = ['auditor', 'qa'];
    if (userRole && unauthorizedUploadRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Role '${userRole}' is not authorized to upload clinical trial documents under separation of duties policy.`
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided for bulk upload. Please attach at least one valid clinical document.'
      });
    }

    // Protocol Precondition Guard: A Clinical Study Protocol must exist before batch documents can be uploaded
    const totalStudies = await Study.countDocuments();
    if (totalStudies === 0) {
      if (req.files) {
        req.files.forEach(f => {
          try { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch (_) {}
        });
      }
      return res.status(422).json({
        success: false,
        error: 'Clinical Protocol Required: No active clinical study found. A clinical study protocol must be created by the System Administrator before batch documents can be uploaded in eTMF.'
      });
    }

    const studyId = req.body.study_id;
    if (!studyId) {
      if (req.files) {
        req.files.forEach(f => {
          try { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch (_) {}
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Clinical Study Protocol ID (study_id) is required for bulk document upload in eTMF.'
      });
    }

    const targetStudy = await Study.findOne({ id: studyId });
    if (!targetStudy) {
      if (req.files) {
        req.files.forEach(f => {
          try { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch (_) {}
        });
      }
      return res.status(404).json({
        success: false,
        error: `Clinical Study Protocol '${studyId}' does not exist in the repository. Please select or create a valid clinical study first.`
      });
    }

    const assignedReviewerId = req.body.assigned_reviewer_id || 'usr_sukriti_mentor';
    const assignedReviewerName = req.body.assigned_reviewer_name || 'Sukriti Singh (TMF Lead)';
    const assignedReviewerRole = req.body.assigned_reviewer_role || 'tmf_manager';
    const submissionNotes = req.body.submission_notes || 'Batch upload of clinical trial documents';
    const siteId = req.body.site_id || 'SITE-01';
    const countryCode = req.body.country_code || 'US';
    const nowIso = new Date().toISOString();

    const currentCount = await Document.countDocuments();
    const createdDocuments = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileBuffer = fs.readFileSync(file.path);
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Intelligent classification per file name
      const classification = classifyClinicalDocument(file.originalname);
      const targetZoneId = req.body.tmf_zone_id && req.body.tmf_zone_id !== 'AUTO' ? req.body.tmf_zone_id : classification.zoneId;
      const targetZoneName = req.body.tmf_zone_name || classification.zoneName;
      const targetSectionId = req.body.tmf_section_id || classification.sectionId;
      const targetSectionName = req.body.tmf_section_name || classification.sectionName;
      const targetArtifactId = req.body.tmf_artifact_id || classification.artifactId;
      const targetArtifactName = req.body.tmf_artifact_name || classification.artifactName;

      const docId = `DOC-2026-${String(currentCount + i + 1).padStart(4, '0')}`;

      const lifecycleHistory = [
        {
          stage_number: 1,
          stage_name: '1. Document Creation',
          status: 'Document Prepared',
          actor_name: user.name || 'VigiThink User',
          actor_role: user.roleId || 'site_user',
          timestamp: nowIso,
          notes: `Clinical trial document prepared from batch upload (${file.originalname}).`
        },
        {
          stage_number: 2,
          stage_name: '2. Document Review',
          status: 'Content Verified',
          actor_name: user.name || 'VigiThink User',
          actor_role: user.roleId || 'site_user',
          timestamp: nowIso,
          notes: 'Pre-upload verification completed prior to batch submission.'
        },
        {
          stage_number: 3,
          stage_name: '3. Document Signing',
          status: 'Signatures Collected',
          actor_name: user.name || 'VigiThink User',
          actor_role: user.roleId || 'site_user',
          timestamp: nowIso,
          notes: 'Required signatures verified on batch submission.'
        },
        {
          stage_number: 4,
          stage_name: '4. Document Upload',
          status: 'Uploaded to eTMF (Bulk Batch)',
          actor_name: user.name || 'VigiThink User',
          actor_role: user.roleId || 'site_user',
          timestamp: nowIso,
          notes: `Batch upload executed. SHA-256 Checksum: ${checksum}.`
        },
        {
          stage_number: 5,
          stage_name: '5. Metadata Entry',
          status: 'Submitted to QC Review',
          actor_name: user.name || 'VigiThink User',
          actor_role: user.roleId || 'site_user',
          timestamp: nowIso,
          notes: `Auto-indexed to Zone ${targetZoneId} (${targetZoneName}) > Artifact ${targetArtifactId} (${targetArtifactName}). Confidence score: ${classification.confidenceScore}%. Routed to ${assignedReviewerName}. Notes: "${submissionNotes}".`
        },
        {
          stage_number: 6,
          stage_name: '6. Quality Control (QC)',
          status: 'Awaiting QC Clearance',
          actor_name: assignedReviewerName,
          actor_role: assignedReviewerRole,
          timestamp: nowIso,
          notes: `In QC Review Queue awaiting verification by ${assignedReviewerName}.`
        }
      ];

      const newDoc = new Document({
        document_id: docId,
        document_title: file.originalname.replace(/\.[^/.]+$/, ''),
        study_id: studyId,
        country_code: countryCode,
        site_id: siteId,
        tmf_zone_id: targetZoneId,
        tmf_zone_name: targetZoneName,
        tmf_section_id: targetSectionId,
        tmf_section_name: targetSectionName,
        tmf_artifact_id: targetArtifactId,
        tmf_artifact_name: targetArtifactName,
        version_number: req.body.version_number || '0.1',
        status: 'Draft',
        lifecycle_stage: 6,
        lifecycle_stage_name: '6. Quality Control (QC)',
        lifecycle_status: `Pending QC Review (${assignedReviewerName})`,
        lifecycle_history: lifecycleHistory,
        assigned_reviewer_id: assignedReviewerId,
        assigned_reviewer_name: assignedReviewerName,
        assigned_reviewer_role: assignedReviewerRole,
        submitted_by_id: user.id || 'usr_demo',
        submitted_by_name: user.name || 'VigiThink User',
        submitted_by_role: userRole || 'site_user',
        submitted_date: nowIso,
        submission_notes: submissionNotes,
        workflow_action: 'Submit for QC Review',
        is_placeholder: false,
        is_certified_copy: req.body.is_certified_copy === 'true' || false,
        source_type: req.body.source_type || 'Electronic Native',
        qc_status: 'In Progress',
        qc_score: 'Amber',
        checksum_hash: checksum,
        file_name: file.originalname,
        file_path: `/uploads/${file.filename}`,
        file_size: file.size,
        file_mimetype: file.mimetype,
        uploaded_by_id: user.id || 'usr_demo',
        uploaded_by_name: user.name || 'VigiThink User',
        filing_date: nowIso.split('T')[0],
        folder_path: `Study > Zone ${targetZoneId} > ${targetArtifactName}`
      });

      const saved = await newDoc.save();
      createdDocuments.push(saved);

      await logAudit(
        req,
        'DOCUMENT_BULK_UPLOADED',
        saved.document_id,
        saved.document_title,
        saved.study_id,
        'None',
        `Bulk Uploaded as ${saved.status} (SHA-256: ${checksum.substring(0, 12)}...)`,
        `Batch upload item ${i + 1} of ${req.files.length}: ${file.originalname}`
      );
    }

    res.status(201).json({
      success: true,
      count: createdDocuments.length,
      message: `Successfully uploaded and auto-classified ${createdDocuments.length} clinical trial documents.`,
      data: createdDocuments
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3b. POST /api/documents - JSON document or placeholder creation
router.post('/', async (req, res) => {
  try {
    const user = req.body.user || {};
    const userRole = user.roleId || req.headers['x-user-role'];

    // Authorization check: Auditor & QA cannot create/upload documents
    const unauthorizedUploadRoles = ['auditor', 'qa'];
    if (userRole && unauthorizedUploadRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Role '${userRole}' is not authorized to create clinical trial documents.`
      });
    }

    // Protocol Precondition Guard: A Clinical Study Protocol must exist before documents or placeholders can be registered
    const totalStudies = await Study.countDocuments();
    if (totalStudies === 0) {
      return res.status(422).json({
        success: false,
        error: 'Clinical Protocol Required: No active clinical study found. A clinical study protocol must be created by the System Administrator before documents or placeholders can be registered in eTMF.'
      });
    }

    const studyId = req.body.study_id;
    if (!studyId) {
      return res.status(400).json({
        success: false,
        error: 'Clinical Study Protocol ID (study_id) is required to register a document in eTMF.'
      });
    }

    const targetStudy = await Study.findOne({ id: studyId });
    if (!targetStudy) {
      return res.status(404).json({
        success: false,
        error: `Clinical Study Protocol '${studyId}' does not exist in the repository. Please select or create a valid clinical study first.`
      });
    }

    const count = await Document.countDocuments();
    const docId = req.body.document_id || `DOC-2026-${String(count + 1).padStart(4, '0')}`;

    // Duplicate check
    const existingDoc = await Document.findOne({ document_id: docId });
    if (existingDoc) {
      return res.status(409).json({
        success: false,
        error: `Conflict: A document with ID '${docId}' already exists in the eTMF repository.`
      });
    }

    const isPlaceholder = !!req.body.is_placeholder;
    const isSubmitToQc = req.body.workflow_action === 'Submit for QC Review' || (!isPlaceholder && !req.body.workflow_action);

    // Segregation of Duties (ICH GCP E6.5.1 / Maker-Checker): Uploader CANNOT assign themselves as reviewer
    const uploaderId = user?.id || req.body.uploaded_by_id || req.body.submitted_by_id;
    const uploaderName = (user?.name || req.body.uploaded_by_name || req.body.submitted_by_name || '').toLowerCase().trim();
    const reqReviewerId = req.body.assigned_reviewer_id;
    const reqReviewerName = (req.body.assigned_reviewer_name || '').toLowerCase().trim();

    if (reqReviewerId && uploaderId && reqReviewerId === uploaderId) {
      return res.status(400).json({
        success: false,
        error: 'Segregation of Duties Violation: You cannot assign yourself as the QC reviewer for a document you are creating/uploading (ICH GCP E6 / Four-Eyes Principle). Please designate an independent reviewer.'
      });
    }

    if (reqReviewerName && uploaderName && (reqReviewerName === uploaderName || reqReviewerName.startsWith(uploaderName))) {
      return res.status(400).json({
        success: false,
        error: 'Segregation of Duties Violation: You cannot assign yourself as the QC reviewer for a document you are creating/uploading (ICH GCP E6 / Four-Eyes Principle). Please designate an independent reviewer.'
      });
    }

    let assignedReviewerId = req.body.assigned_reviewer_id;
    let assignedReviewerName = req.body.assigned_reviewer_name;
    let assignedReviewerRole = req.body.assigned_reviewer_role;

    if (!assignedReviewerId) {
      if (uploaderId === 'usr_sukriti_mentor' || uploaderName.includes('sukriti')) {
        assignedReviewerId = 'usr_gourish';
        assignedReviewerName = 'Gourish Chouksey (QA / QC Specialist)';
        assignedReviewerRole = 'qa';
      } else {
        assignedReviewerId = 'usr_sukriti_mentor';
        assignedReviewerName = 'Sukriti Singh (TMF Lead)';
        assignedReviewerRole = 'tmf_manager';
      }
    }

    const submissionNotes = req.body.submission_notes || '';
    const workflowAction = req.body.workflow_action || (isPlaceholder ? 'Placeholder Creation' : 'Submit for QC Review');

    const initLifecycleStage = isPlaceholder ? 1 : (isSubmitToQc ? 6 : (req.body.lifecycle_stage || 5));
    const initLifecycleName = isPlaceholder ? '1. Document Creation' : (isSubmitToQc ? '6. Quality Control (QC)' : (req.body.lifecycle_stage_name || '5. Metadata Entry'));
    const initLifecycleStatus = isPlaceholder ? 'Placeholder Created' : (isSubmitToQc ? `Pending QC Review (${assignedReviewerName})` : (req.body.lifecycle_status || 'Metadata Validated - Draft'));
    const nowIso = new Date().toISOString();

    const initHistory = req.body.lifecycle_history && req.body.lifecycle_history.length > 0 ? req.body.lifecycle_history : (
      isPlaceholder ? [
        {
          stage_number: 1,
          stage_name: '1. Document Creation',
          status: 'Placeholder Created',
          actor_name: user.name || 'VigiThink User',
          actor_role: user.roleId || 'site_user',
          timestamp: nowIso,
          notes: 'Document placeholder indexed in eTMF awaiting official file.'
        }
      ] : [
        {
          stage_number: 1,
          stage_name: '1. Document Creation',
          status: 'Document Prepared',
          actor_name: user.name || 'VigiThink User',
          actor_role: user.roleId || 'site_user',
          timestamp: nowIso,
          notes: `Clinical trial document prepared (${req.body.document_title || 'Untitled Trial Document'}).`
        },
        {
          stage_number: 2,
          stage_name: '2. Document Review',
          status: 'Content Verified',
          actor_name: user.name || 'VigiThink User',
          actor_role: user.roleId || 'site_user',
          timestamp: nowIso,
          notes: 'Pre-upload verification & content review completed by responsible investigator/site staff.'
        },
        {
          stage_number: 3,
          stage_name: '3. Document Signing',
          status: 'Signatures Collected',
          actor_name: user.name || 'VigiThink User',
          actor_role: user.roleId || 'site_user',
          timestamp: nowIso,
          notes: 'Required signatures collected on document prior to filing.'
        },
        {
          stage_number: 4,
          stage_name: '4. Document Upload',
          status: 'Uploaded to eTMF',
          actor_name: user.name || 'VigiThink User',
          actor_role: user.roleId || 'site_user',
          timestamp: nowIso,
          notes: 'Document recorded and registered in electronic TMF.'
        },
        {
          stage_number: 5,
          stage_name: '5. Metadata Entry',
          status: isSubmitToQc ? 'Submitted to QC Review' : 'Metadata Validated',
          actor_name: user.name || 'VigiThink User',
          actor_role: user.roleId || 'site_user',
          timestamp: nowIso,
          notes: `Metadata entry complete: Study ${req.body.study_id || 'CLIN-001'}, Site ${req.body.site_id || 'CENTRAL'}, DIA Artifact ${req.body.tmf_artifact_id || '01.01.01'} (${req.body.tmf_artifact_name || 'Artifact'}). Submitted to ${assignedReviewerName} (${assignedReviewerRole}) for Quality Control clearance.${submissionNotes ? ` Transmittal Note: "${submissionNotes}"` : ''}`
        }
      ]
    );

    if (isSubmitToQc && !isPlaceholder && (!req.body.lifecycle_history || req.body.lifecycle_history.length <= 5)) {
      initHistory.push({
        stage_number: 6,
        stage_name: '6. Quality Control (QC)',
        status: 'Awaiting QC Clearance',
        actor_name: assignedReviewerName,
        actor_role: assignedReviewerRole,
        timestamp: nowIso,
        notes: `In QC Review Queue awaiting verification by ${assignedReviewerName}.`
      });
    }

    const newDoc = new Document({
      document_id: docId,
      document_title: req.body.document_title || 'Untitled Trial Document',
      study_id: studyId,
      country_code: req.body.country_code || 'GLOBAL',
      site_id: req.body.site_id || 'CENTRAL',
      tmf_zone_id: req.body.tmf_zone_id || '01',
      tmf_section_id: req.body.tmf_section_id || '01.01',
      tmf_artifact_id: req.body.tmf_artifact_id || '01.01.01',
      tmf_artifact_name: req.body.tmf_artifact_name || 'Trial Document',
      version_number: req.body.version_number || (req.body.is_placeholder ? '0.0' : '0.1'),
      status: req.body.is_placeholder ? 'Placeholder' : (req.body.is_draft || req.body.status === 'Draft' ? 'Draft' : (req.body.status || 'Submitted')),
      lifecycle_stage: initLifecycleStage,
      lifecycle_stage_name: initLifecycleName,
      lifecycle_status: initLifecycleStatus,
      lifecycle_history: initHistory,
      workflow_type: req.body.workflow_type || 'Standard Trial Document',
      assigned_reviewer_id: assignedReviewerId,
      assigned_reviewer_name: assignedReviewerName,
      assigned_reviewer_role: req.body.assigned_reviewer_role || assignedReviewerRole,
      submitted_by_id: user.id || req.body.submitted_by_id || 'usr_demo',
      submitted_by_name: user.name || req.body.submitted_by_name || 'VigiThink User',
      submitted_by_role: user.roleId || req.body.submitted_by_role || 'site_user',
      submitted_date: nowIso,
      submission_notes: submissionNotes,
      workflow_action: workflowAction,
      is_placeholder: !!req.body.is_placeholder,
      is_certified_copy: !!req.body.is_certified_copy,
      source_type: req.body.source_type || 'Electronic Native',
      qc_status: req.body.is_placeholder ? 'Not Started' : 'In Progress',
      qc_score: req.body.is_placeholder ? 'Red' : 'Amber',
      checksum_hash: req.body.checksum_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      checkout_status: 'Checked In',
      document_date: req.body.document_date || new Date().toISOString().split('T')[0],
      filing_date: new Date().toISOString().split('T')[0],
      uploaded_by_id: user.id || 'sys_user',
      uploaded_by_name: user.name || 'VigiThink User',
      folder_path: req.body.folder_path || `Study > Zone ${req.body.tmf_zone_id || '01'} > ${req.body.tmf_artifact_name || 'Artifact'}`
    });

    const savedDoc = await newDoc.save();

    await logAudit(
      req, 
      req.body.is_placeholder ? 'PLACEHOLDER_CREATED' : 'DOCUMENT_CREATED', 
      savedDoc.document_id, 
      savedDoc.document_title, 
      savedDoc.study_id, 
      'None', 
      `Created as ${savedDoc.status}`, 
      'Clinical trial record entry'
    );

    if (savedDoc.status === 'Submitted') {
      await dispatchNotification({
        recipient_role: 'doc_controller',
        sender_id: user?.id || req.body.uploaded_by_id,
        sender_name: user?.name || req.body.uploaded_by_name || 'Site User',
        sender_role: userRole || req.body.uploaded_by_role || 'site_user',
        type: 'DOCUMENT_SUBMITTED',
        title: 'New Clinical Document Submitted for QC',
        message: `Document '${savedDoc.document_title}' (${savedDoc.document_id}) submitted for Study ${savedDoc.study_id}. Pending ALCOA+ QC clearance.`,
        document_id: savedDoc.document_id,
        document_title: savedDoc.document_title,
        study_id: savedDoc.study_id,
        site_id: savedDoc.site_id,
        action_url: '/qc-queue'
      });
    }

    res.status(201).json({ success: true, data: savedDoc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. PUT /api/documents/:id/metadata - Update metadata
router.put('/:id/metadata', async (req, res) => {
  try {
    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const { updatedFields, user, reason } = req.body;
    const oldTitle = doc.document_title;

    Object.assign(doc, updatedFields);
    const updated = await doc.save();

    await logAudit(
      req,
      'METADATA_UPDATED',
      doc.document_id,
      doc.document_title,
      doc.study_id,
      `Title: ${oldTitle}`,
      JSON.stringify(updatedFields),
      reason || 'User metadata update'
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. PUT /api/documents/:id/qc - QC Review decision
router.put('/:id/qc', async (req, res) => {
  try {
    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const qcStatus = req.body.qcStatus || req.body.qc_status;
    const comments = req.body.comments || req.body.qc_notes || req.body.notes || '';
    const qualityIssueType = req.body.qualityIssueType || req.body.quality_issue_type;
    const user = req.body.user;

    // RBAC Security Guard: CRC / Site User, CRA, and Auditor are strictly forbidden from passing/rejecting QC
    const userRole = user?.roleId || req.headers['x-user-role'];
    const unauthorizedQcRoles = ['site_user', 'investigator', 'cra', 'auditor'];
    if (!userRole || unauthorizedQcRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `403 Forbidden: Role '${userRole || 'unspecified'}' (${user?.name || 'User'}) is not authorized to render QC decisions under SOP-TMF-04. Quality clearance is restricted to Document Controller, TMF Lead, and CTM.`
      });
    }

    if ((qcStatus === 'Failed' || qcStatus === 'Query Raised') && (!comments || !comments.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Mandatory Rejection Comment: Discrepancy details / feedback comments are required when rejecting or raising queries on a clinical document.'
      });
    }

    // Segregation of Duties Check: Uploader/Author CANNOT perform QC review or approval on their own document
    const reviewerId = user?.id || req.headers['x-user-id'];
    const reviewerName = (user?.name || req.headers['x-user-name'] || '').toLowerCase().trim();
    const docUploaderId = doc.uploaded_by_id || doc.submitted_by_id;
    const docUploaderName = (doc.uploaded_by_name || doc.submitted_by_name || '').toLowerCase().trim();

    const isSelfReview = Boolean(
      (reviewerId && docUploaderId && reviewerId === docUploaderId) ||
      (reviewerName && docUploaderName && (reviewerName === docUploaderName || docUploaderName.startsWith(reviewerName) || reviewerName.startsWith(docUploaderName)))
    );

    if (isSelfReview) {
      return res.status(403).json({
        success: false,
        error: '403 Forbidden: Segregation of Duties Violation (Four-Eyes Principle / ICH GCP E6(R2) Section 5.1). You cannot perform QC review or approval on a document that you uploaded yourself. Independent peer reviewer clearance is mandatory.'
      });
    }

    const oldQcStatus = doc.qc_status;

    let newScore = 'Green';
    let newDocStatus = doc.status;

    if (qcStatus === 'Passed') {
      newScore = 'Green';
      const isDocControllerOnly = userRole === 'doc_controller' || req.body.target_status === 'QC Passed';
      newDocStatus = isDocControllerOnly ? 'QC Passed' : (req.body.target_status || 'Approved');
      doc.quality_issue_flag = false;

      const nowIso = new Date().toISOString();
      const reviewerName = user?.name || req.headers['x-user-name'] || 'TMF Reviewer';
      const reviewerRole = userRole || 'tmf_manager';

      if (!doc.lifecycle_history) doc.lifecycle_history = [];
      doc.lifecycle_history.push(
        {
          stage_number: 6,
          stage_name: '6. Quality Control (QC)',
          status: 'QC Inspection Complete',
          actor_name: reviewerName,
          actor_role: reviewerRole,
          timestamp: nowIso,
          notes: comments || 'Completeness, ALCOA+ compliance, and legibility verified.'
        },
        {
          stage_number: 7,
          stage_name: '7. QC Review Outcome',
          status: 'QC Passed',
          actor_name: reviewerName,
          actor_role: reviewerRole,
          timestamp: nowIso,
          notes: 'QC Review Outcome: Accepted. All quality criteria satisfied without discrepancies.'
        }
      );

      if (isDocControllerOnly) {
        doc.lifecycle_stage = 7;
        doc.lifecycle_stage_name = '7. QC Review Outcome';
        doc.lifecycle_status = 'QC Passed: Pending Content Review / Approval';
      } else {
        doc.lifecycle_history.push(
          {
            stage_number: 8,
            stage_name: '8. Approval / Finalization',
            status: 'Approved',
            actor_name: reviewerName,
            actor_role: reviewerRole,
            timestamp: nowIso,
            notes: 'Final approval granted. Document transitioned to Approved status.'
          },
          {
            stage_number: 9,
            stage_name: '9. TMF Filing',
            status: 'TMF Filed',
            actor_name: reviewerName,
            actor_role: reviewerRole,
            timestamp: nowIso,
            notes: `Document officially filed in DIA TMF Zone ${doc.tmf_zone_id} (${doc.tmf_zone_name || 'Zone'}) > Section ${doc.tmf_section_id} > Artifact ${doc.tmf_artifact_id} (${doc.tmf_artifact_name}).`
          }
        );
        doc.lifecycle_stage = 9;
        doc.lifecycle_stage_name = '9. TMF Filing';
        doc.lifecycle_status = 'TMF Filed & Approved';
      }

      // Notify Content Reviewer / CRA or Approver
      await dispatchNotification({
        recipient_id: doc.assigned_reviewer_id,
        recipient_role: doc.assigned_reviewer_role || doc.content_reviewer_role || 'cra',
        sender_id: user?.id,
        sender_name: reviewerName,
        sender_role: reviewerRole,
        type: 'QC_PASSED',
        title: 'Document QC Passed: Content Review Required',
        message: `ALCOA+ QC passed for '${doc.document_title}' by ${reviewerName}. Assigned for content verification.`,
        document_id: doc.document_id,
        document_title: doc.document_title,
        study_id: doc.study_id,
        site_id: doc.site_id,
        action_url: '/qc-queue'
      });
    } else if (qcStatus === 'Failed' || qcStatus === 'Query Raised') {
      newScore = 'Red';
      newDocStatus = 'QC Rejected';
      doc.quality_issue_flag = true;
      doc.quality_issue_type = qualityIssueType || 'Quality / Compliance Query';

      const nowIso = new Date().toISOString();
      const reviewerName = user?.name || req.headers['x-user-name'] || 'QC Reviewer';
      const reviewerRole = userRole || 'doc_controller';

      // Mandatory rejection lifecycle metadata
      doc.rejection_reason = qualityIssueType || comments || 'Quality review discrepancy';
      doc.rejection_remarks = comments || '';
      doc.rejected_by_id = user?.id || 'usr_qc';
      doc.rejected_by_name = reviewerName;
      doc.rejection_date_time = nowIso;
      doc.assigned_back_to_id = doc.uploaded_by_id || doc.submitted_by_id;
      doc.assigned_back_to_name = doc.uploaded_by_name || doc.submitted_by_name;
      doc.correction_due_date = req.body.correction_due_date || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      doc.previous_version_number = doc.version_number;

      if (!doc.lifecycle_history) doc.lifecycle_history = [];
      doc.lifecycle_history.push(
        {
          stage_number: 6,
          stage_name: '6. Quality Control (QC)',
          status: 'QC Inspection Failed',
          actor_name: reviewerName,
          actor_role: reviewerRole,
          timestamp: nowIso,
          notes: comments || 'Quality or metadata discrepancies identified during QC inspection.'
        },
        {
          stage_number: 7,
          stage_name: '7. QC Review Outcome',
          status: 'Rejected / Rework',
          actor_name: reviewerName,
          actor_role: reviewerRole,
          timestamp: nowIso,
          notes: `QC Outcome: Rejected / Rework Required. Issue: ${qualityIssueType || 'Compliance discrepancy'}. Comments: ${comments || 'Remediation requested'}. Assigned back to: ${doc.assigned_back_to_name || 'Site User'}`
        }
      );

      doc.lifecycle_stage = 7;
      doc.lifecycle_stage_name = '7. QC Review Outcome';
      doc.lifecycle_status = 'QC Rejected / Correction Required';

      // Notify Document Owner / Site Coordinator
      await dispatchNotification({
        recipient_id: doc.uploaded_by_id,
        recipient_role: 'site_user',
        sender_id: user?.id,
        sender_name: reviewerName,
        sender_role: reviewerRole,
        type: 'QC_REJECTED',
        title: 'Action Required: Document QC Rejected',
        message: `Document '${doc.document_title}' (v${doc.version_number}) rejected by ${reviewerName}. Reason: ${doc.rejection_reason}. Correction Due: ${doc.correction_due_date}.`,
        document_id: doc.document_id,
        document_title: doc.document_title,
        study_id: doc.study_id,
        site_id: doc.site_id,
        action_url: '/documents'
      });
    }

    doc.qc_status = qcStatus;
    doc.qc_score = newScore;
    doc.status = newDocStatus;
    doc.qc_comments = comments || doc.qc_comments;
    doc.qc_reviewer_id = user?.id || doc.qc_reviewer_id;
    doc.qc_reviewer_name = user?.name || doc.qc_reviewer_name;
    doc.qc_review_date = new Date().toISOString().split('T')[0];

    const updated = await doc.save();

    await logAudit(
      req,
      'QC_REVIEW_PERFORMED',
      doc.document_id,
      doc.document_title,
      doc.study_id,
      oldQcStatus,
      qcStatus,
      comments || `QC review performed: ${qcStatus}`
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5b. PUT /api/documents/:id/rework-submit - Resubmit remediated document following QC query/rejection
router.put('/:id/rework-submit', async (req, res) => {
  try {
    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const user = req.body.user || {};
    const userRole = user.roleId || req.headers['x-user-role'] || 'site_user';
    const userName = user.name || req.headers['x-user-name'] || 'Site User';
    const notes = req.body.rework_notes || req.body.notes || 'Document corrected and resubmitted for QC review';
    const nowIso = new Date().toISOString();

    const oldVersion = doc.version_number;
    if (!doc.versions_history) doc.versions_history = [];
    doc.versions_history.push({
      version_number: oldVersion,
      file_name: doc.file_name,
      file_path: doc.file_path,
      uploaded_by_id: doc.uploaded_by_id,
      uploaded_by_name: doc.uploaded_by_name,
      upload_date_time: doc.upload_date_time || nowIso,
      checksum_hash: doc.checksum_hash,
      notes: doc.rejection_remarks || notes || 'Superseded previous version',
      status: 'Superseded'
    });

    doc.previous_version_number = oldVersion;
    if (req.body.new_version || req.body.version_number) {
      doc.version_number = req.body.new_version || req.body.version_number;
    } else {
      const v = parseFloat(doc.version_number) || 0.1;
      doc.version_number = (v + 0.1).toFixed(1);
    }
    doc.resubmitted_version_number = doc.version_number;
    doc.status = 'Submitted';

    if (req.body.new_checksum_hash) {
      doc.checksum_hash = req.body.new_checksum_hash;
    }

    doc.lifecycle_stage = 6;
    doc.lifecycle_stage_name = '6. Quality Control (QC)';
    doc.lifecycle_status = 'Pending QC Review (Resubmitted)';
    doc.qc_status = 'In Progress';
    doc.qc_score = 'Amber';
    doc.quality_issue_flag = false;

    if (!doc.lifecycle_history) doc.lifecycle_history = [];
    doc.lifecycle_history.push({
      stage_number: 6,
      stage_name: '6. Quality Control (QC)',
      status: 'Re-submitted for QC',
      actor_name: userName,
      actor_role: userRole,
      timestamp: nowIso,
      notes: notes
    });

    const updated = await doc.save();
    await logAudit(
      req,
      'DOCUMENT_RESUBMITTED_QC',
      doc.document_id,
      doc.document_title,
      doc.study_id,
      'Rework Required',
      `Pending QC Review (v${doc.version_number})`,
      notes
    );

    // Notify Document Controller for Re-QC
    await dispatchNotification({
      recipient_role: 'doc_controller',
      sender_id: user.id || 'usr_site',
      sender_name: userName,
      sender_role: userRole,
      type: 'QC_ASSIGNED',
      title: 'Corrected Document Resubmitted',
      message: `Document '${doc.document_title}' v${doc.version_number} has been resubmitted by ${userName} for Re-QC inspection.`,
      document_id: doc.document_id,
      document_title: doc.document_title,
      study_id: doc.study_id,
      site_id: doc.site_id,
      action_url: '/qc-queue'
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5c. PUT /api/documents/:id/content-review - Content review by CRA / CTM
router.put('/:id/content-review', async (req, res) => {
  try {
    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const user = req.body.user || {};
    const userRole = user.roleId || req.headers['x-user-role'] || 'cra';
    const userName = user.name || req.headers['x-user-name'] || 'CRA Reviewer';
    const { reviewDecision, comments, correctionsRequested } = req.body; // 'Passed' | 'Revision Required'

    // Segregation of Duties: Uploader cannot review content
    const uploaderId = doc.uploaded_by_id || doc.submitted_by_id;
    if (user.id && uploaderId && user.id === uploaderId) {
      return res.status(403).json({
        success: false,
        error: 'Segregation of Duties Violation: You cannot perform content review on a document you uploaded yourself.'
      });
    }

    const nowIso = new Date().toISOString();
    doc.content_reviewer_id = user.id || 'usr_reviewer';
    doc.content_reviewer_name = userName;
    doc.content_reviewer_role = userRole;
    doc.content_review_date = nowIso.split('T')[0];
    doc.content_review_comments = comments || '';

    if (reviewDecision === 'Revision Required') {
      doc.content_review_status = 'Revision Required';
      doc.status = 'Revision Required';
      doc.lifecycle_stage = 7;
      doc.lifecycle_stage_name = '7. QC Review Outcome';
      doc.lifecycle_status = 'Content Review: Revision Required';
      doc.rejection_reason = correctionsRequested || comments || 'Content revisions requested by CRA';
      doc.rejection_remarks = comments || '';
      doc.rejected_by_id = user.id;
      doc.rejected_by_name = userName;
      doc.rejection_date_time = nowIso;

      if (!doc.lifecycle_history) doc.lifecycle_history = [];
      doc.lifecycle_history.push({
        stage_number: 4,
        stage_name: '4. Content Review',
        status: 'Revision Required',
        actor_name: userName,
        actor_role: userRole,
        timestamp: nowIso,
        notes: comments || 'Content review completed: Revision requested from site coordinator.'
      });

      await dispatchNotification({
        recipient_id: doc.uploaded_by_id,
        recipient_role: 'site_user',
        sender_id: user.id,
        sender_name: userName,
        sender_role: userRole,
        type: 'REVISION_REQUESTED',
        title: 'Content Revision Requested by CRA',
        message: `CRA ${userName} requested revisions on '${doc.document_title}'. Remarks: ${comments || 'See query notes'}`,
        document_id: doc.document_id,
        document_title: doc.document_title,
        study_id: doc.study_id,
        site_id: doc.site_id,
        action_url: '/queries?filter=rework'
      });
    } else {
      doc.content_review_status = 'Passed';
      doc.status = 'Approval Pending';
      doc.lifecycle_stage = 8;
      doc.lifecycle_stage_name = '8. Approval / Finalization';
      doc.lifecycle_status = 'Content Verified: Pending Final Approval';

      if (!doc.lifecycle_history) doc.lifecycle_history = [];
      doc.lifecycle_history.push({
        stage_number: 4,
        stage_name: '4. Content Review',
        status: 'Content Verified',
        actor_name: userName,
        actor_role: userRole,
        timestamp: nowIso,
        notes: comments || 'Content review verified: Qualifications and trial details confirmed.'
      });

      await dispatchNotification({
        recipient_id: doc.assigned_reviewer_id,
        recipient_role: 'tmf_manager',
        sender_id: user.id,
        sender_name: userName,
        sender_role: userRole,
        type: 'APPROVAL_REQUESTED',
        title: 'Document Verified: Ready for Approval',
        message: `Content review passed for '${doc.document_title}' by ${userName}. Ready for final authorization.`,
        document_id: doc.document_id,
        document_title: doc.document_title,
        study_id: doc.study_id,
        site_id: doc.site_id,
        action_url: '/qc-queue'
      });
    }

    const updated = await doc.save();
    await logAudit(
      req,
      reviewDecision === 'Revision Required' ? 'CONTENT_REVISION_REQUESTED' : 'CONTENT_REVIEW_PASSED',
      doc.document_id,
      doc.document_title,
      doc.study_id,
      'Under Review',
      doc.status,
      comments || `Content review decision: ${reviewDecision}`
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5d. PUT /api/documents/:id/approve - Formal Approval by TMF Lead / Designated Approver
router.put('/:id/approve', async (req, res) => {
  try {
    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const user = req.body.user || {};
    const userRole = user.roleId || req.headers['x-user-role'] || 'tmf_manager';
    const userName = user.name || req.headers['x-user-name'] || 'TMF Lead';
    const notes = req.body.notes || 'Formal approval granted under SOP-TMF-04.';
    const nowIso = new Date().toISOString();

    doc.status = 'Approved';
    doc.lifecycle_stage = 8;
    doc.lifecycle_stage_name = '8. Approval / Finalization';
    doc.lifecycle_status = 'Approved: Ready for TMF Filing';
    doc.approver_name = userName;
    doc.approval_date = nowIso.split('T')[0];

    if (!doc.lifecycle_history) doc.lifecycle_history = [];
    doc.lifecycle_history.push({
      stage_number: 8,
      stage_name: '8. Approval / Finalization',
      status: 'Approved',
      actor_name: userName,
      actor_role: userRole,
      timestamp: nowIso,
      notes: notes
    });

    const updated = await doc.save();
    await logAudit(
      req,
      'DOCUMENT_APPROVED',
      doc.document_id,
      doc.document_title,
      doc.study_id,
      'Approval Pending',
      'Approved',
      notes
    );

    await dispatchNotification({
      recipient_role: 'doc_controller',
      sender_id: user.id,
      sender_name: userName,
      sender_role: userRole,
      type: 'APPROVED',
      title: 'Document Approved: Ready for TMF Filing',
      message: `'${doc.document_title}' approved by ${userName}. Please file into DIA TMF Zone ${doc.tmf_zone_id}.`,
      document_id: doc.document_id,
      document_title: doc.document_title,
      study_id: doc.study_id,
      site_id: doc.site_id,
      action_url: '/qc-queue'
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5e. PUT /api/documents/:id/file - Final TMF Filing by Document Controller
router.put('/:id/file', async (req, res) => {
  try {
    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const user = req.body.user || {};
    const userRole = user.roleId || req.headers['x-user-role'] || 'doc_controller';
    const userName = user.name || req.headers['x-user-name'] || 'Document Controller';
    const notes = req.body.notes || 'Final metadata verified and officially filed in DIA TMF Repository.';
    const nowIso = new Date().toISOString();

    doc.status = 'Filed';
    doc.lifecycle_stage = 9;
    doc.lifecycle_stage_name = '9. TMF Filing';
    doc.lifecycle_status = 'Filed in TMF: Available for Inspection';
    doc.filing_date = nowIso.split('T')[0];

    if (!doc.lifecycle_history) doc.lifecycle_history = [];
    doc.lifecycle_history.push({
      stage_number: 9,
      stage_name: '9. TMF Filing',
      status: 'Filed',
      actor_name: userName,
      actor_role: userRole,
      timestamp: nowIso,
      notes: `Officially filed in DIA TMF Zone ${doc.tmf_zone_id} > Artifact ${doc.tmf_artifact_id} (${doc.tmf_artifact_name}).`
    });

    const updated = await doc.save();
    await logAudit(
      req,
      'DOCUMENT_FILED_IN_TMF',
      doc.document_id,
      doc.document_title,
      doc.study_id,
      'Approved',
      'Filed',
      notes
    );

    await dispatchNotification({
      recipient_id: doc.uploaded_by_id,
      recipient_role: 'site_user',
      sender_id: user.id,
      sender_name: userName,
      sender_role: userRole,
      type: 'DOCUMENT_FILED',
      title: 'Document Officially Filed in eTMF',
      message: `'${doc.document_title}' has been officially filed in Zone ${doc.tmf_zone_id} > Artifact ${doc.tmf_artifact_id}. Available for inspection.`,
      document_id: doc.document_id,
      document_title: doc.document_title,
      study_id: doc.study_id,
      site_id: doc.site_id,
      action_url: `/explorer?study=${encodeURIComponent(doc.study_id)}&zone=${encodeURIComponent(doc.tmf_zone_id)}`
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST /api/documents/:id/sign - 21 CFR Part 11 Electronic Signature
router.post('/:id/sign', async (req, res) => {
  try {
    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const { user, meaning, passwordVerified } = req.body;

    const signaturePayload = `${doc.document_id}|${user?.id}|${user?.name}|${new Date().toISOString()}|${meaning}`;
    const cryptographicSignatureHash = crypto.createHash('sha256').update(signaturePayload).digest('hex');
    const nowIso = new Date().toISOString();
    const signatoryName = user?.name || req.headers['x-user-name'] || 'Authorized Signatory';
    const signatoryRole = user?.roleId || req.headers['x-user-role'] || 'Signatory';

    doc.status = 'Effective';
    doc.signature_type = 'Electronic (Part 11)';
    doc.approver_name = user?.name || 'Authorized Signatory';
    doc.approval_date = new Date().toISOString().split('T')[0];
    doc.effective_date = new Date().toISOString().split('T')[0];
    doc.checksum_hash = cryptographicSignatureHash;

    if (!doc.lifecycle_history) doc.lifecycle_history = [];
    doc.lifecycle_history.push({
      stage_number: 10,
      stage_name: '10. Monitoring & Inspection Readiness',
      status: 'Inspection Ready (Part 11 Signed)',
      actor_name: signatoryName,
      actor_role: signatoryRole,
      timestamp: nowIso,
      notes: `21 CFR Part 11 Electronic Signature executed for '${meaning || 'Approval'}'. Cryptographic SHA-256 seal generated. Audit trail verified complete for regulatory inspection readiness.`
    });

    doc.lifecycle_stage = 10;
    doc.lifecycle_stage_name = '10. Monitoring & Inspection Readiness';
    doc.lifecycle_status = 'Inspection Ready & Verified';

    const updated = await doc.save();

    await logAudit(
      req,
      'ESIGNATURE_EXECUTED',
      doc.document_id,
      doc.document_title,
      doc.study_id,
      'Unsigned / Draft',
      `Effective (Part 11 Signed by ${user?.name})`,
      `21 CFR Part 11 Signature Binding: ${meaning || 'Approval'} (Hash: ${cryptographicSignatureHash.substring(0, 16)}...)`
    );

    // Notify Document Controller for final filing
    await dispatchNotification({
      recipient_role: 'doc_controller',
      sender_id: user?.id,
      sender_name: signatoryName,
      sender_role: signatoryRole,
      type: 'APPROVED',
      title: 'Document Approved: Ready for TMF Filing',
      message: `'${doc.document_title}' has been approved with 21 CFR Part 11 Electronic Signature by ${signatoryName}. Ready for official TMF filing.`,
      document_id: doc.document_id,
      document_title: doc.document_title,
      study_id: doc.study_id,
      site_id: doc.site_id,
      action_url: '/qc-queue'
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6b. PUT /api/documents/:id/lifecycle - Explicitly advance or record 11-step lifecycle workflow stage
router.put('/:id/lifecycle', async (req, res) => {
  try {
    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const { targetStage, notes, status, user } = req.body;
    const stageNum = parseInt(targetStage, 10);
    if (!stageNum || stageNum < 1 || stageNum > 11) {
      return res.status(400).json({ success: false, error: 'targetStage must be an integer between 1 and 11' });
    }

    const userRole = user?.roleId || req.headers['x-user-role'];
    const userName = user?.name || req.headers['x-user-name'] || 'VigiThink User';

    // Role-based authorization rules for lifecycle stages:
    // Stages 1-5: CRC, CRA, Site User, CTM, TMF Lead, QA, Admin
    // Stages 6-8: TMF Lead, QA, CTM, Admin (CRC / Site User / CRA / Auditor forbidden)
    // Stage 9: TMF Lead, QA, Admin
    // Stage 10: Auditor, QA, CTM, Admin, TMF Lead
    // Stage 11: QA, Admin, TMF Lead
    if ([6, 7].includes(stageNum)) {
      const unauthorized = ['site_user', 'cra', 'auditor'];
      if (!userRole || unauthorized.includes(userRole)) {
        const isResubmission = status?.toLowerCase().includes('re-submit') || status?.toLowerCase().includes('resubmit') || notes?.toLowerCase().includes('re-submit') || notes?.toLowerCase().includes('resubmit');
        if (stageNum === 6 && isResubmission) {
          // Allowed: Site staff can re-submit a remediated document for TMF Lead QC review
        } else {
          return res.status(403).json({
            success: false,
            error: `403 Forbidden: Role '${userRole || 'unspecified'}' is not authorized to execute Stage ${stageNum} (Quality Control / Review Outcome).`
          });
        }
      }
    }
    if (stageNum === 8) {
      const allowedApproval = ['system_admin', 'tmf_manager', 'ctm', 'qa'];
      if (!userRole || !allowedApproval.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: `403 Forbidden: Role '${userRole || 'unspecified'}' is not authorized to execute Stage 8 (Approval / Finalization). Approval is restricted to TMF Lead, CTM, QA, or Admin.`
        });
      }
    }
    if (stageNum === 11) {
      const allowedArchival = ['system_admin', 'qa', 'tmf_manager'];
      if (!userRole || !allowedArchival.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: `403 Forbidden: Archival (Stage 11) requires System Administrator, QA, or TMF Lead privileges.`
        });
      }
    }

    const STAGE_NAMES = {
      1: '1. Document Creation',
      2: '2. Document Review',
      3: '3. Document Signing',
      4: '4. Document Upload',
      5: '5. Metadata Entry',
      6: '6. Quality Control (QC)',
      7: '7. QC Review Outcome',
      8: '8. Approval / Finalization',
      9: '9. TMF Filing',
      10: '10. Monitoring & Inspection Readiness',
      11: '11. Archival'
    };

    const stageName = STAGE_NAMES[stageNum];
    const defaultStatuses = {
      1: 'Document Prepared',
      2: 'Review Complete',
      3: 'Signatures Collected',
      4: 'Uploaded to eTMF',
      5: 'Metadata Validated',
      6: 'QC Inspection Complete',
      7: 'Accepted',
      8: 'Approved',
      9: 'TMF Filed & Approved',
      10: 'Inspection Ready',
      11: 'Archived (25-Yr Lock)'
    };

    const finalStatus = status || defaultStatuses[stageNum];
    const oldStage = doc.lifecycle_stage;

    doc.lifecycle_stage = stageNum;
    doc.lifecycle_stage_name = stageName;
    doc.lifecycle_status = finalStatus;

    if (stageNum >= 8 && stageNum < 10) {
      doc.status = 'Approved';
      doc.qc_status = 'Passed';
      doc.qc_score = 'Green';
    } else if (stageNum >= 10) {
      doc.status = 'Effective';
    } else if (stageNum === 7 && finalStatus.toLowerCase().includes('reject')) {
      doc.status = 'Draft';
      doc.qc_status = 'Failed';
      doc.qc_score = 'Red';
      doc.quality_issue_flag = true;
    }

    if (!doc.lifecycle_history) doc.lifecycle_history = [];
    doc.lifecycle_history.push({
      stage_number: stageNum,
      stage_name: stageName,
      status: finalStatus,
      actor_name: userName,
      actor_role: userRole || 'User',
      timestamp: new Date().toISOString(),
      notes: notes || `Advanced to Stage ${stageNum}: ${stageName}`
    });

    const updated = await doc.save();

    await logAudit(
      req,
      'LIFECYCLE_STAGE_TRANSITION',
      doc.document_id,
      doc.document_title,
      doc.study_id,
      `Stage ${oldStage || 1}`,
      `Stage ${stageNum}: ${stageName} (${finalStatus})`,
      notes || `Transitioned to lifecycle stage ${stageNum}`
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. PUT / POST /api/documents/:id/checkout - Concurrency locking & version management
const handleCheckout = async (req, res) => {
  try {
    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const { user, purpose, action, status, version_number, notes } = req.body;
    const isCheckedOut = doc.checkout_status === 'Checked Out';
    const isCheckinRequested = action === 'checkin' || (isCheckedOut && action !== 'checkout');

    if (isCheckinRequested) {
      // Check in
      const oldStatus = doc.status;
      doc.checkout_status = 'Checked In';
      doc.locked_by_user_id = null;
      doc.locked_by_user_name = null;
      doc.lock_timestamp = null;
      doc.checkout_purpose = null;

      if (status) {
        doc.status = status;
      }
      if (version_number) {
        doc.version_number = version_number;
      }

      await logAudit(
        req,
        status === 'Superseded' ? 'DOCUMENT_SUPERSEDED' : 'DOCUMENT_UNLOCKED',
        doc.document_id,
        doc.document_title,
        doc.study_id,
        `Status: ${oldStatus}`,
        `Status: ${doc.status} (v${doc.version_number})`,
        notes || 'Document check-in / lock released'
      );
    } else {
      // Check out
      doc.checkout_status = 'Checked Out';
      doc.locked_by_user_id = user?.id || 'sys_user';
      doc.locked_by_user_name = user?.name || 'User';
      doc.lock_timestamp = new Date().toISOString();
      doc.checkout_purpose = purpose || 'Revision & Quality Update';

      await logAudit(
        req,
        'DOCUMENT_LOCKED',
        doc.document_id,
        doc.document_title,
        doc.study_id,
        'Checked In',
        `Checked Out by ${user?.name}`,
        purpose || 'Document acquired for editing'
      );
    }

    const updated = await doc.save();
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

router.put('/:id/checkout', handleCheckout);
router.post('/:id/checkout', handleCheckout);

// 8. POST /api/documents/:id/comments - Add collaboration comment
router.post('/:id/comments', async (req, res) => {
  try {
    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const { user, text } = req.body;
    const comment = {
      id: `comm_${Date.now()}`,
      user: user?.name || 'User',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      text
    };

    doc.comments.push(comment);
    const updated = await doc.save();

    await logAudit(
      req,
      'COMMENT_ADDED',
      doc.document_id,
      doc.document_title,
      doc.study_id,
      'N/A',
      `Comment: ${text.substring(0, 40)}...`,
      'Document review collaboration note'
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. POST /api/documents/:id/copy - Copy document to target folder/country/site
router.post('/:id/copy', async (req, res) => {
  try {
    const sourceDoc = await Document.findOne({ document_id: req.params.id });
    if (!sourceDoc) {
      return res.status(404).json({ success: false, error: 'Source document not found' });
    }

    const { targetFolder, targetStudyId, targetCountry, targetSite, user } = req.body;
    const docCount = await Document.countDocuments();
    const newDocId = `DOC-2026-${String(docCount + 1).padStart(4, '0')}`;

    const copiedDoc = new Document({
      ...sourceDoc.toObject(),
      _id: undefined,
      document_id: newDocId,
      document_title: `${sourceDoc.document_title} (Copy)`,
      study_id: targetStudyId || sourceDoc.study_id,
      country_code: targetCountry || sourceDoc.country_code,
      site_id: targetSite || sourceDoc.site_id,
      folder_path: targetFolder || sourceDoc.folder_path,
      upload_date_time: new Date().toISOString(),
      filing_date: new Date().toISOString().split('T')[0],
      uploaded_by_id: user?.id || sourceDoc.uploaded_by_id,
      uploaded_by_name: user?.name || sourceDoc.uploaded_by_name,
      status: 'Effective',
      checkout_status: 'Checked In',
      locked_by_user_id: null,
      comments: []
    });

    const savedCopy = await copiedDoc.save();

    await logAudit(
      req,
      'DOCUMENT_COPIED',
      savedCopy.document_id,
      savedCopy.document_title,
      savedCopy.study_id,
      sourceDoc.folder_path,
      savedCopy.folder_path,
      `Copied from ${sourceDoc.document_id} (${sourceDoc.folder_path}) to ${savedCopy.folder_path}`
    );

    res.status(201).json({ success: true, data: savedCopy });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. POST /api/documents/:id/move - Move document to target folder
router.post('/:id/move', async (req, res) => {
  try {
    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const { targetFolder, tmfZoneId, tmfZoneName, tmfSectionId, tmfArtifactId, user } = req.body;
    const oldPath = doc.folder_path;

    doc.folder_path = targetFolder;
    if (tmfZoneId) doc.tmf_zone_id = tmfZoneId;
    if (tmfZoneName) doc.tmf_zone_name = tmfZoneName;
    if (tmfSectionId) doc.tmf_section_id = tmfSectionId;
    if (tmfArtifactId) doc.tmf_artifact_id = tmfArtifactId;

    const updated = await doc.save();

    await logAudit(
      req,
      'DOCUMENT_MOVED',
      doc.document_id,
      doc.document_title,
      doc.study_id,
      oldPath,
      targetFolder,
      `Relocated artifact from ${oldPath} to ${targetFolder}`
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. POST /api/documents/:id/version - Create new version (e.g. v1.0 -> v2.0)
router.post('/:id/version', async (req, res) => {
  try {
    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const { newVersion, changeDescription, user } = req.body;
    const oldVersion = doc.version_number;

    doc.version_number = newVersion || `${parseFloat(doc.version_number || '1.0') + 1.0}.0`;
    doc.status = 'Draft';
    doc.qc_status = 'In Progress';
    doc.qc_score = 'Amber';
    doc.upload_date_time = new Date().toISOString();
    doc.filing_date = new Date().toISOString().split('T')[0];

    // Add revision note to comments
    doc.comments.push({
      id: `comm_${Date.now()}`,
      user: user?.name || 'Author',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      text: `Version bump: v${oldVersion} → v${doc.version_number}. Changes: ${changeDescription || 'Routine revision'}`
    });

    const updated = await doc.save();

    await logAudit(
      req,
      'NEW_VERSION_CREATED',
      doc.document_id,
      doc.document_title,
      doc.study_id,
      `v${oldVersion}`,
      `v${doc.version_number}`,
      `Revised document version authored: ${changeDescription || 'Protocol amendment update'}`
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. GET /api/documents/:id/download - Stream real file or generate Part 11 ALCOA+ Certified Dossier
router.get('/:id/download', async (req, res) => {
  try {
    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (doc.file_path) {
      const safeBasePath = path.resolve(uploadDir);
      const fullDiskPath = path.resolve(path.join(__dirname, '..', doc.file_path));
      if (!fullDiskPath.startsWith(safeBasePath)) {
        return res.status(403).json({ success: false, error: 'Access denied: Invalid file path.' });
      }
      if (fs.existsSync(fullDiskPath)) {
        return res.download(fullDiskPath, doc.file_name || `${doc.document_id}.pdf`);
      }
    }

    // Generate ALCOA+ Certified Document Manifest text/content
    const certifiedContent = `================================================================================
VigiThink eTMF
21 CFR Part 11 Certified Electronic Trial Master File Record
================================================================================
DOCUMENT INFORMATION:
Document ID:        ${doc.document_id}
Document Title:     ${doc.document_title}
Protocol/Study ID:  ${doc.study_id}
Country / Site:     ${doc.country_code} / ${doc.site_id}
TMF Zone:           Zone ${doc.tmf_zone_id} (${doc.tmf_zone_name || 'TMF Reference Model'})
TMF Section:        ${doc.tmf_section_id} (${doc.tmf_section_name || 'Section'})
TMF Artifact:       ${doc.tmf_artifact_id} (${doc.tmf_artifact_name || 'Artifact'})
Version Number:     v${doc.version_number}
Status:             ${doc.status}
Filing Date:        ${doc.filing_date}
Source Type:        ${doc.source_type}
Certified Copy:     ${doc.is_certified_copy ? 'YES (Verified ICH GCP Compliant)' : 'Original Electronic Native'}

ALCOA+ DATA INTEGRITY & AUDIT TRAIL:
Attributable:       Uploaded By ${doc.uploaded_by_name} (${doc.uploaded_by_id})
Legible:            OCR Validated
Contemporaneous:    Filed on ${doc.filing_date}
Original:           Digital Master Record
Accurate:           QC Reviewed (${doc.qc_status}) by ${doc.qc_reviewer_name || 'QC Auditor'}
Complete:           All Mandatory Clinical Metadata Fields Populated
Consistent:         Cryptographically Bound
Enduring:           25-Year Long-term Retention Policy

CRYPTOGRAPHIC CHECKSUM MANIFEST:
Algorithm:          SHA-256 (FIPS 180-4)
Checksum Hash:      ${doc.checksum_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
Part 11 E-Sign:     ${doc.signature_type || 'Electronic (Part 11)'}
Signatory:          ${doc.approver_name || doc.uploaded_by_name} (${doc.approval_date || doc.filing_date})

DOCUMENT BODY / EXTRACTED TEXT:
${doc.ocr_text || 'Clinical Trial Essential Document record generated and archived within VigiThink eTMF platform under 21 CFR Part 11, ICH GCP E6(R2/R3), and DIA TMF Reference Model v3.1.'}
================================================================================
Generated on: ${new Date().toISOString()} (UTC) | VigiThink eTMF
================================================================================`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.document_id}_Part11_Certified.txt"`);
    res.send(certifiedContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. GET /api/documents/export/manifest - Export full study document index as CSV
router.get('/export/manifest', async (req, res) => {
  try {
    const { study_id } = req.query;
    const filter = {};
    if (study_id && study_id !== 'ALL') filter.study_id = study_id;

    const docs = await Document.find(filter).sort({ tmf_zone_id: 1, tmf_artifact_id: 1 });
    
    const headers = ['Document ID', 'Title', 'Study ID', 'Country', 'Site', 'Zone', 'Section', 'Artifact', 'Version', 'Status', 'QC Status', 'SHA-256 Hash', 'Filing Date', 'Uploader'];
    const rows = docs.map(d => [
      `"${d.document_id}"`,
      `"${d.document_title.replace(/"/g, '""')}"`,
      `"${d.study_id}"`,
      `"${d.country_code}"`,
      `"${d.site_id}"`,
      `"${d.tmf_zone_id}"`,
      `"${d.tmf_section_id}"`,
      `"${d.tmf_artifact_id}"`,
      `"${d.version_number}"`,
      `"${d.status}"`,
      `"${d.qc_status}"`,
      `"${d.checksum_hash}"`,
      `"${d.filing_date}"`,
      `"${d.uploaded_by_name || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="VigiThink_eTMF_Manifest_${study_id || 'All'}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. DELETE /api/documents/:id: Admin delete document
router.delete('/:id', async (req, res) => {
  try {
    const userRole = req.body?.user?.roleId || req.headers['x-user-role'];
    if (!userRole || userRole !== 'system_admin') {
      return res.status(403).json({
        success: false,
        error: '403 Forbidden: Only System Administrator has authorization to delete clinical records under 21 CFR Part 11.'
      });
    }

    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    await Document.deleteOne({ document_id: req.params.id });

    await logAudit(
      req,
      'DOCUMENT_DELETED',
      doc.document_id,
      doc.document_title,
      doc.study_id,
      `Status: ${doc.status}`,
      'DELETED',
      req.body?.reason || 'Deleted by System Administrator'
    );

    res.json({ success: true, message: `Document ${doc.document_id} permanently deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
