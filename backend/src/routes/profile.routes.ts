import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { getStudentProfile, updateStudentProfile } from '../controllers/student/profileController';

const router = express.Router();

// Protected routes - need authentication
router.get('/student-profile', authenticate, authorizeRoles('student'), getStudentProfile);
router.put('/student-profile', authenticate, authorizeRoles('student'), updateStudentProfile);

export default router;
