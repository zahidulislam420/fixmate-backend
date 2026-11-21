import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import authRoutes, { userProfileRouter } from './routes/auth.routes.js';
import servicesRoutes from './routes/services.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler } from './middlewares/error.js';
import { handleStripeWebhook } from './controllers/payments.controller.js';

export function createApp(): Application {
  const app = express();

  // CORS configuration allowing frontend origin
  app.use(
    cors({
      origin: [ENV.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Stripe Webhook MUST receive the raw body
  app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
  );

  // Standard JSON & URL-encoded parser for other endpoints
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      app: 'FixMate API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Application Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userProfileRouter); // Required: PATCH /api/users/profile
  app.use('/api/services', servicesRoutes);
  app.use('/api/bookings', bookingsRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/admin', adminRoutes);

  // 404 handler for unknown API routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'API Route not found' });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
