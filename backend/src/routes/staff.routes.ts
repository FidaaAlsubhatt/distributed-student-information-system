import { Router } from 'express';
import { getAcademicModules, getModuleStudents, updateStudentGrade, deleteModule, updateModule, createModule } from '../controllers/staff/moduleController';
import { getAssignments, getAssignmentSubmissions, createAssignment, updateAssignment, deleteAssignment, updateSubmissionGrade } from '../controllers/staff/assignmentController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Routes for academic staff modules
router.get('/modules', authenticate, getAcademicModules);
router.post('/modules', authenticate, createModule);
router.put('/modules/:moduleId', authenticate, updateModule);
router.delete('/modules/:moduleId', authenticate, deleteModule);
router.get('/modules/:moduleId/students', authenticate, getModuleStudents);
router.put('/modules/:moduleId/students/:studentId/assignments/:assignmentId/grade', authenticate, updateStudentGrade);

// Routes for academic staff assignments
router.get('/assignments', authenticate, getAssignments);
router.post('/assignments', authenticate, createAssignment);
router.get('/assignments/:assignmentId/submissions', authenticate, getAssignmentSubmissions);
router.put('/assignments/:assignmentId', authenticate, updateAssignment);
router.delete('/assignments/:assignmentId', authenticate, deleteAssignment);
router.put('/assignments/:assignmentId/students/:studentId/grade', authenticate, updateSubmissionGrade);

export default router;
