import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  loginId: { type: String, required: true, index: true },
  email: { type: String, required: true, index: true },
  password: { type: String, required: true },
  mobile: { type: String, default: '' },
  course: { type: String, default: 'Clinical Research & Pharmacovigilance' },
  position: { type: String, default: 'Student' },
  roleId: { type: String, required: true },
  trainingRole: { type: String, default: '' },
  organization: { type: String, default: 'Clinidea Education' },
  title: { type: String, default: '' },
  studyScope: { type: String, default: 'CLIN-001' },
  countryScope: { type: String, default: 'India' },
  siteScope: { type: String, default: 'ALL' },
  assignedSite: { type: String, default: '' },
  primaryResponsibility: { type: String, default: '' },
  accessPrinciple: { type: String, default: 'Least privilege' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const User = mongoose.model('User', UserSchema);
