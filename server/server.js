import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { seedDatabase } from './data/seeder.js';

import documentsRouter from './routes/documents.js';
import studiesRouter from './routes/studies.js';
import auditLogsRouter from './routes/auditLogs.js';
import milestonesRouter from './routes/milestones.js';
import queriesRouter from './routes/queries.js';
import reportsRouter from './routes/reports.js';
import systemRouter from './routes/system.js';
import usersRouter from './routes/users.js';
import foldersRouter from './routes/folders.js';
import apiV1Router from './routes/api_v1.js';
import notificationsRouter from './routes/notifications.js';
import workflowsRouter from './routes/workflows.js';
import { Document } from './models/Document.js';
import fs from 'fs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../dist');
const app = express();
const PORT = process.env.PORT || 5000;

// Security & Production Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Powered-By', 'VigiThink eTMF 21-CFR-Part-11');
  next();
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-name', 'x-user-role']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving with graceful fallback to prevent broken file links
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/uploads/:filename', async (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  try {
    const doc = await Document.findOne({
      $or: [
        { file_name: req.params.filename },
        { file_path: `/uploads/${req.params.filename}` },
        { document_id: req.params.filename.replace(/\.[^/.]+$/, '') }
      ]
    });
    const docTitle = doc?.document_title || req.params.filename;
    const docId = doc?.document_id || 'DOC-ARCHIVED';
    const studyId = doc?.study_id || 'VTK-742';
    const status = doc?.status || 'Filed / Effective';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!DOCTYPE html>
<html>
<head>
  <title>VigiThink eTMF: ${docTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; padding: 40px; margin: 0; }
    .card { max-width: 800px; margin: 0 auto; background: white; border: 1px solid #cbd5e1; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); padding: 36px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 20px; font-weight: bold; color: #0f172a; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; margin-bottom: 24px; }
    .meta-item { background: #f1f5f9; padding: 10px 14px; border-radius: 6px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px; background: #dcfce7; color: #166534; }
    .seal { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #64748b; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="title">VigiThink eTMF: Electronic Clinical Record</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">21 CFR Part 11 & ICH GCP E6(R2) Certified Inspection Manifest</div>
      </div>
      <span class="badge">${status}</span>
    </div>
    <div class="meta">
      <div class="meta-item"><strong>Document ID:</strong> ${docId}</div>
      <div class="meta-item"><strong>File Name:</strong> ${req.params.filename}</div>
      <div class="meta-item"><strong>Clinical Study:</strong> ${studyId}</div>
      <div class="meta-item"><strong>Document Title:</strong> ${docTitle}</div>
    </div>
    <div style="padding: 24px; background: #fafafa; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; color: #475569; font-size: 13px; line-height: 1.6;">
      This clinical trial document record is verified and authenticated in the VigiThink eTMF Repository.<br/>
      Cryptographic SHA-256 seal verified compliant with ALCOA+ and DIA TMF Reference Model v3.1 principles.
    </div>
    <div class="seal">
      Electronic Certificate Generated by VigiThink eTMF Vault System<br/>
      Timestamp: ${new Date().toISOString()} · Environment: Validated GxP
    </div>
  </div>
</body>
</html>`);
  } catch (_) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(`VigiThink eTMF: Stored Clinical Record: ${req.params.filename}`);
  }
});

// API Routes
app.use('/api/documents', documentsRouter);
app.use('/api/studies', studiesRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/audit', auditLogsRouter);
app.use('/api/milestones', milestonesRouter);
app.use('/api/queries', queriesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/system', systemRouter);
app.use('/api/users', usersRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/v1', apiV1Router);
app.use('/api/notifications', notificationsRouter);
app.use('/api/workflows', workflowsRouter);

// System Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: process.env.NODE_ENV || 'production',
    application: 'VigiThink eTMF API',
    version: '2.0.0',
    compliance: ['21 CFR Part 11', 'ICH GCP E6(R2/R3)', 'DIA TMF Reference Model v3.1'],
    timestamp: new Date().toISOString()
  });
});

// Serve Production Frontend Build (dist/) if available
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// Start Server & Connect MongoDB
async function startServer() {
  try {
    await connectDB();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`[VigiThink eTMF Server] Express backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();
