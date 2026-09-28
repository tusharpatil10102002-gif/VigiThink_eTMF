import mongoose from 'mongoose';

const FolderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  study_id: { type: String, default: 'ALL', index: true },
  tmf_zone_id: { type: String, default: null },
  tmf_section_id: { type: String, default: null },
  site_id: { type: String, default: null },
  created_by_id: { type: String, default: 'sys_user' },
  created_by: { type: String, default: 'TMF User' },
  created_by_role: { type: String, default: 'TMF Manager' },
  created_at: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, {
  timestamps: true
});

export const Folder = mongoose.model('Folder', FolderSchema);
