import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SESSION_SECRET!);
    res.json({ message: 'Welcome to the dashboard', user: decoded });
  } catch (e) {
    res.sendStatus(403);
  }
});

export default router;

