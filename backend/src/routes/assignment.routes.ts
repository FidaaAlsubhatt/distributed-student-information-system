import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getStudentAssignments } from '../controllers/student/assignmentController';

const router = express.Router();

// Protected routes - need authentication
router.get('/student-assignments', authenticate, getStudentAssignments);

export default router;
