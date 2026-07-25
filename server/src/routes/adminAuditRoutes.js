import { Router } from 'express';
import { listAuditLogs } from '../controllers/adminAuditController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', requireAuth, requireAdmin, listAuditLogs);

export default router;
