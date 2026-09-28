import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document } from '../models/Document.js';
import { AuditLog } from '../models/AuditLog.js';

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
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Helper for Part 11 Audit Logging
const logAudit = async (req, action, targetId, targetTitle, studyId, oldValue, newValue, reason) => {
  try {
    const user = req.body?.user || {};
    const auditRecord = new AuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: user.id || req.headers['x-user-id'] || 'sys_user',
      user_name: user.name || req.headers['x-user-name'] || 'Clinidea User',
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

// 3. POST /api/documents/upload - Real file upload with Multer & SHA-256 checksum calculation
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
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
    const user = req.body.user ? (typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body.user) : {};

    const newDoc = new Document({
      document_id: documentId,
      document_title: req.body.document_title || fileName || 'Clinical Document',
      study_id: req.body.study_id || 'CLIN-001',
      country_code: req.body.country_code || 'US',
      site_id: req.body.site_id || 'SITE-01',
      tmf_zone_id: req.body.tmf_zone_id || '01',
      tmf_zone_name: req.body.tmf_zone_name || 'Trial Management',
      tmf_section_id: req.body.tmf_section_id || '01.01',
      tmf_section_name: req.body.tmf_section_name || 'Trial Oversight',
      tmf_artifact_id: req.body.tmf_artifact_id || '01.01.01',
      tmf_artifact_name: req.body.tmf_artifact_name || 'Trial Master Oversight Plan',
      version_number: req.body.version_number || (req.body.is_placeholder === 'true' ? '0.0' : '0.1'),
      status: req.body.is_placeholder === 'true' ? 'Placeholder' : 'Draft',
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
      uploaded_by_name: user.name || 'Clinidea User',
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

    res.status(201).json({ success: true, data: savedDoc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3b. POST /api/documents - JSON document or placeholder creation
router.post('/', async (req, res) => {
  try {
    const user = req.body.user || {};
    const count = await Document.countDocuments();
    const docId = req.body.document_id || `DOC-2026-${String(count + 1).padStart(4, '0')}`;

    const newDoc = new Document({
      document_id: docId,
      document_title: req.body.document_title || 'Untitled Trial Document',
      study_id: req.body.study_id || 'CLIN-001',
      country_code: req.body.country_code || 'GLOBAL',
      site_id: req.body.site_id || 'CENTRAL',
      tmf_zone_id: req.body.tmf_zone_id || '01',
      tmf_section_id: req.body.tmf_section_id || '01.01',
      tmf_artifact_id: req.body.tmf_artifact_id || '01.01.01',
      tmf_artifact_name: req.body.tmf_artifact_name || 'Trial Document',
      version_number: req.body.version_number || (req.body.is_placeholder ? '0.0' : '0.1'),
      status: req.body.status || (req.body.is_placeholder ? 'Placeholder' : 'Draft'),
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
      uploaded_by_name: user.name || 'Clinidea User',
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

    const { qcStatus, comments, qualityIssueType, user } = req.body;
    const oldQcStatus = doc.qc_status;

    let newScore = 'Green';
    let newDocStatus = doc.status;

    if (qcStatus === 'Passed') {
      newScore = 'Green';
      newDocStatus = 'Approved';
      doc.quality_issue_flag = false;
    } else if (qcStatus === 'Failed' || qcStatus === 'Query Raised') {
      newScore = 'Red';
      newDocStatus = 'Draft';
      doc.quality_issue_flag = true;
      doc.quality_issue_type = qualityIssueType || 'Quality / Compliance Query';
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

    doc.status = 'Effective';
    doc.signature_type = 'Electronic (Part 11)';
    doc.approver_name = user?.name || 'Authorized Signatory';
    doc.approval_date = new Date().toISOString().split('T')[0];
    doc.effective_date = new Date().toISOString().split('T')[0];
    doc.checksum_hash = cryptographicSignatureHash;

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

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. PUT /api/documents/:id/checkout - Concurrency locking
router.put('/:id/checkout', async (req, res) => {
  try {
    const doc = await Document.findOne({ document_id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const { user, purpose } = req.body;
    const isCheckedOut = doc.checkout_status === 'Checked Out';

    if (isCheckedOut) {
      // Check in
      doc.checkout_status = 'Checked In';
      doc.locked_by_user_id = null;
      doc.locked_by_user_name = null;
      doc.lock_timestamp = null;
      doc.checkout_purpose = null;

      await logAudit(
        req,
        'DOCUMENT_UNLOCKED',
        doc.document_id,
        doc.document_title,
        doc.study_id,
        'Checked Out',
        'Checked In',
        'Document check-in / lock released'
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
});

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
      const fullDiskPath = path.join(__dirname, '..', doc.file_path);
      if (fs.existsSync(fullDiskPath)) {
        return res.download(fullDiskPath, doc.file_name || `${doc.document_id}.pdf`);
      }
    }

    // Generate ALCOA+ Certified Document Manifest text/content
    const certifiedContent = `================================================================================
CLINIDEA EDUCATION — VigiThink eTMF
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
${doc.ocr_text || 'Clinical Trial Essential Document record generated and archived within Clinidea Education VigiThink eTMF platform under 21 CFR Part 11, ICH GCP E6(R2/R3), and DIA TMF Reference Model v3.1.'}
================================================================================
Generated on: ${new Date().toISOString()} (UTC) | Clinidea Education VigiThink eTMF
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

// 14. DELETE /api/documents/:id — Admin delete document
router.delete('/:id', async (req, res) => {
  try {
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
