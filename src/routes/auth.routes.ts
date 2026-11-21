import { Router } from 'express';
import {
  signUp,
  signIn,
  getCurrentUser,
  updateProfile,
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

// Auth endpoints
router.post('/sign-up', signUp);
router.post('/sign-in', signIn);
router.get('/me', verifyToken, getCurrentUser);

// User profile endpoint required by Challenge 2: PATCH /api/users/profile
export const userProfileRouter = Router();
userProfileRouter.patch('/profile', verifyToken, updateProfile);
userProfileRouter.get('/me', verifyToken, getCurrentUser);

export default router;
