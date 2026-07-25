import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String },
  ip: { type: String },
  userAgent: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  // TTL index — auto-expires entries after 90 days so the collection
  // doesn't grow unbounded; this is a rolling security log, not an archive.
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 },
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
