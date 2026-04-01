import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { pool } from '../db';

interface AuthenticatedTokenPayload extends JwtPayload {
  userId?: string | number;
  email?: string;
}

async function fetchUserRoles(userId: string): Promise<string[]> {
  const result = await pool.query(
    `SELECT DISTINCT r.name AS role_name
     FROM central.user_roles ur
     JOIN central.roles r ON ur.role_id = r.role_id
     WHERE ur.user_id = $1`,
    [userId]
  );

  return result.rows.map((row: { role_name: string }) => row.role_name);
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.SESSION_SECRET!
    ) as AuthenticatedTokenPayload | string;

    if (typeof decoded === 'string' || decoded.userId === undefined) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    req.user = {
      userId: String(decoded.userId),
      email: decoded.email,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function authorizeRoles(...allowedRoles: string[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    try {
      const userRoles = req.user.roles ?? await fetchUserRoles(String(req.user.userId));
      req.user.roles = userRoles;

      const hasRequiredRole = allowedRoles.some((role) => userRoles.includes(role));

      if (!hasRequiredRole) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ error: 'Failed to authorize user' });
    }
  };
}
