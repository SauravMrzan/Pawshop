import { User } from '../models/User.js';

// Looks up the user's current role fresh from the DB rather than trusting
// the JWT payload, so a demoted admin loses access immediately rather than
// waiting for their session to expire.
export async function requireAdmin(req, res, next) {
  const user = await User.findById(req.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}
