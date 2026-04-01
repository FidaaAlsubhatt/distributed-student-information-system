import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { getStudentAssignments } from '../controllers/student/assignmentController';

const router = express.Router();

// Protected routes - need authentication
router.get('/student-assignments', authenticate, authorizeRoles('student'), getStudentAssignments);

export default router;
