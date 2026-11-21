import { Router } from 'express';
import {
  createCheckoutSession,
  verifyPayment,
  getCustomerPayments,
  handleStripeWebhook,
} from '../controllers/payments.controller.js';
import { verifyToken, verifyCustomer } from '../middlewares/auth.js';

const router = Router();

// Customer Stripe routes
router.post('/create-checkout-session', verifyToken, verifyCustomer, createCheckoutSession);
router.get('/verify', verifyToken, verifyCustomer, verifyPayment);
router.get('/my', verifyToken, verifyCustomer, getCustomerPayments);

// Stripe webhook route (needs raw body handling in app.ts)
router.post('/webhook', handleStripeWebhook);

export default router;
