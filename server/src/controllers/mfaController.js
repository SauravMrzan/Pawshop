import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { issueSession } from './authController.js';
import { isNonEmptyString } from '../utils/validation.js';
import { generateMfaSecret, buildOtpauthUrl, buildQrCodeDataUrl, verifyMfaToken } from '../utils/mfa.js';
import { logAuditEvent } from '../utils/auditLog.js';

function userResponse(user) {
  return { id: user._id, email: user.email, role: user.role, mfaEnabled: user.mfaEnabled };
}

// Generates and stores a fresh secret but leaves mfaEnabled untouched — the
// account isn't protected by it until /enable confirms the user actually
// scanned it correctly. Calling this again before enabling just re-rolls it.
export async function mfaSetup(req, res) {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const secret = generateMfaSecret();
  user.mfaSecret = secret;
  await user.save();

  const otpauthUrl = buildOtpauthUrl(user.email, secret);
  const qrCodeDataUrl = await buildQrCodeDataUrl(otpauthUrl);

  return res.json({ secret, otpauthUrl, qrCodeDataUrl });
}

export async function mfaEnable(req, res) {
  const { currentPassword, code } = req.body;

  if (!isNonEmptyString(currentPassword, 200)) {
    return res.status(400).json({ message: 'Current password is required' });
  }

  const user = await User.findById(req.userId).select('+mfaSecret');
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const validPassword = await argon2.verify(user.passwordHash, currentPassword);
  if (!validPassword) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  if (!user.mfaSecret) {
    return res.status(400).json({ message: 'Start MFA setup before enabling it' });
  }
  if (!verifyMfaToken(code, user.mfaSecret)) {
    await logAuditEvent('mfa_enable_failed', req, { userId: user._id, email: user.email });
    return res.status(401).json({ message: 'Invalid authenticator code' });
  }

  user.mfaEnabled = true;
  await user.save();
  await logAuditEvent('mfa_enabled', req, { userId: user._id, email: user.email });

  return res.json({ user: userResponse(user) });
}

export async function mfaDisable(req, res) {
  const { currentPassword, code } = req.body;

  if (!isNonEmptyString(currentPassword, 200)) {
    return res.status(400).json({ message: 'Current password is required' });
  }

  const user = await User.findById(req.userId).select('+mfaSecret');
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const validPassword = await argon2.verify(user.passwordHash, currentPassword);
  if (!validPassword) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  if (!user.mfaEnabled) {
    return res.status(400).json({ message: 'MFA is not enabled' });
  }
  // Requiring a valid code (not just the password) to turn MFA off means a
  // hijacked session cookie alone can't downgrade the account's security.
  if (!verifyMfaToken(code, user.mfaSecret)) {
    await logAuditEvent('mfa_disable_failed', req, { userId: user._id, email: user.email });
    return res.status(401).json({ message: 'Invalid authenticator code' });
  }

  user.mfaEnabled = false;
  user.mfaSecret = undefined;
  await user.save();
  await logAuditEvent('mfa_disabled', req, { userId: user._id, email: user.email });

  return res.json({ user: userResponse(user) });
}

export async function mfaVerifyLogin(req, res) {
  const { challengeToken, code } = req.body;

  if (!isNonEmptyString(challengeToken, 2000)) {
    return res.status(400).json({ message: 'Missing challenge token' });
  }

  let payload;
  try {
    payload = jwt.verify(challengeToken, env.jwtSecret);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired challenge' });
  }
  if (payload.purpose !== 'mfa-challenge') {
    return res.status(401).json({ message: 'Invalid or expired challenge' });
  }

  const user = await User.findById(payload.sub).select('+mfaSecret');
  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    return res.status(401).json({ message: 'Invalid or expired challenge' });
  }

  if (!verifyMfaToken(code, user.mfaSecret)) {
    await logAuditEvent('mfa_verify_failed', req, { userId: user._id, email: user.email });
    return res.status(401).json({ message: 'Invalid authenticator code' });
  }

  await logAuditEvent('login_success', req, { userId: user._id, email: user.email, metadata: { via: 'mfa' } });
  issueSession(res, user);
  return res.json({ user: userResponse(user) });
}
