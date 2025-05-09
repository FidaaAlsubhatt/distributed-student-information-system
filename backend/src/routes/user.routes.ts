// src/routes/user.routes.ts
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getUsers, getDepartments, createUser, getDepartmentUsers, deleteUserInDepartment, addStudent, addAcademicStaff } from '../controllers/userController';

const router = express.Router();

// User routes
router.get('/users', authenticate, getUsers);
router.post('/users', authenticate, createUser);
router.get('/departments', authenticate, getDepartments);

// Department-specific routes
router.get('/department/users', authenticate, getDepartmentUsers);
router.delete('/users/:userId', authenticate, deleteUserInDepartment);
router.post('/students', authenticate, addStudent);
router.post('/academic-staff', authenticate, addAcademicStaff);

export default router;
