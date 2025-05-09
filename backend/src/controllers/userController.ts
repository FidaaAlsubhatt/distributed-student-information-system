import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db';

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, departmentId } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT * FROM central.users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Generate UUID for the new user
    const userId = uuidv4();

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert the user
      await client.query(
        'INSERT INTO central.users (user_id, email, password_hash, status, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [userId, email, passwordHash, 'active']
      );

      // Insert user profile
      await client.query(
        'INSERT INTO central.user_profiles (user_id, first_name, last_name, timezone) VALUES ($1, $2, $3, $4)',
        [userId, firstName, lastName, 'UTC']
      );

      // Get the role ID
      let roleId;
      let roleScope = '';
      
      if (role === 'central_admin') {
        const roleResult = await client.query(
          'SELECT role_id, scope FROM central.roles WHERE name = $1',
          ['central_admin']
        );
        roleId = roleResult.rows[0].role_id;
        roleScope = roleResult.rows[0].scope;
      } else if (role === 'department_admin') {
        const roleResult = await client.query(
          'SELECT role_id, scope FROM central.roles WHERE name = $1',
          ['department_admin']
        );
        roleId = roleResult.rows[0].role_id;
        roleScope = roleResult.rows[0].scope;
      } else {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Invalid role' });
      }

      // Assign global role
      await client.query(
        'INSERT INTO central.user_roles (user_id, role_id, assigned_at) VALUES ($1, $2, NOW())',
        [userId, roleId]
      );

      // If department admin, assign to department
      if (role === 'department_admin' && departmentId) {
        // Check if department exists
        const deptResult = await client.query(
          'SELECT * FROM central.departments WHERE dept_id = $1',
          [departmentId]
        );

        if (deptResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: 'Department not found' });
        }

        // Assign department role
        await client.query(
          'INSERT INTO central.user_department (user_id, dept_id, role_id, assigned_at) VALUES ($1, $2, $3, NOW())',
          [userId, departmentId, roleId]
        );
      }

      await client.query('COMMIT');

      // Return the created user
      return res.status(201).json({
        userId,
        email,
        firstName,
        lastName,
        role,
        departmentId: role === 'department_admin' ? departmentId : null
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    // Get all users with their roles
    const usersResult = await pool.query(`
      SELECT u.user_id, u.email, u.status, u.created_at,
             p.first_name, p.last_name, p.phone, p.office, p.timezone,
             r.name as role_name, r.scope as role_scope
      FROM central.users u
      JOIN central.user_profiles p ON u.user_id = p.user_id
      JOIN central.user_roles ur ON u.user_id = ur.user_id
      JOIN central.roles r ON ur.role_id = r.role_id
      ORDER BY u.created_at DESC
    `);

    // Format users for the frontend
    const users = usersResult.rows.map(user => ({
      id: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`,
      phone: user.phone,
      office: user.office,
      timezone: user.timezone,
      role: user.role_name,
      roleScope: user.role_scope,
      status: user.status,
      createdAt: user.created_at
    }));

    return res.status(200).json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  try {
    // Get all departments
    const departmentsResult = await pool.query(`
      SELECT dept_id, name, host, port, dbname, schema_prefix, status, contact_email
      FROM central.departments
      ORDER BY name ASC
    `);

    return res.status(200).json(departmentsResult.rows);
  } catch (error) {
    console.error('Get departments error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
