import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { isNonEmptyString, isStrongPassword } from '../utils/validation.js';
import { verifyRecaptcha } from '../utils/recaptcha.js';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// null until GOOGLE_CLIENT_ID is configured — googleLogin responds 503
// rather than crashing the server while OAuth setup is still in progress.
const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'strict',
  maxAge: SESSION_MAX_AGE_MS,
};

function issueSession(res, user) {
  const token = jwt.sign({ sub: user._id.toString() }, env.jwtSecret, {
    expiresIn: '7d',
  });
  res.cookie(SESSION_COOKIE, token, cookieOptions);
}

export async function register(req, res) {
  const { email, password } = req.body;

  if (!isNonEmptyString(email, 254)) {
    return res.status(400).json({ message: 'A valid email is required' });
  }
  if (!isStrongPassword(password)) {
    return res
      .status(400)
      .json({ message: 'Password must be at least 8 characters and include a letter and a number' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  // The hash always runs, and both branches return the same status/message —
  // an already-registered email can't be distinguished from a new one by
  // response body, status code, or (since the hash cost is paid either way)
  // response timing. Prevents user enumeration via registration.
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  if (!existing) {
    await User.create({ email: normalizedEmail, passwordHash });
  }

  return res.status(201).json({ message: 'If that email is available, an account has been created. Please log in.' });
}

export async function login(req, res) {
  const { email, password, recaptchaToken } = req.body;

  if (!isNonEmptyString(email, 254) || !isNonEmptyString(password, 200)) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  if (!(await verifyRecaptcha(recaptchaToken))) {
    return res.status(400).json({ message: 'CAPTCHA verification failed' });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const validPassword = await argon2.verify(user.passwordHash, password);
  if (!validPassword) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  issueSession(res, user);
  return res.json({ user: { id: user._id, email: user.email, role: user.role } });
}

// Verifies the ID token Google's Identity Services library hands back to the
// frontend after a successful "Sign in with Google" — never trusts a claimed
// email without that server-side verification against Google's own keys.
export async function googleLogin(req, res) {
  const { credential } = req.body;

  if (!googleClient) {
    return res.status(503).json({ message: 'Google sign-in is not configured' });
  }
  if (!isNonEmptyString(credential, 4096)) {
    return res.status(400).json({ message: 'Missing Google credential' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: env.googleClientId });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ message: 'Invalid Google credential' });
  }

  if (!payload?.email || !payload.email_verified) {
    return res.status(401).json({ message: 'Google account email is not verified' });
  }

  const normalizedEmail = payload.email.toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    // OAuth-created accounts never log in with a password — this is a
    // random value nobody knows, just satisfying the schema's required field.
    const passwordHash = await argon2.hash(crypto.randomBytes(32).toString('hex'), {
      type: argon2.argon2id,
    });
    user = await User.create({ email: normalizedEmail, passwordHash });
  }

  issueSession(res, user);
  return res.json({ user: { id: user._id, email: user.email, role: user.role } });
}

export function logout(_req, res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  return res.status(204).send();
}

export async function me(req, res) {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  return res.json({ user: { id: user._id, email: user.email, role: user.role } });
}

// Explicitly whitelisted: email and newPassword are the only editable fields.
// role is never read from the request body, so it can never be mass-assigned.
export async function updateProfile(req, res) {
  const { email, currentPassword, newPassword } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const wantsEmailChange = isNonEmptyString(email, 254);
  const wantsPasswordChange = isNonEmptyString(newPassword, 200);

  if (!wantsEmailChange && !wantsPasswordChange) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  if (!isNonEmptyString(currentPassword, 200)) {
    return res.status(400).json({ message: 'Current password is required to update your profile' });
  }
  const validPassword = await argon2.verify(user.passwordHash, currentPassword);
  if (!validPassword) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  if (wantsEmailChange) {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      user.email = normalizedEmail;
    }
  }

  if (wantsPasswordChange) {
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    user.passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
  }

  await user.save();

  return res.json({ user: { id: user._id, email: user.email, role: user.role } });
}

export async function deleteAccount(req, res) {
  const { currentPassword } = req.body;

  if (!isNonEmptyString(currentPassword, 200)) {
    return res.status(400).json({ message: 'Current password is required to delete your account' });
  }

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const validPassword = await argon2.verify(user.passwordHash, currentPassword);
  if (!validPassword) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  await User.deleteOne({ _id: user._id });

  res.clearCookie(SESSION_COOKIE, cookieOptions);
  return res.status(204).send();
}
