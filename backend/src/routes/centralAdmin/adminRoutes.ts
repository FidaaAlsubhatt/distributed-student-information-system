// src/routes/centralAdmin/adminRoutes.ts
import express from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { 
  createAdmin, 
  getAdmins, 
  getAdminById, 
  updateAdmin, 
  deleteAdmin 
} from '../../controllers/centralAdmin/adminController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Admin management routes
router.post('/', createAdmin);
router.get('/', getAdmins);
router.get('/:adminId', getAdminById);
router.put('/:adminId', updateAdmin);
router.delete('/:adminId', deleteAdmin);

export default router;
