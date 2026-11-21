import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

async function bootstrap() {
  try {
    await connectDB();
    const app = createApp();

    app.listen(ENV.PORT, () => {
      console.log(`[Server] FixMate API server running on port ${ENV.PORT} (${ENV.NODE_ENV})`);
      console.log(`[Server] Health check: http://localhost:${ENV.PORT}/api/health`);
    });
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
}

bootstrap();
