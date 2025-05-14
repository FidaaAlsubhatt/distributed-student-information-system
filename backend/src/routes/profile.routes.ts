import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getStudentProfile, updateStudentProfile } from '../controllers/student/profileController';

const router = express.Router();

// Protected routes - need authentication
router.get('/student-profile', authenticate, getStudentProfile);
router.put('/student-profile', authenticate, updateStudentProfile);

export default router;
