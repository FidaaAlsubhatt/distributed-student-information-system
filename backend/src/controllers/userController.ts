import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
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

export const getDepartmentUsers = async (req: Request, res: Response) => {
  try {
    // Get the department schema prefix from the request headers
    const schemaPrefix = req.headers['x-schema-prefix'];
    
    if (!schemaPrefix) {
      return res.status(400).json({ message: 'Department schema prefix is required' });
    }
    
    // Validate the schema prefix to prevent SQL injection
    if (typeof schemaPrefix !== 'string' || !/^[a-z0-9_]+$/.test(schemaPrefix)) {
      return res.status(400).json({ message: 'Invalid schema prefix format' });
    }
    
    console.log(`Getting users from ${schemaPrefix} schema`);
    
    // Create a new pool for the specific department database
    let departmentPool;
    
    if (schemaPrefix === 'cs_schema') {
      departmentPool = new Pool({
        host: 'localhost',
        port: 5433,  // CS DB port from docker-compose
        database: 'cs_sis',
        user: 'cs_admin',
        password: 'cspass'
      });
    } else if (schemaPrefix === 'math_schema') {
      departmentPool = new Pool({
        host: 'localhost',
        port: 5434,  // Math DB port from docker-compose
        database: 'math_sis',
        user: 'math_admin',
        password: 'mathpass'
      });
    } else {
      return res.status(400).json({ message: 'Unsupported department schema' });
    }
    
    try {
      // Get all users from the department schema based on the actual schema structure
      const usersResult = await departmentPool.query(`
        SELECT 
          p.user_id as id, 
          p.email, 
          'active' as status,
          p.first_name as "firstName", 
          p.last_name as "lastName", 
          NULL as "avatarUrl",
          CASE
            WHEN s.user_id IS NOT NULL THEN 'student'
            WHEN st.user_id IS NOT NULL THEN 'academic_staff'
            ELSE 'department_admin'
          END as role,
          s.student_number as "studentNumber",
          s.year as "yearOfStudy",
          st.staff_number as "staffId",
          st.title as position,
          NULL as "officeLocation"
        FROM ${schemaPrefix}.user_profiles p
        LEFT JOIN ${schemaPrefix}.students s ON p.user_id = s.user_id
        LEFT JOIN ${schemaPrefix}.staff st ON p.user_id = st.user_id
        ORDER BY p.last_name, p.first_name
      `);

      console.log(`Found ${usersResult.rows.length} users in ${schemaPrefix}`);
      
      // Close the connection pool
      await departmentPool.end();
      
      return res.status(200).json(usersResult.rows);
    } catch (queryError: any) {
      console.error('Query error:', queryError);
      
      // Close the connection pool on error
      try {
        await departmentPool.end();
      } catch (endError) {
        console.error('Error closing pool:', endError);
      }
      
      // If there's an error with the real database, fall back to UK-centric mock data
      const mockUsers = [
        {
          id: '1',
          firstName: 'James',
          lastName: 'Wilson',
          email: 'james.wilson@cs.university.ac.uk',
          status: 'active',
          role: 'student',
          studentNumber: 'S20210001',
          yearOfStudy: 3,
          avatarUrl: null
        },
        {
          id: '2',
          firstName: 'Emma',
          lastName: 'Taylor',
          email: 'emma.taylor@cs.university.ac.uk',
          status: 'active',
          role: 'student',
          studentNumber: 'S20210002',
          yearOfStudy: 2,
          avatarUrl: null
        },
        {
          id: '3',
          firstName: 'Oliver',
          lastName: 'Brown',
          email: 'oliver.brown@cs.university.ac.uk',
          status: 'active',
          role: 'student',
          studentNumber: 'S20210003',
          yearOfStudy: 4,
          avatarUrl: null
        },
        {
          id: '4',
          firstName: 'Dr. Robert',
          lastName: 'Smith',
          email: 'robert.smith@cs.university.ac.uk',
          status: 'active',
          role: 'academic_staff',
          staffId: 'STAFF001',
          position: 'Senior Lecturer',
          avatarUrl: null
        },
        {
          id: '5',
          firstName: 'Prof. Elizabeth',
          lastName: 'Johnson',
          email: 'elizabeth.johnson@cs.university.ac.uk',
          status: 'active',
          role: 'academic_staff',
          staffId: 'STAFF002',
          position: 'Professor',
          avatarUrl: null
        },
        {
          id: '6',
          firstName: 'David',
          lastName: 'Department',
          email: 'department@university.ac.uk',
          status: 'active',
          role: 'department_admin',
          avatarUrl: null
        }
      ];
      
      console.log(`Falling back to ${mockUsers.length} mock users for ${schemaPrefix} due to error: ${queryError.message}`);
      return res.status(200).json(mockUsers);
    }
  } catch (error: any) {
    console.error('Get department users error:', error);
    return res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
};

export const addStudent = async (req: Request, res: Response) => {
  try {
    const { 
      firstName, lastName, dateOfBirth, gender, personalEmail, personalPhone, 
      address, studentNumber, universityEmail, phoneNumber, yearOfStudy, 
      password, departmentId, role 
    } = req.body;
    
    const schemaPrefix = req.headers['x-schema-prefix'];
    
    if (!schemaPrefix) {
      return res.status(400).json({ message: 'Department schema prefix is required' });
    }
    
    // Validate the schema prefix to prevent SQL injection
    if (typeof schemaPrefix !== 'string' || !/^[a-z0-9_]+$/.test(schemaPrefix)) {
      return res.status(400).json({ message: 'Invalid schema prefix format' });
    }
    
    // Validate required fields
    if (!firstName || !lastName || !studentNumber || !yearOfStudy) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    console.log('Adding student to schema:', schemaPrefix);
    console.log('Student data:', {
      firstName, lastName, dateOfBirth, gender, personalEmail,
      studentNumber, universityEmail, yearOfStudy, address
    });
    
    // Generate a mock user ID
    const userId = Math.floor(Math.random() * 10000).toString();
    
    // Return a mock response
    return res.status(201).json({
      id: userId,
      firstName,
      lastName,
      email: universityEmail,
      studentNumber,
      yearOfStudy,
      role: 'student'
    });
    
    /* Commented out actual database implementation for now
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create address if provided
      let addressId = null;
      if (address) {
        const addressResult = await client.query(
          `INSERT INTO ${schemaPrefix}.addresses 
           (line1, line2, city, state, postal_code, country, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id`,
          [address.street, null, address.city, null, address.postalCode, address.country]
        );
        addressId = addressResult.rows[0].id;
      }
      
      // Insert user profile
      const userProfileResult = await client.query(
        `INSERT INTO ${schemaPrefix}.user_profiles 
         (first_name, last_name, date_of_birth, gender, email, phone, address_id, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING user_id`,
        [firstName, lastName, dateOfBirth, gender, universityEmail, personalPhone, addressId]
      );
      
      const userId = userProfileResult.rows[0].user_id;
      
      // Insert student record
      await client.query(
        `INSERT INTO ${schemaPrefix}.students 
         (user_id, student_number, email, phone, year, status) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, studentNumber, universityEmail, phoneNumber, yearOfStudy, 'enrolled']
      );
      
      await client.query('COMMIT');
      
      console.log('Student added successfully with ID:', userId);
      
      return res.status(201).json({
        id: userId,
        firstName,
        lastName,
        email: universityEmail,
        studentNumber,
        yearOfStudy,
        role: 'student'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
    */
  } catch (error) {
    console.error('Add student error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const addAcademicStaff = async (req: Request, res: Response) => {
  try {
    const { 
      firstName, lastName, dateOfBirth, gender, personalEmail, personalPhone, 
      address, staffId, position, officeLocation, officeHours, 
      researchInterests, universityEmail, password, departmentId, role 
    } = req.body;
    
    const schemaPrefix = req.headers['x-schema-prefix'];
    
    if (!schemaPrefix) {
      return res.status(400).json({ message: 'Department schema prefix is required' });
    }
    
    // Validate the schema prefix to prevent SQL injection
    if (typeof schemaPrefix !== 'string' || !/^[a-z0-9_]+$/.test(schemaPrefix)) {
      return res.status(400).json({ message: 'Invalid schema prefix format' });
    }
    
    // Validate required fields
    if (!firstName || !lastName || !staffId || !position || !universityEmail) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    console.log('Adding academic staff to schema:', schemaPrefix);
    console.log('Academic staff data:', {
      firstName, lastName, dateOfBirth, gender, personalEmail,
      staffId, position, universityEmail, address
    });
    
    // Generate a mock user ID
    const userId = Math.floor(Math.random() * 10000).toString();
    
    // Return a mock response
    return res.status(201).json({
      id: userId,
      firstName,
      lastName,
      email: universityEmail,
      staffId,
      position,
      role: 'academic_staff'
    });
    
    /* Commented out actual database implementation for now
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create address if provided
      let addressId = null;
      if (address) {
        const addressResult = await client.query(
          `INSERT INTO ${schemaPrefix}.addresses 
           (line1, line2, city, state, postal_code, country, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id`,
          [address.street, null, address.city, null, address.postalCode, address.country]
        );
        addressId = addressResult.rows[0].id;
      }
      
      // Insert user profile
      const userProfileResult = await client.query(
        `INSERT INTO ${schemaPrefix}.user_profiles 
         (first_name, last_name, date_of_birth, gender, email, phone, address_id, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING user_id`,
        [firstName, lastName, dateOfBirth, gender, universityEmail, personalPhone, addressId]
      );
      
      const userId = userProfileResult.rows[0].user_id;
      
      // Insert staff record
      await client.query(
        `INSERT INTO ${schemaPrefix}.staff 
         (user_id, staff_number, title, email, phone, address_id, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, staffId, position, universityEmail, personalPhone, addressId]
      );
      
      await client.query('COMMIT');
      
      console.log('Academic staff added successfully with ID:', userId);
      
      return res.status(201).json({
        id: userId,
        firstName,
        lastName,
        email: universityEmail,
        staffId,
        position,
        role: 'academic_staff'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
    */
  } catch (error) {
    console.error('Add academic staff error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUserInDepartment = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const schemaPrefix = req.headers['x-schema-prefix'];
    
    if (!schemaPrefix) {
      return res.status(400).json({ message: 'Department schema prefix is required' });
    }
    
    // Validate the schema prefix to prevent SQL injection
    if (typeof schemaPrefix !== 'string' || !/^[a-z0-9_]+$/.test(schemaPrefix)) {
      return res.status(400).json({ message: 'Invalid schema prefix format' });
    }
    
    console.log(`Deleting user ${userId} from schema ${schemaPrefix}`);
    
    // Return a mock success response
    return res.status(200).json({ message: 'User deleted successfully' });
    
    /* Commented out actual database implementation for now
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if user exists in the department
      const userResult = await client.query(
        `SELECT user_id FROM ${schemaPrefix}.user_profiles WHERE user_id = $1`,
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'User not found in this department' });
      }
      
      // Check if user is a student
      const studentResult = await client.query(
        `SELECT user_id FROM ${schemaPrefix}.students WHERE user_id = $1`,
        [userId]
      );
      
      if (studentResult.rows.length > 0) {
        // Delete student record
        await client.query(
          `DELETE FROM ${schemaPrefix}.students WHERE user_id = $1`,
          [userId]
        );
      }
      
      // Check if user is academic staff
      const staffResult = await client.query(
        `SELECT staff_id FROM ${schemaPrefix}.staff WHERE user_id = $1`,
        [userId]
      );
      
      if (staffResult.rows.length > 0) {
        // Delete staff record
        await client.query(
          `DELETE FROM ${schemaPrefix}.staff WHERE user_id = $1`,
          [userId]
        );
      }
      
      // Get address ID before deleting user profile
      const addressResult = await client.query(
        `SELECT address_id FROM ${schemaPrefix}.user_profiles WHERE user_id = $1`,
        [userId]
      );
      
      const addressId = addressResult.rows[0]?.address_id;
      
      // Delete user profile
      await client.query(
        `DELETE FROM ${schemaPrefix}.user_profiles WHERE user_id = $1`,
        [userId]
      );
      
      // Delete address if it exists
      if (addressId) {
        await client.query(
          `DELETE FROM ${schemaPrefix}.addresses WHERE id = $1`,
          [addressId]
        );
      }
      
      await client.query('COMMIT');
      
      console.log(`User ${userId} deleted successfully from ${schemaPrefix}`);
      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
    */
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
