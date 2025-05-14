import { Router } from 'express';
import { getStudentModules } from '../controllers/student/moduleController';
import { getAcademicModules, getModuleStudents, updateStudentGrade } from '../controllers/staff/moduleController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Student routes
router.get('/student-modules', authenticate, getStudentModules);

// Academic staff routes
router.get('/staff-modules', authenticate, getAcademicModules);
router.get('/:moduleId/students', authenticate, getModuleStudents);
router.put('/:moduleId/students/:studentId/assignments/:assignmentId/grade', authenticate, updateStudentGrade);

export default router;
