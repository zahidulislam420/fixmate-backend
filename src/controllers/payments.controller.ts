import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import Stripe from 'stripe';
import { ENV } from '../config/env.js';
import { getBookingsCollection, getPaymentsCollection } from '../config/db.js';
import { PaymentDoc, StatusHistoryItem } from '../types/index.js';

// Initialize Stripe instance
const isStripeConfigured =
  ENV.STRIPE_SECRET_KEY && !ENV.STRIPE_SECRET_KEY.includes('placeholder');

export const stripe = isStripeConfigured
  ? new Stripe(ENV.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' as any })
  : null;

// Helper to record payment idempotently
export async function recordPaymentIdempotent(params: {
  bookingId: string;
  stripeSessionId: string;
  transactionId: string;
  amount: number;
}): Promise<PaymentDoc | null> {
  const { bookingId, stripeSessionId, transactionId, amount } = params;
  const paymentsCol = getPaymentsCollection();
  const bookingsCol = getBookingsCollection();

  // Deduplication check: Has this session or booking already been recorded as paid?
  const existingPayment = await paymentsCol.findOne({
    $or: [{ stripeSessionId }, { bookingId }],
  });

  if (existingPayment) {
    return existingPayment;
  }

  const booking = await bookingsCol.findOne({ _id: new ObjectId(bookingId) });
  if (!booking) return null;

  const now = new Date();
  const newPayment: PaymentDoc = {
    bookingId,
    serviceTitle: booking.serviceTitle,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    technicianName: booking.technicianName,
    technicianEmail: booking.technicianEmail,
    amount: amount || booking.finalAmount,
    currency: 'usd',
    transactionId: transactionId || `txn_fixmate_${Date.now()}`,
    stripeSessionId,
    paymentStatus: 'paid',
    paidAt: now,
  };

  await paymentsCol.insertOne(newPayment);

  // Update booking paymentStatus to 'paid'
  const paidHistoryItem: StatusHistoryItem = {
    status: 'completed',
    changedAt: now,
    changedBy: 'Stripe Checkout',
    note: `Payment of $${booking.finalAmount} received`,
  };

  await bookingsCol.updateOne(
    { _id: new ObjectId(bookingId) },
    {
      $set: { paymentStatus: 'paid', updatedAt: now },
      $push: { statusHistory: paidHistoryItem },
    }
  );

  return newPayment;
}

// POST /api/payments/create-checkout-session
export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { bookingId } = req.body;
    if (!bookingId || !ObjectId.isValid(bookingId)) {
      res.status(400).json({ success: false, message: 'Valid booking ID is required' });
      return;
    }

    const bookingsCol = getBookingsCollection();
    const booking = await bookingsCol.findOne({ _id: new ObjectId(bookingId) });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Role and ownership check
    if (booking.customerEmail !== req.user.email) {
      res.status(403).json({ success: false, message: 'Forbidden: You can only pay for your own bookings' });
      return;
    }

    // Server-enforced payment gate: status must be 'completed' and paymentStatus 'unpaid'
    if (booking.status !== 'completed') {
      res.status(400).json({
        success: false,
        message: 'Payment is only allowed for completed jobs',
      });
      return;
    }

    if (booking.paymentStatus === 'paid') {
      res.status(400).json({
        success: false,
        message: 'This booking has already been paid',
      });
      return;
    }

    const amountInCents = Math.round(booking.finalAmount * 100);

    // If Stripe is live configured
    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Repair: ${booking.serviceTitle}`,
                description: `Technician: ${booking.technicianName} | Customer: ${booking.customerName}`,
                images: booking.serviceImage ? [booking.serviceImage] : [],
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${ENV.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${ENV.CLIENT_URL}/payment/cancel`,
        metadata: {
          bookingId: booking._id?.toString() || bookingId,
          customerEmail: booking.customerEmail,
        },
      });

      res.status(200).json({
        success: true,
        url: session.url,
        sessionId: session.id,
      });
      return;
    }

    // Fallback Mock Session for testing when test keys are placeholders
    const mockSessionId = `cs_test_mock_${Date.now()}_${bookingId}`;
    const mockUrl = `${ENV.CLIENT_URL}/payment/success?session_id=${mockSessionId}&mock=true`;

    res.status(200).json({
      success: true,
      url: mockUrl,
      sessionId: mockSessionId,
      mock: true,
      message: 'Stripe placeholder mode active. Redirecting to payment verification.',
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ success: false, message: 'Failed to create checkout session', error: error.message });
  }
}

// GET /api/payments/verify?session_id=...
export async function verifyPayment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const sessionId = req.query.session_id as string;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'session_id is required' });
      return;
    }

    let bookingId: string | undefined;
    let transactionId = `txn_${Date.now()}`;
    let amount = 0;
    let isPaid = false;

    if (stripe && !sessionId.startsWith('cs_test_mock_')) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid') {
        isPaid = true;
        bookingId = session.metadata?.bookingId;
        transactionId = (session.payment_intent as string) || session.id;
        amount = (session.amount_total || 0) / 100;
      }
    } else {
      // Mock session verification for developer testing
      isPaid = true;
      const parts = sessionId.split('_');
      bookingId = parts[parts.length - 1];
      const bookingsCol = getBookingsCollection();
      if (ObjectId.isValid(bookingId)) {
        const b = await bookingsCol.findOne({ _id: new ObjectId(bookingId) });
        if (b) amount = b.finalAmount;
      }
    }

    if (!isPaid || !bookingId || !ObjectId.isValid(bookingId)) {
      res.status(400).json({ success: false, message: 'Payment verification failed or session unpaid' });
      return;
    }

    const payment = await recordPaymentIdempotent({
      bookingId,
      stripeSessionId: sessionId,
      transactionId,
      amount,
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and recorded successfully',
      payment,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Payment verification error' });
  }
}

// GET /api/payments/my (Customer Payment History)
export async function getCustomerPayments(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const paymentsCol = getPaymentsCollection();
    const payments = await paymentsCol
      .find({ customerEmail: req.user.email })
      .sort({ paidAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error: any) {
    console.error('Error fetching customer payments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
}

// Stripe Webhook: POST /api/payments/webhook
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'];

  if (!stripe || !sig || !ENV.STRIPE_WEBHOOK_SECRET) {
    res.status(400).json({ received: true, note: 'Stripe webhook secret not configured' });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // Must be raw buffer
      sig as string,
      ENV.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    if (bookingId && ObjectId.isValid(bookingId)) {
      await recordPaymentIdempotent({
        bookingId,
        stripeSessionId: session.id,
        transactionId: (session.payment_intent as string) || session.id,
        amount: (session.amount_total || 0) / 100,
      });
      console.log(`[Stripe Webhook] Payment successfully handled for booking ${bookingId}`);
    }
  }

  res.json({ received: true });
}
