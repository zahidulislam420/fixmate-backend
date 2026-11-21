import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  getTechnicianBookings,
  updateBookingStatus,
  addBookingReview,
} from '../controllers/bookings.controller.js';
import {
  verifyToken,
  verifyCustomer,
  verifyTechnician,
} from '../middlewares/auth.js';

const router = Router();

// Customer booking routes (verifyToken + verifyCustomer)
router.post('/', verifyToken, verifyCustomer, createBooking);
router.get('/my', verifyToken, verifyCustomer, getMyBookings);
router.patch('/:id/cancel', verifyToken, verifyCustomer, cancelBooking);
router.post('/:id/review', verifyToken, verifyCustomer, addBookingReview);

// Technician booking routes (verifyToken + verifyTechnician)
router.get('/technician', verifyToken, verifyTechnician, getTechnicianBookings);
router.patch('/:id/status', verifyToken, verifyTechnician, updateBookingStatus);

export default router;
