import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies?.session;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  // Distinguishes a real session from an MFA challenge token (issued
  // pre-2FA, short-lived, handed back in a JSON body rather than set as
  // this cookie) — without this check, a leaked challenge token could be
  // pasted in as the session cookie and skip the second factor entirely.
  if (payload.purpose !== 'session') {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  // A signature check alone can't revoke a token before it expires — this
  // is what actually makes logout and password-change kill old sessions.
  // Costs one DB read per authenticated request; the alternative is a
  // stateless JWT that stays valid for up to 7 days no matter what.
  const user = await User.findById(payload.sub).select('tokenVersion');
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  req.userId = payload.sub;
  next();
}
