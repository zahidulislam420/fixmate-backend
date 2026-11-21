import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

// Allow authenticated users to upload image files
router.post('/', verifyToken, uploadImage);

export default router;
