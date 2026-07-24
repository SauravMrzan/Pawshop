import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { checkout, quote } from '../controllers/checkoutController.js';

const router = Router();

router.post('/quote', requireAuth, quote);
router.post('/', requireAuth, checkout);

export default router;
