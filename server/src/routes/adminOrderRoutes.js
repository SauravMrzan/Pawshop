import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { listAllOrders, updateOrderStatus } from '../controllers/adminOrderController.js';

const router = Router();

router.get('/', requireAuth, requireAdmin, listAllOrders);
router.patch('/:id/status', requireAuth, requireAdmin, updateOrderStatus);

export default router;
