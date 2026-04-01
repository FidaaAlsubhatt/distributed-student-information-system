import { Router } from 'express';
import { getAcademicModules, getModuleStudents, updateStudentGrade, deleteModule, updateModule, createModule } from '../controllers/staff/moduleController';
import { getAssignments, getAssignmentSubmissions, createAssignment, updateAssignment, deleteAssignment, updateSubmissionGrade } from '../controllers/staff/assignmentController';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('academic_staff'));

// Routes for academic staff modules
router.get('/modules', getAcademicModules);
router.post('/modules', createModule);
router.put('/modules/:moduleId', updateModule);
router.delete('/modules/:moduleId', deleteModule);
router.get('/modules/:moduleId/students', getModuleStudents);
router.put('/modules/:moduleId/students/:studentId/assignments/:assignmentId/grade', updateStudentGrade);

// Routes for academic staff assignments
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.get('/assignments/:assignmentId/submissions', getAssignmentSubmissions);
router.put('/assignments/:assignmentId', updateAssignment);
router.delete('/assignments/:assignmentId', deleteAssignment);
router.put('/assignments/:assignmentId/students/:studentId/grade', updateSubmissionGrade);

export default router;
