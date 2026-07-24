import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
  mongoUri: required('MONGO_URI'),
  jwtSecret: required('JWT_SECRET'),
  // Comma-separated so the same server can be reached from multiple dev
  // origins (e.g. localhost on the host machine, plus a VM's IP) without
  // editing this on every network switch.
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  // Optional (not required()) so the server still starts before these are
  // configured — CAPTCHA/OAuth verification is skipped with a warning until
  // real values are set, rather than crashing the whole server.
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
};
