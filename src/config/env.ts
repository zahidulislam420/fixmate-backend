import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fixmate',
  JWT_SECRET: process.env.JWT_SECRET || 'fixmate_jwt_super_secret_key_2025_secure_token',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_here',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder_secret_here',
  IMGBB_API_KEY: process.env.IMGBB_API_KEY || 'placeholder_imgbb_key',
};
