// src/routes/user.routes.ts
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getUsers, getDepartments, createUser } from '../controllers/userController';

const router = express.Router();

// User routes
router.get('/users', authenticate, getUsers);
router.post('/users', authenticate, createUser);
router.get('/departments', authenticate, getDepartments);

export default router;
