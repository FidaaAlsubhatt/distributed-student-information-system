import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getStudentClassTimetable, getStudentExamTimetable } from '../controllers/student/timetableController';

const router = express.Router();

// Routes require authentication
router.get('/classes', authenticate, getStudentClassTimetable);
router.get('/exams', authenticate, getStudentExamTimetable);

export default router;