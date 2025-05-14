import { Router } from 'express';
import { getAcademicModules, getModuleStudents, updateStudentGrade, deleteModule, updateModule, createModule } from '../controllers/staff/moduleController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Routes for academic staff modules
router.get('/modules', authenticate, getAcademicModules);
router.post('/modules', authenticate, createModule);
router.put('/modules/:moduleId', authenticate, updateModule);
router.delete('/modules/:moduleId', authenticate, deleteModule);
router.get('/modules/:moduleId/students', authenticate, getModuleStudents);
router.put('/modules/:moduleId/students/:studentId/assignments/:assignmentId/grade', authenticate, updateStudentGrade);

export default router;
