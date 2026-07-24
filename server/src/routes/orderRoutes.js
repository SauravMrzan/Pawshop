import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { myOrders, getOrder } from '../controllers/orderController.js';

const router = Router();

// '/mine' must be registered before '/:id' or it would be swallowed as an id param.
router.get('/mine', requireAuth, myOrders);
router.get('/:id', requireAuth, getOrder);

export default router;
