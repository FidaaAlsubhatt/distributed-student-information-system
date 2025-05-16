import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as profileController from '../controllers/student/profileController';
import * as assignmentController from '../controllers/student/assignmentController';
import * as timetableController from '../controllers/student/timetableController';
import * as enrollmentController from '../controllers/student/enrollmentController';

const router = express.Router();

// Apply JWT authentication middleware to all student routes
router.use(authenticate);

// Profile routes
router.get('/profile', profileController.getStudentProfile);
router.put('/profile', profileController.updateStudentProfile);

// Assignment routes
router.get('/assignments/student-assignments', assignmentController.getStudentAssignments);

// Timetable routes
// Note: Adjust these routes based on your actual timetable controller implementation
// If these methods don't exist, replace them with the appropriate methods or comment them out until implemented
router.get('/timetable/class', timetableController.getStudentClassTimetable || ((req, res) => res.status(501).json({ message: 'Not implemented' })));
router.get('/timetable/exam', timetableController.getStudentExamTimetable || ((req, res) => res.status(501).json({ message: 'Not implemented' })));

// Enrollment routes
router.get('/enrollment/available-modules', enrollmentController.getAvailableModules);
router.post('/enrollment/request', enrollmentController.requestEnrollment);
router.get('/enrollment/requests', enrollmentController.getEnrollmentRequests);

export default router;
