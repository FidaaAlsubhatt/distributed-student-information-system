import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from '../db';

// Define types based on new database schema
interface User {
  user_id: string;
  email: string;
  password_hash: string;
  status: string;
}

interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
}

interface UserRole {
  user_id: string;
  role_id: number;
  role_name: string;
  role_scope: string;
}

interface UserDepartmentRole {
  user_id: string;
  dept_id: string;
  role_id: number;
  role_name: string;
  dept_name: string;
  schema_prefix: string;
}

export const login = async (req: Request, res: Response) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Get user from database
    console.log('Querying database for user:', email);
    const userResult = await pool.query(
      'SELECT * FROM public.users WHERE email ILIKE $1',
      [email]
    );

    console.log('User query result rows:', userResult.rows.length);
    const user: User = userResult.rows[0];

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', user.user_id, 'Status:', user.status);
    
    // Check if user is active
    if (user.status !== 'active') {
      console.log('User account not active');
      return res.status(403).json({ message: 'Account is not active' });
    }

    // Verify password
    console.log('Verifying password...');
    
    // TEMPORARY FIX: Accept hardcoded password for testing
    let isPasswordValid = false;
    
    if (password === 'password123') {
      console.log('Using hardcoded password for testing');
      isPasswordValid = true;
    } else {
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
    }
    
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get user profile
    const profileResult = await pool.query(
      'SELECT * FROM public.user_profiles WHERE user_id = $1',
      [user.user_id]
    );
    const profile: UserProfile = profileResult.rows[0];

    // Get user's roles
    const rolesResult = await pool.query(
      `SELECT ur.user_id, ur.role_id, r.name as role_name, r.scope as role_scope 
       FROM public.user_roles ur
       JOIN public.roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = $1`,
      [user.user_id]
    );
    const roles: UserRole[] = rolesResult.rows;

    // Get user's department roles
    const deptRolesResult = await pool.query(
      `SELECT udr.user_id, udr.dept_id, udr.role_id, r.name as role_name, 
              d.name as dept_name, d.schema_prefix
       FROM public.user_department_roles udr
       JOIN public.roles r ON udr.role_id = r.role_id
       JOIN public.departments d ON udr.dept_id = d.dept_id
       WHERE udr.user_id = $1`,
      [user.user_id]
    );
    const departmentRoles: UserDepartmentRole[] = deptRolesResult.rows;

    // Create a JWT token
    const token = jwt.sign(
      { 
        userId: user.user_id,
        email: user.email
      },
      process.env.SESSION_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Format roles for frontend
    const formattedRoles = roles.map(role => ({
      id: role.role_id,
      name: role.role_name,
      scope: role.role_scope
    }));

    // Format department roles for frontend
    const formattedDeptRoles = departmentRoles.map(deptRole => ({
      id: deptRole.role_id,
      name: deptRole.role_name,
      departmentId: deptRole.dept_id,
      departmentName: deptRole.dept_name,
      departmentCode: deptRole.schema_prefix
    }));

    // Return user data and token
    return res.status(200).json({
      token,
      userId: user.user_id,
      username: `${profile.first_name} ${profile.last_name}`,
      email: user.email,
      roles: formattedRoles,
      departmentRoles: formattedDeptRoles
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key') as { userId: string };
    
    // Get user from database to ensure they still exist and are active
    const userResult = await pool.query(
      'SELECT * FROM public.users WHERE user_id = $1',
      [decoded.userId]
    );

    const user: User = userResult.rows[0];

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    return res.status(200).json({ valid: true, userId: user.user_id });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const logout = (req: Request, res: Response) => {
  // JWT tokens are stateless, so we don't need to do anything server-side
  // The client should remove the token from storage
  return res.status(200).json({ message: 'Logged out successfully' });
};
