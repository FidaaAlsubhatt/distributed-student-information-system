import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../../db';

/**
 * Controller function to create a new administrator (central or department)
 */
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, departmentId } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ message: 'Missing required fields: email, password, firstName, lastName, and role are required' });
    }

    // Validate the role
    if (role !== 'central_admin' && role !== 'department_admin') {
      return res.status(400).json({ message: 'Invalid role: must be central_admin or department_admin' });
    }

    // If role is department_admin, departmentId is required
    if (role === 'department_admin' && !departmentId) {
      return res.status(400).json({ message: 'Department ID is required for department administrators' });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT * FROM central.users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const userResult = await client.query(
        'INSERT INTO central.users (email, password_hash, status, created_at) VALUES ($1, $2, $3, NOW()) RETURNING user_id',
        [email, passwordHash, 'active']
      );

      const userId = userResult.rows[0].user_id;

      // Insert user profile
      await client.query(
        'INSERT INTO central.user_profiles (user_id, first_name, last_name, timezone, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
        [userId, firstName, lastName, 'UTC']
      );

      // Get role ID for the selected role
      const roleResult = await client.query(
        'SELECT role_id FROM central.roles WHERE name = $1',
        [role]
      );

      if (roleResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: `Role not found: ${role}` });
      }

      const roleId = roleResult.rows[0].role_id;

      // Assign role to user
      await client.query(
        'INSERT INTO central.user_roles (user_id, role_id, assigned_at) VALUES ($1, $2, NOW())',
        [userId, roleId]
      );

      // If department admin, assign to the department
      if (role === 'department_admin') {
        // Check if department exists
        const departmentResult = await client.query(
          'SELECT * FROM central.departments WHERE dept_id = $1',
          [departmentId]
        );

        if (departmentResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: 'Department not found' });
        }

        // Assign to department with the appropriate role
        await client.query(
          'INSERT INTO central.user_department (user_id, dept_id, role_id, assigned_at) VALUES ($1, $2, $3, NOW())',
          [userId, departmentId, roleId]
        );
      }

      // Commit the transaction
      await client.query('COMMIT');

      // Return the created admin
      return res.status(201).json({
        userId,
        email,
        firstName,
        lastName,
        role,
        departmentId: role === 'department_admin' ? departmentId : null,
        message: `${role === 'central_admin' ? 'Central' : 'Department'} administrator created successfully`
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create admin error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all administrators (central and/or department)
 */
export const getAdmins = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    
    let query = `
      SELECT u.user_id, u.email, u.status, u.created_at,
             p.first_name, p.last_name, 
             r.name as role_name, 
             d.dept_id, d.name as department_name
      FROM central.users u
      JOIN central.user_profiles p ON u.user_id = p.user_id
      JOIN central.user_roles ur ON u.user_id = ur.user_id
      JOIN central.roles r ON ur.role_id = r.role_id
      LEFT JOIN central.user_department ud ON u.user_id = ud.user_id
      LEFT JOIN central.departments d ON ud.dept_id = d.dept_id
      WHERE r.name IN ('central_admin', 'department_admin')
    `;
    
    if (type === 'central') {
      query += " AND r.name = 'central_admin'";
    } else if (type === 'department') {
      query += " AND r.name = 'department_admin'";
    }
    
    query += " ORDER BY u.created_at DESC";
    
    const result = await pool.query(query);
    
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get admins error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get details for a specific administrator
 */
export const getAdminById = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    
    const query = `
      SELECT u.user_id, u.email, u.status, u.created_at,
             p.first_name, p.last_name, p.phone, p.office,
             r.name as role_name, r.role_id,
             d.dept_id, d.name as department_name
      FROM central.users u
      JOIN central.user_profiles p ON u.user_id = p.user_id
      JOIN central.user_roles ur ON u.user_id = ur.user_id
      JOIN central.roles r ON ur.role_id = r.role_id
      LEFT JOIN central.user_department ud ON u.user_id = ud.user_id
      LEFT JOIN central.departments d ON ud.dept_id = d.dept_id
      WHERE u.user_id = $1 AND r.name IN ('central_admin', 'department_admin')
    `;
    
    const result = await pool.query(query, [adminId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Administrator not found' });
    }
    
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Get admin by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update an administrator's details
 */
export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    const { firstName, lastName, phone, office, departmentId, status } = req.body;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if admin exists and get current role
      const adminResult = await client.query(
        `SELECT u.user_id, r.name as role_name, r.role_id
         FROM central.users u
         JOIN central.user_roles ur ON u.user_id = ur.user_id
         JOIN central.roles r ON ur.role_id = r.role_id
         WHERE u.user_id = $1 AND r.name IN ('central_admin', 'department_admin')`,
        [adminId]
      );

      if (adminResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Administrator not found' });
      }

      const admin = adminResult.rows[0];

      // Update user profile
      if (firstName || lastName || phone || office) {
        let updateFields = [];
        let params = [adminId];
        let paramCount = 2;

        if (firstName) {
          updateFields.push(`first_name = $${paramCount++}`);
          params.push(firstName);
        }
        if (lastName) {
          updateFields.push(`last_name = $${paramCount++}`);
          params.push(lastName);
        }
        if (phone) {
          updateFields.push(`phone = $${paramCount++}`);
          params.push(phone);
        }
        if (office) {
          updateFields.push(`office = $${paramCount++}`);
          params.push(office);
        }

        updateFields.push(`updated_at = NOW()`);

        if (updateFields.length > 0) {
          await client.query(
            `UPDATE central.user_profiles SET ${updateFields.join(', ')} WHERE user_id = $1`,
            params
          );
        }
      }

      // Update user status
      if (status) {
        await client.query(
          'UPDATE central.users SET status = $1 WHERE user_id = $2',
          [status, adminId]
        );
      }

      // Handle department change for department admin
      if (departmentId && admin.role_name === 'department_admin') {
        // Check if department exists
        const departmentResult = await client.query(
          'SELECT * FROM central.departments WHERE dept_id = $1',
          [departmentId]
        );

        if (departmentResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: 'Department not found' });
        }

        // Update department assignment
        await client.query(
          `DELETE FROM central.user_department WHERE user_id = $1`,
          [adminId]
        );

        await client.query(
          `INSERT INTO central.user_department (user_id, dept_id, role_id, assigned_at) VALUES ($1, $2, $3, NOW())`,
          [adminId, departmentId, admin.role_id]
        );
      }

      await client.query('COMMIT');
      return res.status(200).json({ message: 'Administrator updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update admin error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete an administrator
 */
export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if admin exists
      const adminResult = await client.query(
        `SELECT u.user_id
         FROM central.users u
         JOIN central.user_roles ur ON u.user_id = ur.user_id
         JOIN central.roles r ON ur.role_id = r.role_id
         WHERE u.user_id = $1 AND r.name IN ('central_admin', 'department_admin')`,
        [adminId]
      );

      if (adminResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Administrator not found' });
      }

      // Delete from user_department (if exists)
      await client.query(
        'DELETE FROM central.user_department WHERE user_id = $1',
        [adminId]
      );

      // Delete from user_roles
      await client.query(
        'DELETE FROM central.user_roles WHERE user_id = $1',
        [adminId]
      );

      // Delete from user_profiles
      await client.query(
        'DELETE FROM central.user_profiles WHERE user_id = $1',
        [adminId]
      );

      // Delete the user itself
      await client.query(
        'DELETE FROM central.users WHERE user_id = $1',
        [adminId]
      );

      await client.query('COMMIT');
      return res.status(200).json({ message: 'Administrator deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete admin error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};