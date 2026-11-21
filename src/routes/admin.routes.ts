import { Router } from 'express';
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  getAdminServices,
  updateServiceApproval,
  getAdminBookings,
  getAdminTransactions,
} from '../controllers/admin.controller.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.js';

const router = Router();

// Protect all admin routes with verifyToken and verifyAdmin
router.use(verifyToken, verifyAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);

router.get('/services', getAdminServices);
router.patch('/services/:id/approval', updateServiceApproval);

router.get('/bookings', getAdminBookings);

router.get('/payments', getAdminTransactions);
router.get('/transactions', getAdminTransactions);

export default router;
