import { AuditLog } from '../models/AuditLog.js';

// Never allowed to break the action it's logging — a failed audit write
// shouldn't turn a successful login into a 500.
export async function logAuditEvent(action, req, { userId, email, metadata } = {}) {
  try {
    await AuditLog.create({
      action,
      userId,
      email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      metadata,
    });
  } catch (err) {
    console.error('Failed to write audit log:', action, err);
  }
}
