import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { pool } from './db';
import * as authController from './controllers/authController';
import * as userController from './controllers/userController';
import * as studentController from './controllers/studentController';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Auth routes
app.post('/api/auth/login', authController.login);
app.get('/api/auth/verify', authController.verifyToken);
app.post('/api/auth/logout', authController.logout);

// User routes
app.post('/api/users', userController.createUser);
app.get('/api/users', userController.getUsers);
app.get('/api/departments', userController.getDepartments);

// Department student routes
app.post('/api/department/students', studentController.addStudent);
app.get('/api/department/students', studentController.getStudents);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  try {
    await pool.end();
    console.log('Database connections closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});
