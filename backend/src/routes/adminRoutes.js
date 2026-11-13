import express from 'express';
import { getAuditLogs, getAllUsers } from '../controllers/analyticsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protected Admin-only endpoints
router.get('/audit-logs', authenticate, authorize('admin'), getAuditLogs);
router.get('/users', authenticate, authorize('admin'), getAllUsers);

export default router;

