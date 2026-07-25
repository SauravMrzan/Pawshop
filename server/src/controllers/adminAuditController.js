import { AuditLog } from '../models/AuditLog.js';

export async function listAuditLogs(_req, res) {
  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('userId', 'email');

  return res.json({
    logs: logs.map((l) => ({
      id: l._id,
      action: l.action,
      email: l.userId?.email || l.email,
      ip: l.ip,
      metadata: l.metadata,
      createdAt: l.createdAt,
    })),
  });
}
