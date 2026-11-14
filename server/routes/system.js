import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document } from '../models/Document.js';
import { Study } from '../models/Study.js';
import { AuditLog } from '../models/AuditLog.js';
import { Milestone } from '../models/Milestone.js';
import { Query } from '../models/Query.js';
import { Folder } from '../models/Folder.js';
import { Notification } from '../models/Notification.js';
import { seedDatabase } from '../data/seeder.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../uploads');

// GET /api/system/status: Current database record counts
router.get('/status', async (req, res) => {
  try {
    const [documentsCount, studiesCount, auditLogsCount, queriesCount, milestonesCount, foldersCount] = await Promise.all([
      Document.countDocuments(),
      Study.countDocuments(),
      AuditLog.countDocuments(),
      Query.countDocuments(),
      Milestone.countDocuments(),
      Folder.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        documents: documentsCount,
        studies: studiesCount,
        auditLogs: auditLogsCount,
        queries: queriesCount,
        milestones: milestonesCount,
        folders: foldersCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/system/clear-data: Wipe all test documents, folders, uploaded files, audit logs, queries, milestones (Admin Only)
router.post('/clear-data', async (req, res) => {
  try {
    const userRole = req.body?.adminUser?.roleId || req.body?.user?.roleId || req.headers['x-user-role'];
    if (userRole !== 'system_admin') {
      return res.status(403).json({
        success: false,
        error: '403 Forbidden: Only System Administrator has authorization to execute system maintenance or data clear.'
      });
    }

    const { clearStudies } = req.body || {};

    await Promise.all([
      Document.deleteMany({}),
      AuditLog.deleteMany({}),
      Milestone.deleteMany({}),
      Query.deleteMany({}),
      Folder.deleteMany({}),
      Notification.deleteMany({})
    ]);

    if (clearStudies) {
      await Study.deleteMany({});
    }

    // Delete all uploaded physical files in server/uploads
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          try {
            fs.unlinkSync(path.join(uploadDir, file));
          } catch (unlinkErr) {
            // ignore file lock error
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'All documents, custom folders, uploaded files, milestones, queries, and audit logs have been completely wiped. System is clean and ready for live production use.',
      clearedStudies: !!clearStudies
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/system/reset-demo: Re-seed demo dataset if needed (Admin Only)
router.post('/reset-demo', async (req, res) => {
  try {
    const userRole = req.body?.adminUser?.roleId || req.body?.user?.roleId || req.headers['x-user-role'];
    if (userRole !== 'system_admin') {
      return res.status(403).json({
        success: false,
        error: '403 Forbidden: Only System Administrator has authorization to execute demo system reset.'
      });
    }

    await Promise.all([
      Document.deleteMany({}),
      Study.deleteMany({}),
      AuditLog.deleteMany({}),
      Milestone.deleteMany({}),
      Query.deleteMany({})
    ]);

    await seedDatabase(true);

    res.json({
      success: true,
      message: 'Demo clinical trial dataset restored successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
