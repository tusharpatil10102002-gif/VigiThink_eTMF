import bcrypt from 'bcryptjs';
import { Document } from '../models/Document.js';
import { Study } from '../models/Study.js';
import { AuditLog } from '../models/AuditLog.js';
import { Milestone } from '../models/Milestone.js';
import { User } from '../models/User.js';
import { INITIAL_STUDIES } from '../../src/data/initialStudiesData.js';
import { INITIAL_DOCUMENTS, INITIAL_AUDIT_LOGS } from '../../src/data/initialDocumentsData.js';
import { DEMO_USERS } from '../../src/data/initialRolesData.js';

const INITIAL_MILESTONES = [
  { study_id: "CLIN-001", level: "Study", folder: "CE-QVJ499-2026-001", seq: "1", milestone: "01 Protocol Version 1.2 Final Approval & IEC Submission", planned: "2026-09-25", actual: "2026-09-25", status: "Completed" },
  { study_id: "CLIN-001", level: "Study", folder: "CE-QVJ499-2026-001", seq: "2", milestone: "02 CTRI Prospective Trial Registration", planned: "2026-09-28", actual: "2026-09-28", status: "Completed" },
  { study_id: "CLIN-001", level: "Study", folder: "CE-QVJ499-2026-001", seq: "3", milestone: "03 6 Training Sites Activation & DOA Log Filing", planned: "2026-10-01", actual: "", status: "In Progress" },
  { study_id: "CLIN-001", level: "Study", folder: "CE-QVJ499-2026-001", seq: "4", milestone: "04 Visit 1 Screening & Open-Label Travoprost Run-In", planned: "2026-10-15", actual: "", status: "Pending" },
  { study_id: "CLIN-001", level: "Study", folder: "CE-QVJ499-2026-001", seq: "5", milestone: "05 Visit 3 Randomization (1:1 via IRT) & Masked Dosing", planned: "2026-11-15", actual: "", status: "Pending" },
  { study_id: "CLIN-001", level: "Study", folder: "CE-QVJ499-2026-001", seq: "6", milestone: "06 Visit 4 Day 14 Interim Safety Assessment", planned: "2026-12-01", actual: "", status: "Pending" },
  { study_id: "CLIN-001", level: "Study", folder: "CE-QVJ499-2026-001", seq: "7", milestone: "07 Visit 5 Day 42 (Week 6) Diurnal IOP Primary Endpoint", planned: "2027-01-15", actual: "", status: "Pending" },
  { study_id: "CLIN-001", level: "Study", folder: "CE-QVJ499-2026-001", seq: "8", milestone: "08 Database Lock, Unmasking & Statistical Analysis", planned: "2027-03-01", actual: "", status: "Pending" },
  { study_id: "CLIN-001", level: "Study", folder: "CE-QVJ499-2026-001", seq: "9", milestone: "09 Clinical Study Report (CSR) Sign-off & 15-Yr Archival", planned: "2027-06-30", actual: "", status: "Pending" }
];

export const seedDatabase = async (force = false) => {
  try {
    const shouldSeedDemo = force === true;

    // 1. Seed & Migrate Users with bcrypt encryption
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      for (const rawUser of DEMO_USERS) {
        const hashedPassword = await bcrypt.hash(rawUser.password, 10);
        const newUser = new User({ ...rawUser, password: hashedPassword });
        await newUser.save();
      }
      console.log(`[Seeder] Seeded ${DEMO_USERS.length} VigiThink eTMF Users with bcrypt password hashing.`);
    } else {
      // Migrate existing unhashed passwords to bcrypt
      const existingUsers = await User.find({});
      let migratedCount = 0;
      for (const u of existingUsers) {
        if (u.password && !u.password.startsWith('$2a$') && !u.password.startsWith('$2b$')) {
          u.password = await bcrypt.hash(u.password, 10);
          await u.save();
          migratedCount++;
        }
      }
      if (migratedCount > 0) {
        console.log(`[Seeder] Migrated ${migratedCount} user passwords to enterprise bcrypt hashing.`);
      }
    }

    // 2. Studies: Left to System Administrator to create as needed; only seeded if explicitly forced (force === true)
    if (force === true) {
      const studyCount = await Study.countDocuments();
      if (studyCount === 0) {
        const formattedStudies = INITIAL_STUDIES.map(s => ({
          id: s.id,
          shortName: s.shortName,
          title: s.title,
          protocolNumber: s.protocolNumber,
          version: s.version || "1.2 (Final)",
          phase: s.phase,
          therapeuticArea: s.therapeuticArea,
          indication: s.indication,
          investigationalProduct: s.investigationalProduct,
          comparator: s.comparator,
          backgroundTherapy: s.backgroundTherapy,
          studyDesign: s.studyDesign,
          sponsor: s.sponsor || "VigiThink Therapeutics",
          cro: s.cro || "VigiThink Clinical Operations",
          status: s.status || "Active",
          startDate: s.startDate,
          targetEndDate: s.targetEndDate,
          targetEnrollment: s.targetEnrollment || 100,
          actualEnrollment: s.currentEnrollment || 0,
          filingLagDays: s.filingLagDays || 0,
          countries: s.countries || [],
          milestones: s.milestones || [],
          sites: (s.countries || []).flatMap(c => (c.sites || []).map(st => ({
            id: st.id,
            number: st.number,
            name: st.name,
            country: c.name,
            piName: st.piName,
            piLicense: st.piLicense,
            assignedStudent: st.assignedStudent,
            status: st.status,
            targetEnrollment: st.targetEnrollment,
            actualEnrollment: st.enrolledCount,
            initiationDate: st.activationDate
          })))
        }));
        await Study.insertMany(formattedStudies);
        console.log(`[Seeder] Initialized ${formattedStudies.length} Clinical Study Protocols in MongoDB.`);
      }
    }

    // 3. Seed Milestones for Protocols
    const milestoneCount = await Milestone.countDocuments();
    if (milestoneCount === 0) {
      await Milestone.insertMany(INITIAL_MILESTONES);
      console.log(`[Seeder] Seeded ${INITIAL_MILESTONES.length} Protocol Milestones into MongoDB.`);
    }

    if (shouldSeedDemo) {
      const docCount = await Document.countDocuments();
      if (docCount === 0) {
        const cleanDocs = INITIAL_DOCUMENTS.map(d => ({
          ...d,
          file_size: typeof d.file_size === 'string' ? parseFloat(d.file_size) * 1024 * 1024 || 1024000 : d.file_size
        }));
        await Document.insertMany(cleanDocs);
        console.log(`[Seeder] Seeded ${cleanDocs.length} DIA TMF Documents into MongoDB.`);
      }

      const auditCount = await AuditLog.countDocuments();
      if (auditCount === 0) {
        await AuditLog.insertMany(INITIAL_AUDIT_LOGS);
        console.log(`[Seeder] Seeded ${INITIAL_AUDIT_LOGS.length} 21 CFR Part 11 Audit Logs into MongoDB.`);
      }
    } else {
      console.log('[Seeder] Clean slate mode: 0 test documents, 0 fake logs seeded. Studies & Student Credentials ready for live testing.');
    }

    // Backfill lifecycle_stage and lifecycle_history for any existing documents
    const unmigratedDocs = await Document.find({ $or: [{ lifecycle_stage: { $exists: false } }, { lifecycle_stage: null }] });
    if (unmigratedDocs.length > 0) {
      for (const d of unmigratedDocs) {
        if (d.status === 'Effective') {
          d.lifecycle_stage = 10;
          d.lifecycle_stage_name = '10. Monitoring & Inspection Readiness';
          d.lifecycle_status = 'Inspection Ready';
        } else if (d.status === 'Approved') {
          d.lifecycle_stage = 9;
          d.lifecycle_stage_name = '9. TMF Filing';
          d.lifecycle_status = 'TMF Filed & Approved';
        } else if (d.is_placeholder) {
          d.lifecycle_stage = 1;
          d.lifecycle_stage_name = '1. Document Creation';
          d.lifecycle_status = 'Placeholder Created';
        } else {
          d.lifecycle_stage = 5;
          d.lifecycle_stage_name = '5. Metadata Entry';
          d.lifecycle_status = 'Metadata Validated - Ready for QC';
        }

        if (!d.lifecycle_history || d.lifecycle_history.length === 0) {
          d.lifecycle_history = [
            { stage_number: 1, stage_name: '1. Document Creation', status: 'Document Prepared', actor_name: d.uploaded_by_name || 'Site User', actor_role: 'site_user', timestamp: d.upload_date_time || new Date().toISOString(), notes: 'Document authored & prepared according to GCP guidelines.' },
            { stage_number: 2, stage_name: '2. Document Review', status: 'Content Verified', actor_name: d.uploaded_by_name || 'Site User', actor_role: 'site_user', timestamp: d.upload_date_time || new Date().toISOString(), notes: 'Responsible person verification completed.' },
            { stage_number: 3, stage_name: '3. Document Signing', status: 'Signatures Collected', actor_name: d.uploaded_by_name || 'Site User', actor_role: 'site_user', timestamp: d.upload_date_time || new Date().toISOString(), notes: 'Signatures collected & verified on document.' },
            { stage_number: 4, stage_name: '4. Document Upload', status: 'Uploaded to eTMF', actor_name: d.uploaded_by_name || 'Site User', actor_role: 'site_user', timestamp: d.upload_date_time || new Date().toISOString(), notes: 'Document file uploaded to eTMF repository.' },
            { stage_number: 5, stage_name: '5. Metadata Entry', status: 'Metadata Validated', actor_name: d.uploaded_by_name || 'Site User', actor_role: 'site_user', timestamp: d.upload_date_time || new Date().toISOString(), notes: 'DIA TMF Reference Model metadata indexing completed.' }
          ];
        }
        await d.save();
      }
      console.log(`[Seeder] Successfully backfilled 11-step lifecycle workflow fields for ${unmigratedDocs.length} documents.`);
    }
  } catch (error) {
    console.error('[Seeder] Error seeding database:', error);
  }
};
