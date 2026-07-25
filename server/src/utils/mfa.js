import { authenticator } from 'otplib';
import QRCode from 'qrcode';

const ISSUER = 'Course Portal';

export function generateMfaSecret() {
  return authenticator.generateSecret();
}

export function buildOtpauthUrl(email, secret) {
  return authenticator.keyuri(email, ISSUER, secret);
}

export async function buildQrCodeDataUrl(otpauthUrl) {
  return QRCode.toDataURL(otpauthUrl);
}

export function isValidTotpFormat(code) {
  return typeof code === 'string' && /^\d{6}$/.test(code);
}

export function verifyMfaToken(code, secret) {
  if (!isValidTotpFormat(code)) return false;
  try {
    return authenticator.check(code, secret);
  } catch {
    return false;
  }
}
