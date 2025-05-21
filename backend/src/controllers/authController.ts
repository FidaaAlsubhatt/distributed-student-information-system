import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool, getDepartmentPool } from '../db'; 

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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const userResult = await pool.query(
      'SELECT * FROM central.users WHERE email ILIKE $1',
      [email]
    );

    const user: User = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    // Standard password validation
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
     
    // Step 1: Get user's roles and department roles
    const rolesResult = await pool.query(
      `SELECT ur.user_id, ur.role_id, r.name as role_name, r.scope as role_scope 
       FROM central.user_roles ur
       JOIN central.roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = $1`,
      [user.user_id]
    );
    const roles: UserRole[] = rolesResult.rows;
    
    const deptRolesResult = await pool.query(
      `SELECT udr.user_id, udr.dept_id, udr.role_id, r.name as role_name, 
              d.name as dept_name, d.schema_prefix
       FROM central.user_department udr
       JOIN central.roles r ON udr.role_id = r.role_id
       JOIN central.departments d ON udr.dept_id = d.dept_id
       WHERE udr.user_id = $1`,
      [user.user_id]
    );
    const departmentRoles: UserDepartmentRole[] = deptRolesResult.rows;
    
    // Step 2: Initialize profile
    let profile: UserProfile | null = null;
    
    // Step 3: Determine profile source based on role
    const hasCentralRole = roles.some(role => 
      role.role_scope === 'central' && ['admin', 'central_admin'].includes(role.role_name)
    );
    
    // Special handling for department admins who also have central-level data
    const isDepartmentAdmin = roles.some(role => role.role_name === 'department_admin');
    
    if (hasCentralRole || isDepartmentAdmin) {
      // For central admins and department admins, get profile from central database
      const profileResult = await pool.query(
        'SELECT * FROM central.user_profiles WHERE user_id = $1',
        [user.user_id]
      );
      
      if (profileResult.rowCount) {
        profile = profileResult.rows[0];
      }
    } else if (departmentRoles.length > 0) {
      // For department users (students/staff), go directly to their department DB
      const primaryDeptRole = departmentRoles[0]; // Use first department role
      const { schema_prefix } = primaryDeptRole;
      
      // Get user ID mapping - Use email instead of ID to avoid UUID format issues
      const mapResult = await pool.query(
        `SELECT local_user_id FROM central.user_id_map 
         WHERE university_email = $1 AND dept_id = $2`,
        [user.email, primaryDeptRole.dept_id]
      );
      
      if (mapResult.rowCount) {
        const { local_user_id } = mapResult.rows[0];
        const deptPool = await getDepartmentPool(schema_prefix);
        
        // Fetch profile from department database
        const deptProfileResult = await deptPool.query(
          `SELECT first_name, last_name FROM ${schema_prefix}.user_profiles WHERE user_id = $1`,
          [local_user_id]
        );
        
        if (deptProfileResult.rowCount) {
          profile = deptProfileResult.rows[0];
        }
      }
    } else {
      // Fallback: try central profile for any other case
      const profileResult = await pool.query(
        'SELECT * FROM central.user_profiles WHERE user_id = $1',
        [user.user_id]
      );
      
      if (profileResult.rowCount) {
        profile = profileResult.rows[0];
      }
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email
      },
      process.env.SESSION_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const formattedRoles = roles.map(role => ({
      id: role.role_id,
      name: role.role_name,
      scope: role.role_scope
    }));

    const formattedDeptRoles = departmentRoles.map(deptRole => ({
      id: deptRole.role_id,
      name: deptRole.role_name,
      departmentId: deptRole.dept_id,
      departmentName: deptRole.dept_name,
      departmentCode: deptRole.schema_prefix
    }));

    return res.status(200).json({
      token,
      userId: user.user_id,
      username: profile ? `${profile.first_name} ${profile.last_name}` : user.email,
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
      'SELECT * FROM central.users WHERE user_id = $1',
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
