import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.session;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    req.userId = jwt.verify(token, env.jwtSecret).sub;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}
