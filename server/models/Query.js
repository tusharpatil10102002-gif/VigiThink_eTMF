import mongoose from 'mongoose';

const QuerySchema = new mongoose.Schema({
  query_id: { type: String, required: true, unique: true, index: true },
  document_id: { type: String, required: true, index: true },
  study_id: { type: String, required: true, index: true },
  issue_type: { type: String, required: true },
  comment: { type: String, required: true },
  raised_by_id: { type: String, required: true },
  raised_by_name: { type: String, required: true },
  raised_date: { type: String, default: () => new Date().toISOString() },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  response: { type: String, default: '' },
  resolved_by_name: { type: String },
  resolved_date: { type: String }
}, {
  timestamps: true
});

export const Query = mongoose.model('Query', QuerySchema);
