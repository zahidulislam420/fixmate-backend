import { Router } from 'express';
import {
  getPublicServices,
  getServiceById,
  createService,
  getTechnicianServices,
  updateService,
  deleteService,
  toggleServiceAvailability,
} from '../controllers/services.controller.js';
import { verifyToken, verifyTechnician } from '../middlewares/auth.js';

const router = Router();

// Public routes
router.get('/', getPublicServices);

// Technician routes (protected)
router.get('/technician/my', verifyToken, verifyTechnician, getTechnicianServices);
router.post('/', verifyToken, verifyTechnician, createService);
router.patch('/:id/availability', verifyToken, verifyTechnician, toggleServiceAvailability);
router.patch('/:id', verifyToken, verifyTechnician, updateService);
router.delete('/:id', verifyToken, verifyTechnician, deleteService);

// Public route for single service (placed after specific technician routes)
router.get('/:id', getServiceById);

export default router;
