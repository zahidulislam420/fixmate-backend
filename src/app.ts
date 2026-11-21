import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import authRoutes, { userProfileRouter } from './routes/auth.routes.js';
import servicesRoutes from './routes/services.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { errorHandler } from './middlewares/error.js';
import { handleStripeWebhook } from './controllers/payments.controller.js';
import { handleHttpSeed } from './controllers/seed.controller.js';
import { getSystemHealth } from './utils/health.js';

export function createApp(): Application {
  const app = express();

  // Universal CORS handler: Allows ANY origin, port, or domain with credentials support
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Origin'
    );

    // Fast response to browser preflight OPTIONS checks
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Standard cors middleware with origin: true (echoes request origin)
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    })
  );

  // Preflight handling for all routes
  app.options('*', cors({ origin: true, credentials: true }));

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
    res.status(200).json(getSystemHealth());
  });

  // Cloud seed endpoint for free-tier deployments without shell access
  app.get('/api/seed', handleHttpSeed);

  // Mount Application Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userProfileRouter); // Required: PATCH /api/users/profile
  app.use('/api/services', servicesRoutes);
  app.use('/api/bookings', bookingsRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/upload', uploadRoutes);

  // 404 handler for unknown API routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'API Route not found' });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
