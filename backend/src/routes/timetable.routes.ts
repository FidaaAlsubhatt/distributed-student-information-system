import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { getStudentClassTimetable, getStudentExamTimetable } from '../controllers/student/timetableController';

const router = express.Router();

// Routes require authentication
router.get('/classes', authenticate, authorizeRoles('student'), getStudentClassTimetable);
router.get('/exams', authenticate, authorizeRoles('student'), getStudentExamTimetable);

export default router;
