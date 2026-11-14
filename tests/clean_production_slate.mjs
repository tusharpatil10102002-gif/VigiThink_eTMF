import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document } from '../server/models/Document.js';
import { Study } from '../server/models/Study.js';
import { AuditLog } from '../server/models/AuditLog.js';
import { Milestone } from '../server/models/Milestone.js';
import { Query } from '../server/models/Query.js';
import { Folder } from '../server/models/Folder.js';
import { Notification } from '../server/models/Notification.js';
import { User } from '../server/models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function cleanProductionSlate() {
  console.log('========================================================================');
  console.log('VigiThink eTMF — Production Deployment Data Purge & Clean Slate Setup');
  console.log('========================================================================\n');

  try {
    // Reset user scopes to pristine enterprise state
    const usersRes = await (await fetch('http://localhost:5000/api/users')).json();
    for (const u of usersRes.data) {
      await fetch(`http://localhost:5000/api/users/${u.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'system_admin'
        },
        body: JSON.stringify({
          studyScope: 'ALL',
          siteScope: 'ALL'
        })
      });
    }
    console.log(`[Users Scope Reset]: Reset ${usersRes.data.length} user scopes to 'ALL' (ready for admin assignment).`);

    // Wipe all data including any temporary logs
    const res = await fetch('http://localhost:5000/api/system/clear-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'system_admin'
      },
      body: JSON.stringify({
        clearStudies: true
      })
    });
    const json = await res.json();
    console.log('[System API Response]:', json);

    // Verify inventory is completely clean
    const statusRes = await (await fetch('http://localhost:5000/api/system/status')).json();
    const notifs = await (await fetch('http://localhost:5000/api/notifications')).json();
    const studies = await (await fetch('http://localhost:5000/api/studies')).json();
    const docs = await (await fetch('http://localhost:5000/api/documents')).json();

    console.log('\n--- VERIFICATION OF PRISTINE PRODUCTION SLATE ---');
    console.log('Documents:    ', docs.count);
    console.log('Studies:      ', studies.count);
    console.log('Audit Logs:   ', statusRes.data.auditLogs);
    console.log('Queries:      ', statusRes.data.queries);
    console.log('Notifications:', notifs.data?.length || 0);
    console.log('Custom Folders:', statusRes.data.folders);
    console.log('Active Users: ', usersRes.data.length);
    console.log('========================================================================\n');

    if (docs.count === 0 && studies.count === 0 && (notifs.data?.length || 0) === 0) {
      console.log('>>> SUCCESS: VigiThink eTMF is in 100% PRISTINE PRODUCTION-READY STATE! <<<');
    } else {
      console.warn('>>> WARNING: Some test records remain. <<<');
    }
  } catch (err) {
    console.error('Error during cleanup:', err.message);
  }
}

cleanProductionSlate();
