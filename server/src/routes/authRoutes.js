import { Router } from 'express';
import { register, login, logout, me, updateProfile, deleteAccount, googleLogin } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleLogin);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, authLimiter, updateProfile);
router.delete('/me', requireAuth, authLimiter, deleteAccount);

export default router;
