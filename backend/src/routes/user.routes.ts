// src/routes/user.routes.ts
import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { getUsers, getDepartments, createUser, getDepartmentUsers, deleteUserInDepartment, addStudent, addAcademicStaff } from '../controllers/userController';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('central_admin'));

// Legacy central administration routes
router.get('/users', getUsers);
router.post('/users', createUser);
router.get('/departments', getDepartments);

// Department-specific routes
router.get('/department/users', getDepartmentUsers);
router.delete('/users/:userId', deleteUserInDepartment);
router.post('/students', addStudent);
router.post('/academic-staff', addAcademicStaff);

export default router;
