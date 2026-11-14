import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  loginId: { type: String, required: true, index: true },
  email: { type: String, required: true, index: true },
  password: { type: String, required: true },
  mobile: { type: String, default: '' },
  department: { type: String, default: 'Clinical Operations' },
  course: { type: String, default: 'Good Clinical Practice (GCP) Certified' },
  position: { type: String, default: 'Clinical Research Associate' },
  roleId: { type: String, required: true },
  trainingRole: { type: String, default: '' },
  organization: { type: String, default: 'VigiThink Clinical Research' },
  title: { type: String, default: '' },
  studyScope: { type: String, default: '' },
  countryScope: { type: String, default: 'India' },
  siteScope: { type: String, default: 'ALL' },
  assignedSite: { type: String, default: '' },
  primaryResponsibility: { type: String, default: '' },
  accessPrinciple: { type: String, default: 'Least privilege' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Pre-save hook: Hash password with bcrypt before persisting
UserSchema.pre('save', async function() {
  if (this.isModified('password')) {
    if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
});

// Instance method: Verify candidate password against one-way bcrypt hash
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return await bcrypt.compare(candidatePassword, this.password);
  }
  return candidatePassword === this.password;
};

// Security: Strip password from JSON serialization so hashes are never exposed via API
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  }
});

export const User = mongoose.model('User', UserSchema);
