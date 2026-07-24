import { env } from '../config/env.js';

// Skips verification (returns true) if no secret key is configured yet, so
// the server keeps working while reCAPTCHA keys are still being set up.
// Once RECAPTCHA_SECRET_KEY is set in .env, verification is enforced.
export async function verifyRecaptcha(token) {
  if (!env.recaptchaSecretKey) {
    console.warn('RECAPTCHA_SECRET_KEY not set — skipping CAPTCHA verification');
    return true;
  }
  if (typeof token !== 'string' || !token) {
    return false;
  }

  const params = new URLSearchParams({ secret: env.recaptchaSecretKey, response: token });
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await res.json();
  return data.success === true;
}
