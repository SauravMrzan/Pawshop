import crypto from 'node:crypto';
import { env } from '../config/env.js';

const CSRF_COOKIE = 'csrfToken';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const csrfCookieOptions = {
  httpOnly: false,
  secure: env.nodeEnv === 'production',
  sameSite: 'strict',
  path: '/',
};

export function issueCsrfToken(_req, res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE, token, csrfCookieOptions);
  return res.json({ csrfToken: token });
}

function tokensMatch(cookieToken, headerToken) {
  if (typeof cookieToken !== 'string' || typeof headerToken !== 'string') return false;

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);
  return cookieBuffer.length === headerBuffer.length && crypto.timingSafeEqual(cookieBuffer, headerBuffer);
}

// Double-submit cookie protection: JavaScript loaded from a foreign origin
// cannot read the token response, while every mutating request must echo the
// token in a custom header. Origin validation provides an independent check
// for normal browser requests and blocks untrusted same-site origins too.
export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  if (origin && !env.clientOrigins.includes(origin)) {
    return res.status(403).json({ message: 'Invalid request origin' });
  }

  if (!tokensMatch(req.cookies?.[CSRF_COOKIE], req.get('x-csrf-token'))) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }

  return next();
}
