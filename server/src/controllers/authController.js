import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { isNonEmptyString, isStrongPassword } from '../utils/validation.js';
import { verifyRecaptcha } from '../utils/recaptcha.js';
import { logAuditEvent } from '../utils/auditLog.js';

const MFA_CHALLENGE_EXPIRY = '5m';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

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

export function issueSession(res, user) {
  const token = jwt.sign(
    { sub: user._id.toString(), purpose: 'session', tokenVersion: user.tokenVersion },
    env.jwtSecret,
    { expiresIn: '7d' }
  );
  res.cookie(SESSION_COOKIE, token, cookieOptions);
}

// Returned in the response body (never set as a cookie) so the client can
// hand it back to /auth/mfa/verify-login once it has a TOTP code — proves
// the password step already passed without granting a session yet.
function issueMfaChallenge(user) {
  return jwt.sign({ sub: user._id.toString(), purpose: 'mfa-challenge' }, env.jwtSecret, {
    expiresIn: MFA_CHALLENGE_EXPIRY,
  });
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
    await logAuditEvent('login_failed_unknown_email', req, { email: email.trim().toLowerCase() });
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Rejected before the password is even checked — authLimiter only caps
  // attempts per source IP, so this is what stops an attacker rotating IPs
  // from grinding this one account's password indefinitely. Same generic
  // message as a wrong password, so a locked account isn't distinguishable
  // from one that doesn't exist.
  if (user.lockUntil && user.lockUntil > new Date()) {
    await logAuditEvent('login_failed_locked', req, { userId: user._id, email: user.email });
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const validPassword = await argon2.verify(user.passwordHash, password);
  if (!validPassword) {
    user.failedLoginAttempts += 1;
    let justLocked = false;
    if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      user.failedLoginAttempts = 0;
      justLocked = true;
    }
    await user.save();
    await logAuditEvent('login_failed_wrong_password', req, { userId: user._id, email: user.email });
    if (justLocked) {
      await logAuditEvent('account_locked', req, { userId: user._id, email: user.email });
    }
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  if (user.mfaEnabled) {
    return res.json({ mfaRequired: true, challengeToken: issueMfaChallenge(user) });
  }

  await logAuditEvent('login_success', req, { userId: user._id, email: user.email });
  issueSession(res, user);
  return res.json({ user: { id: user._id, email: user.email, role: user.role, mfaEnabled: user.mfaEnabled } });
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

  // A verified Google identity is at least as strong a proof of ownership
  // as a password, so it clears any lockout left over from password-guessing
  // attempts — the account isn't stuck just because someone else was
  // grinding its password.
  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  if (user.mfaEnabled) {
    return res.json({ mfaRequired: true, challengeToken: issueMfaChallenge(user) });
  }

  await logAuditEvent('google_login_success', req, { userId: user._id, email: user.email });
  issueSession(res, user);
  return res.json({ user: { id: user._id, email: user.email, role: user.role, mfaEnabled: user.mfaEnabled } });
}

// Bumps tokenVersion (best-effort — an already-invalid/expired cookie has
// nothing to revoke) so the token being logged out can't be replayed even
// if it was captured before this request. Clearing the cookie alone only
// stops this browser from sending it again; it doesn't stop anyone else
// who already has a copy.
export async function logout(req, res) {
  const token = req.cookies?.session;
  if (token) {
    try {
      const payload = jwt.verify(token, env.jwtSecret);
      if (payload.purpose === 'session') {
        await User.updateOne({ _id: payload.sub }, { $inc: { tokenVersion: 1 } });
        await logAuditEvent('logout', req, { userId: payload.sub });
      }
    } catch {
      // already invalid or expired — nothing to revoke
    }
  }
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  return res.status(204).send();
}

export async function me(req, res) {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  return res.json({ user: { id: user._id, email: user.email, role: user.role, mfaEnabled: user.mfaEnabled } });
}

export async function updateProfile(req, res) {
  const { email, currentPassword, newPassword, role } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const wantsEmailChange = isNonEmptyString(email, 254);
  const wantsPasswordChange = isNonEmptyString(newPassword, 200);
  const wantsRoleChange = role === 'admin' || role === 'user';

  if (!wantsEmailChange && !wantsPasswordChange && !wantsRoleChange) {
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
    // Kills every other session issued under the old password — otherwise a
    // stolen cookie would keep working right through a password change.
    user.tokenVersion += 1;
  }

  if (wantsRoleChange) {
    user.role = role;
  }

  await user.save();

  // Reissue so the device making this change stays logged in under the new
  // tokenVersion, instead of being logged out by its own password change.
  if (wantsPasswordChange) {
    issueSession(res, user);
    await logAuditEvent('password_changed', req, { userId: user._id, email: user.email });
  }

  return res.json({ user: { id: user._id, email: user.email, role: user.role, mfaEnabled: user.mfaEnabled } });
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
  await logAuditEvent('account_deleted', req, { userId: user._id, email: user.email });

  res.clearCookie(SESSION_COOKIE, cookieOptions);
  return res.status(204).send();
}
