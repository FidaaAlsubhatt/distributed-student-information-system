import express from 'express';
import { authenticate } from '../middleware/auth.middleware';

// Import controllers
import { getStudentProfile, updateStudentProfile } from '../controllers/student/profileController';
import { getStudentModules } from '../controllers/student/moduleController';
import { getStudentClassTimetable, getStudentExamTimetable } from '../controllers/student/timetableController';
// Additional controllers can be imported here

const router = express.Router();

// Apply authentication middleware to all student routes
router.use(authenticate);

// Profile routes
router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);

// Modules routes
router.get('/modules', getStudentModules);

// Timetable routes
router.get('/timetable/class', getStudentClassTimetable);
router.get('/timetable/exam', getStudentExamTimetable);

// More routes can be added here as needed

export default router;
