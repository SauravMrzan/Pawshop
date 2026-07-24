import rateLimit from 'express-rate-limit';

// Applied to login/register and other endpoints that verify a password —
// caps repeated attempts per IP so credential-guessing (brute force) and
// mass account creation aren't practical. Standard responses only, no
// details about which requests within the window were the "real" attempts.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' },
});
