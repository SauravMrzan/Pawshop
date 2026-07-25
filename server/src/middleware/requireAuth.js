import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.session;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    // Distinguishes a real session from an MFA challenge token (issued
    // pre-2FA, short-lived, handed back in a JSON body rather than set as
    // this cookie) — without this check, a leaked challenge token could be
    // pasted in as the session cookie and skip the second factor entirely.
    if (payload.purpose !== 'session') {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}
