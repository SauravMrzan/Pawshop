import argon2 from 'argon2';
import { User } from '../models/User.js';
import { isValidObjectId, isNonEmptyString } from '../utils/validation.js';

export async function listUsers(_req, res) {
  const users = await User.find().select('email role createdAt').sort({ createdAt: -1 });
  return res.json({
    users: users.map((u) => ({ id: u._id, email: u.email, role: u.role, createdAt: u.createdAt })),
  });
}

// role is never read from the request body — there is exactly one admin
// account, and the only way to create it is the one-off mongosh command.
// Every account created here is a plain 'user', same as the schema default.
export async function createUser(req, res) {
  const { email, password } = req.body;

  if (!isNonEmptyString(email, 254)) {
    return res.status(400).json({ message: 'Email is required' });
  }
  if (!isNonEmptyString(password, 200) || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await User.create({ email: normalizedEmail, passwordHash });

  return res.status(201).json({ user: { id: user._id, email: user.email, role: user.role } });
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (id === req.userId) {
    return res.status(400).json({ message: 'Use the account settings page to delete your own account' });
  }

  const target = await User.findById(id);
  if (!target) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (target.role === 'admin') {
    return res.status(403).json({ message: 'Admin accounts cannot be deleted from this page' });
  }

  await User.deleteOne({ _id: target._id });
  return res.status(204).send();
}
