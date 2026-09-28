import mongoose from 'mongoose';

const SiteSchema = new mongoose.Schema({
  id: { type: String, required: true },
  number: { type: String },
  name: { type: String, required: true },
  country: { type: String, default: 'India' },
  piName: { type: String, required: true },
  piLicense: { type: String },
  assignedStudent: { type: String },
  status: { type: String, default: 'Active' },
  targetEnrollment: { type: Number, default: 20 },
  actualEnrollment: { type: Number, default: 0 },
  enrolledCount: { type: Number, default: 0 },
  initiationDate: { type: String },
  activationDate: { type: String }
}, { _id: false });

const StudySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  shortName: { type: String, required: true },
  title: { type: String, required: true },
  protocolNumber: { type: String },
  version: { type: String, default: '1.0 (Final)' },
  phase: { type: String, required: true },
  therapeuticArea: { type: String, required: true },
  indication: { type: String },
  investigationalProduct: { type: String },
  comparator: { type: String },
  backgroundTherapy: { type: String },
  studyDesign: { type: String },
  sponsor: { type: String, required: true },
  cro: { type: String, required: true },
  status: { type: String, default: 'Active' },
  startDate: { type: String },
  targetEndDate: { type: String },
  estimatedCompletionDate: { type: String },
  targetEnrollment: { type: Number, default: 100 },
  actualEnrollment: { type: Number, default: 0 },
  currentEnrollment: { type: Number, default: 0 },
  filingLagDays: { type: Number, default: 0 },
  countries: { type: Array, default: [] },
  milestones: { type: Array, default: [] },
  sites: [SiteSchema]
}, {
  timestamps: true
});

export const Study = mongoose.model('Study', StudySchema);
