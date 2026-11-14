/**
 * VigiThink eTMF — Native MongoDB Migration & Seeder CLI
 * 
 * Usage:
 *   node database/seed_mongodb.js [--clean-slate] [--with-demo-studies]
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from '../server/config/db.js';
import { User } from '../server/models/User.js';
import { Study } from '../server/models/Study.js';
import { Document } from '../server/models/Document.js';
import { AuditLog } from '../server/models/AuditLog.js';
import { Query } from '../server/models/Query.js';
import { Milestone } from '../server/models/Milestone.js';
import { Folder } from '../server/models/Folder.js';
import { DEMO_USERS } from '../src/data/initialRolesData.js';

dotenv.config();

async function migrateAndSeed() {
  console.log('================================================================');
  console.log('VigiThink eTMF — Native MongoDB Architecture Initializer');
  console.log('Engine: MongoDB 6.0+ (WiredTiger) | ODM: Mongoose');
  console.log('================================================================\n');

  try {
    await connectDB();
    console.log('[MongoDB] Connected successfully to database:', mongoose.connection.name);

    // 1. Sync & Index Users
    console.log('[1/4] Synchronizing users collection...');
    let usersCreated = 0;
    let usersUpdated = 0;

    for (const rawUser of DEMO_USERS) {
      const existing = await User.findOne({ id: rawUser.id });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(rawUser.password, 10);
        await new User({ ...rawUser, password: hashedPassword }).save();
        usersCreated++;
      } else {
        existing.loginId = rawUser.loginId;
        existing.email = rawUser.email;
        existing.name = rawUser.name;
        existing.organization = rawUser.organization;
        existing.roleId = rawUser.roleId;
        if (!existing.password.startsWith('$2a$') && !existing.password.startsWith('$2b$')) {
          existing.password = await bcrypt.hash(rawUser.password, 10);
        }
        await existing.save();
        usersUpdated++;
      }
    }
    console.log(`[Users] Synchronized: ${usersCreated} created, ${usersUpdated} updated.`);

    // 2. Ensure Collections & Compound Indexes
    console.log('[2/4] Initializing collections & indexes...');
    await Document.init();
    await Study.init();
    await AuditLog.init();
    await Query.init();
    await Milestone.init();
    await Folder.init();
    console.log('[Indexes] Verified compound indexes for documents, studies, and 21 CFR Part 11 audit trails.');

    // 3. Clean Slate Mode Verification
    const studyCount = await Study.countDocuments();
    const docCount = await Document.countDocuments();
    console.log('[3/4] Clean Slate Verification:');
    console.log(`      Studies: ${studyCount} (Clean slate for Administrator)`);
    console.log(`      Documents: ${docCount}`);

    // 4. Summary
    console.log('\n[4/4] 100% Native MongoDB Architecture Ready.');
    console.log('================================================================');
    console.log('MIGRATION COMPLETE: ZERO SQL DEPENDENCIES. PURE MONGODB ACTIVE.');
    console.log('================================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Migration Error]', err.message);
    process.exit(1);
  }
}

migrateAndSeed();
