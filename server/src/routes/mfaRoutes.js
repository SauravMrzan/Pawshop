import { Router } from 'express';
import { mfaSetup, mfaEnable, mfaDisable, mfaVerifyLogin } from '../controllers/mfaController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.post('/setup', requireAuth, authLimiter, mfaSetup);
router.post('/enable', requireAuth, authLimiter, mfaEnable);
router.post('/disable', requireAuth, authLimiter, mfaDisable);
// No requireAuth — the caller doesn't have a session yet, only the
// short-lived challenge token from a password (or Google) login that
// still needs its second factor.
router.post('/verify-login', authLimiter, mfaVerifyLogin);

export default router;
