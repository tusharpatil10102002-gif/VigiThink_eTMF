import mongoose from 'mongoose';
import crypto from 'crypto';

const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  timestamp: { type: String, required: true, default: () => new Date().toISOString() },
  user_id: { type: String, required: true },
  user_name: { type: String, required: true },
  user_role: { type: String, required: true },
  action: { 
    type: String, 
    required: true,
    index: true
  },
  target_type: { type: String, required: true },
  target_id: { type: String, required: true, index: true },
  target_title: { type: String, required: true },
  study_id: { type: String, required: true, index: true },
  old_value: { type: String, default: 'N/A' },
  new_value: { type: String, default: 'N/A' },
  ip_address: { type: String, default: '127.0.0.1' },
  reason: { type: String, required: true },
  hash_signature: { type: String }
}, {
  timestamps: true
});

// Pre-save hook to calculate cryptographic Part 11 integrity checksum
AuditLogSchema.pre('save', function () {
  if (!this.hash_signature) {
    const payload = `${this.id}|${this.timestamp}|${this.user_id}|${this.action}|${this.target_id}|${this.reason}`;
    this.hash_signature = crypto.createHash('sha256').update(payload).digest('hex');
  }
});

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
