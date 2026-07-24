import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { listUsers, createUser, deleteUser } from '../controllers/adminUserController.js';

const router = Router();

router.get('/', requireAuth, requireAdmin, listUsers);
router.post('/', requireAuth, requireAdmin, createUser);
router.delete('/:id', requireAuth, requireAdmin, deleteUser);

export default router;
