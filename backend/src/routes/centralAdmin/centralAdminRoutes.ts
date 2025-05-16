// src/routes/centralAdmin/centralAdminRoutes.ts
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as reportsController from '../../controllers/centralAdmin/reportsController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Central admin reporting routes - accessing FDW views
// GET /api/central/student_directory - Get all students across departments
router.get('/student_directory', reportsController.getStudentDirectory);

// GET /api/central/module_enrollments - Get all module enrollments across departments
router.get('/module_enrollments', reportsController.getModuleEnrollments);

// GET /api/central/grades_overview - Get all grades across departments
router.get('/grades_overview', reportsController.getGradesOverview);

// GET /api/central/staff_directory - Get all staff across departments
router.get('/staff_directory', reportsController.getStaffDirectory);

// GET /api/central/exam_schedule - Get all exams across departments
router.get('/exam_schedule', reportsController.getExamSchedule);

export default router;
