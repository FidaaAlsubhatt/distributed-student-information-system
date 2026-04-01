import express from 'express';
import cors from 'cors';
import './types/express';

import * as authController from './controllers/authController';
import dashboardRoutes from './dashboard/dashboard.routes';
import adminUserRoutes from './admin/user.routes';
import userRoutes from './routes/user.routes';
import moduleRoutes from './routes/module.routes';
import assignmentRoutes from './routes/assignment.routes';
import profileRoutes from './routes/profile.routes';
import timetableRoutes from './routes/timetable.routes';
import staffRoutes from './routes/staff.routes';
import departmentAdminRoutes from './routes/departmentAdmin/departmentAdminRoutes';
import centralAdminRoutes from './routes/centralAdmin/centralAdminRoutes';
import adminRoutes from './routes/centralAdmin/adminRoutes';
import studentRoutes from './routes/student.routes';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

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
  app.use('/api/department', departmentAdminRoutes);
  app.use('/api/central', centralAdminRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/student', studentRoutes);
  app.use('/api', userRoutes);

  return app;
}

const app = createApp();

export default app;
