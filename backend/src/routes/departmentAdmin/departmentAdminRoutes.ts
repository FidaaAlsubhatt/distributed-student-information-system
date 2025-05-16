// src/routes/departmentAdmin/departmentAdminRoutes.ts
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as userController from '../../controllers/departmentAdmin/userController';
import * as programController from '../../controllers/departmentAdmin/programController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Department admin user management routes
// GET    /api/department/users/student - Get all students in the department
// GET    /api/department/users/staff - Get all staff in the department
router.get('/users/:userType', userController.getUsers);

// POST   /api/department/users/student - Add a new student to the department
// POST   /api/department/users/staff - Add a new staff member to the department 
router.post('/users/:userType', userController.createUser);

// DELETE /api/department/users/student/:id - Delete a student from the department
// DELETE /api/department/users/staff/:id - Delete a staff member from the department
router.delete('/users/:userType/:id', userController.deleteUser);

// PUT /api/department/users/student/:id - Update a student in the department
// PUT /api/department/users/staff/:id - Update a staff member in the department
router.put('/users/:userType/:id', userController.updateUser);

// Department admin program management routes
// GET /api/department/programs - Get all programs in the department
router.get('/programs', programController.getPrograms);

// POST /api/department/programs - Add a new program to the department
router.post('/programs', programController.createProgram);

// PUT /api/department/programs/:id - Update a program in the department
router.put('/programs/:id', programController.updateProgram);

// DELETE /api/department/programs/:id - Delete a program from the department
router.delete('/programs/:id', programController.deleteProgram);

export default router;
