import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  priority: { type: Number, default: 0 },
  permissions: [{ type: String }],
  panelAccess: [{ type: String }]
}, { timestamps: true });

export const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);
