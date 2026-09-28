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
  res.setHeader('X-Powered-By', 'Clinidea VigiThink eTMF 21-CFR-Part-11');
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

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/documents', documentsRouter);
app.use('/api/studies', studiesRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/milestones', milestonesRouter);
app.use('/api/queries', queriesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/system', systemRouter);
app.use('/api/users', usersRouter);
app.use('/api/folders', foldersRouter);

// System Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: process.env.NODE_ENV || 'production',
    application: 'Clinidea Education VigiThink eTMF API',
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
