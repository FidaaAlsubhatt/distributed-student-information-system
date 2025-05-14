import dotenv from 'dotenv';
import path from 'path';
import './types/express';

console.log('Loading .env from:', path.resolve(__dirname, '../.env'));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
console.log('PORT from .env:', process.env.PORT);

import './jobs/scheduler'; // Starts background sync jobs
import express from 'express';
import cors from 'cors';
import * as authController from './controllers/authController';
import dashboardRoutes from './dashboard/dashboard.routes';
import adminUserRoutes from './admin/user.routes';
import userRoutes from './routes/user.routes';
import moduleRoutes from './routes/module.routes';
import assignmentRoutes from './routes/assignment.routes';
import profileRoutes from './routes/profile.routes';
import timetableRoutes from './routes/timetable.routes';
import staffRoutes from './routes/staff.routes';

const app = express();
app.use(cors());
app.use(express.json());

// Auth routes
app.post('/api/auth/login', authController.login);
app.get('/api/auth/verify', authController.verifyToken);
app.post('/api/auth/logout', authController.logout);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api', userRoutes);

const port = process.env.PORT || 3001;
console.log('Using PORT:', port);
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

