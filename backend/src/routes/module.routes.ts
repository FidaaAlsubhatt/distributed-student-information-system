import { Router } from 'express';
import { getStudentModules } from '../controllers/student/moduleController';
import { getAcademicModules, getModuleStudents, updateStudentGrade } from '../controllers/staff/moduleController';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Student routes
router.get('/student-modules', authenticate, authorizeRoles('student'), getStudentModules);

// Academic staff routes
router.get('/staff-modules', authenticate, authorizeRoles('academic_staff'), getAcademicModules);
router.get('/:moduleId/students', authenticate, authorizeRoles('academic_staff'), getModuleStudents);
router.put(
  '/:moduleId/students/:studentId/assignments/:assignmentId/grade',
  authenticate,
  authorizeRoles('academic_staff'),
  updateStudentGrade
);

export default router;
