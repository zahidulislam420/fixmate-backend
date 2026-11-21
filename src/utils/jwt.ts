import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { AuthUserPayload } from '../types/index.js';

export function signToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): AuthUserPayload {
  return jwt.verify(token, ENV.JWT_SECRET) as AuthUserPayload;
}
