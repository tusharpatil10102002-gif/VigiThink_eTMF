import mongoose from 'mongoose';

const MilestoneSchema = new mongoose.Schema({
  study_id: { type: String, required: true, index: true },
  level: { type: String, default: 'Study' },
  folder: { type: String, required: true },
  seq: { type: String, required: true },
  milestone: { type: String, required: true },
  planned: { type: String, required: true },
  actual: { type: String, default: '' },
  status: { type: String, default: 'Pending' }
}, {
  timestamps: true
});

export const Milestone = mongoose.model('Milestone', MilestoneSchema);
