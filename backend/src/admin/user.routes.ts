// src/admin/user.routes.ts
import express from 'express';
import { authenticate } from '../middleware/auth.middleware'; // ✅ import middleware

const router = express.Router();

router.get('/protected', authenticate, (req, res) => {
    // ✅ TypeScript-safe check for req.user
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }
  
    res.json({ message: `✅ Welcome, user ${req.user.userId}` });
  });
  

export default router;

