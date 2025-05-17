// src/routes/departmentAdmin/departmentAdminRoutes.ts
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as userController from '../../controllers/departmentAdmin/userController';
import * as programController from '../../controllers/departmentAdmin/programController';
import * as staffController from '../../controllers/departmentAdmin/manageStaffController';
import * as studentController from '../../controllers/departmentAdmin/manageStudentController';
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Department admin user management routes
// GET    /api/department/users/student - Get all students in the department
// GET    /api/department/users/staff - Get all staff in the department
router.get('/users/:userType', userController.getUsers);

// POST   /api/department/students - Add a new student to the department (uses specialized controller)
router.post('/students', studentController.addStudent);

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

// Staff management routes
// GET /api/department/staff - Get all staff members
router.get('/staff', staffController.getStaff);

// POST /api/department/staff - Add a new staff member
router.post('/staff', staffController.addStaff);

// PUT /api/department/staff/:id - Update a staff member
router.put('/staff/:id', staffController.updateStaff);

// DELETE /api/department/staff/:id - Delete a staff member
router.delete('/staff/:id', staffController.deleteStaff);

// GET /api/department/modules/:moduleId/staff - Get staff assigned to a module
router.get('/modules/:moduleId/staff', staffController.getModuleStaff);

// POST /api/department/modules/staff - Assign staff to a module
router.post('/modules/staff', staffController.assignStaffToModule);

// DELETE /api/department/modules/:moduleId/staff/:staffId - Remove staff from a module
router.delete('/modules/:moduleId/staff/:staffId', staffController.removeStaffFromModule);

// Student management routes
// GET /api/department/students - Get all students
router.get('/students', studentController.getStudents);

// POST /api/department/students - Add a new student
router.post('/students', studentController.addStudent);

// PUT /api/department/students/:id - Update a student
router.put('/students/:id', studentController.updateStudent);

// DELETE /api/department/students/:id - Delete a student
router.delete('/students/:id', studentController.deleteStudent);

// POST /api/department/programs/students - Assign student to a program
router.post('/programs/students', studentController.assignStudentToProgram);

// GET /api/department/programs/:programId/students - Get students in a program
router.get('/programs/:programId/students', studentController.getProgramStudents);

// DELETE /api/department/programs/:programId/students/:studentId - Remove student from a program
router.delete('/programs/:programId/students/:studentId', studentController.removeStudentFromProgram);

export default router;
