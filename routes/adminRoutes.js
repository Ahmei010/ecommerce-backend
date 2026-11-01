import { Router } from 'express';
import { getDashboardStats, listUsers } from '../controllers/adminController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);
router.get('/stats', getDashboardStats);
router.get('/users', listUsers);

export default router;
