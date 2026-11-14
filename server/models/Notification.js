import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true, 
    unique: true, 
    default: () => `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` 
  },
  recipient_id: { type: String, index: true },
  recipient_role: { type: String, index: true },
  sender_id: { type: String },
  sender_name: { type: String },
  sender_role: { type: String },
  type: { 
    type: String, 
    required: true,
    enum: [
      'DOCUMENT_SUBMITTED',
      'QC_ASSIGNED',
      'QC_REJECTED',
      'QC_PASSED',
      'REVIEW_ASSIGNED',
      'REVISION_REQUESTED',
      'APPROVAL_REQUESTED',
      'APPROVED',
      'DOCUMENT_FILED',
      'OVERDUE_ALERT',
      'SYSTEM_ALERT'
    ],
    index: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  document_id: { type: String, index: true },
  document_title: { type: String },
  study_id: { type: String, index: true },
  site_id: { type: String },
  read: { type: Boolean, default: false, index: true },
  action_url: { type: String, default: '/explorer' }
}, {
  timestamps: true
});

export const Notification = mongoose.model('Notification', NotificationSchema);
