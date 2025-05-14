import { Router } from 'express';
import { getStudentModules } from '../controllers/student/moduleController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/student-modules', authenticate, getStudentModules);

export default router;
