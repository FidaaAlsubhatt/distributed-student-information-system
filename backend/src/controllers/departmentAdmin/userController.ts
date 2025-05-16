// src/controllers/departmentAdmin/userController.ts
import { Request, Response, NextFunction } from 'express';
import { pool as centralPool } from '../../db';
import { getDepartmentPool } from '../../db';

// Mapping for user types and their tables/columns
const USER_CONFIG = {
  student: {
    profileTable: 'user_profiles',
    specificTable: 'students',
    joinColumn: 'user_id',
    specificColumns: ['student_number', 'university_email', 'year', 'status'],
    insertColumns: ['student_number', 'university_email', 'year']
  },
  staff: {
    profileTable: 'user_profiles',
    specificTable: 'staff',
    joinColumn: 'user_id',
    specificColumns: ['staff_number', 'university_email', 'title'],
    insertColumns: ['staff_number', 'university_email', 'title']
  }
} as const;

type UserType = keyof typeof USER_CONFIG;

function assertUserType(x: any): asserts x is UserType {
  if (!['student','staff'].includes(x)) {
    throw new Error('Invalid userType');
  }
}

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userType } = req.params;
    assertUserType(userType);
    
    // Get user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    console.log(`Getting ${userType} users for admin ID: ${userId}`);
    
    try {
      // First get the user's email from their ID
      const userResult = await centralPool.query(
        'SELECT email FROM central.users WHERE user_id = $1',
        [userId]
      );
      
      if (!userResult.rowCount) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const email = userResult.rows[0].email;
      console.log(`Found user email: ${email}`);
      
      // Find department admin's department using email
      const mapResult = await centralPool.query(
        `SELECT d.dept_id, d.schema_prefix 
         FROM central.user_department ud
         JOIN central.departments d ON ud.dept_id = d.dept_id
         JOIN central.users u ON ud.user_id = u.user_id
         WHERE u.email = $1`,
        [email]
      );
      
      if (!mapResult.rowCount) {
        return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
      }
      
      const { schema_prefix } = mapResult.rows[0];
      console.log(`Found department with schema prefix: ${schema_prefix}`);
      
      // Get department-specific database connection
      const deptPool = await getDepartmentPool(schema_prefix);
      
      if (!deptPool) {
        return res.status(500).json({ message: 'Failed to connect to department database' });
      }

      // Get configuration for the user type
      const { profileTable, specificTable, joinColumn, specificColumns } = USER_CONFIG[userType];

      // Build columns for SELECT
      const profileColumns = ['p.user_id', 'p.first_name', 'p.last_name', 'p.personal_email', 
                             'p.gender', 'p.date_of_birth']
        .map(col => `${col} as ${col.replace('p.', '')}`);

      const specificCols = specificColumns
        .map(col => `s.${col} as ${col}`);

      const allColumns = [...profileColumns, ...specificCols].join(',');
      
      const query = `
        SELECT ${allColumns}
        FROM ${schema_prefix}.${profileTable} p
        JOIN ${schema_prefix}.${specificTable} s ON p.${joinColumn} = s.${joinColumn}
        ORDER BY p.last_name, p.first_name
      `;
      
      console.log(`Executing query: ${query}`);

      // Execute the query with JOIN to get complete user data
      const result = await deptPool.query(query);
      
      console.log(`Query returned ${result.rowCount} rows`);

      // Transform data format if needed for frontend
      const users = result.rows.map((row: any) => {
        // Transform column names to camelCase for frontend consumption
        const transformedUser = {
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.university_email || row.personal_email,
          personalEmail: row.personal_email,
          gender: row.gender,
          dateOfBirth: row.date_of_birth
        };

        // Add user type specific fields
        if (userType === 'student') {
          return {
            ...transformedUser,
            studentNumber: row.student_number,
            yearOfStudy: row.year,
            status: row.status || 'active'
          };
        } else { // staff
          return {
            ...transformedUser,
            staffId: row.staff_number,
            position: row.title || 'Faculty Member',
            universityEmail: row.university_email,
            status: 'active'
          };
        }
      });

      res.json({ users });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        message: 'Database error occurred', 
        error: dbError.message,
        detail: dbError.detail
      });
    }
  } catch (err: any) {
    console.error('General error in getUsers:', err);
    res.status(500).json({ message: err.message || 'An unknown error occurred' });
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userType } = req.params;
    assertUserType(userType);

    // Get the request payload and convert to snake_case for DB
    const payload = req.body;
    
    // Get user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Get the user's email from their ID
    const userResult = await centralPool.query(
      'SELECT email FROM central.users WHERE user_id = $1',
      [userId]
    );
    
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const email = userResult.rows[0].email;

    // Add required fields for the DB based on payload
    const profileData = {
      first_name: payload.firstName,
      last_name: payload.lastName,
      personal_email: payload.personalEmail || payload.email,
      gender: payload.gender,
      date_of_birth: payload.dateOfBirth
    };

    // Find department admin's department using email
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];

    // Get department-specific database pool
    const deptPool = await getDepartmentPool(schema_prefix);
    const client = await deptPool.connect(); // Use a client for transaction
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // 1. Insert into user_profiles table
      const config = USER_CONFIG[userType as 'student' | 'staff'];
      const { profileTable } = config;
      
      const profileCols = Object.keys(profileData);
      const profileValues = Object.values(profileData);
      
      const profilePlaceholders = profileCols.map((_, i) => `$${i+1}`).join(',');
      
      const profileInsert = `
        INSERT INTO ${schema_prefix}.${profileTable} (${profileCols.join(',')}) 
        VALUES (${profilePlaceholders})
        RETURNING user_id;
      `;
      const profileResult = await client.query(profileInsert, profileValues);
      const userId = profileResult.rows[0].user_id;
      
      // 2. Now insert into the specific table (students or staff)
      const { specificTable, insertColumns } = USER_CONFIG[userType as 'student' | 'staff'];
      
      // Prepare specific values based on user type
      let specificValues: any[] = [];
      let specificCols: string[] = ['user_id'];
      
      if (userType === 'student') {
        specificCols = [...specificCols, ...insertColumns];
        specificValues = [
          userId,
          payload.studentNumber,
          payload.email, // university_email
          payload.yearOfStudy
        ];
      } else { // staff
        specificCols = [...specificCols, ...insertColumns];
        specificValues = [
          userId,
          payload.staffId, // staff_number
          payload.email || payload.universityEmail, // university_email
          payload.position // title
        ];
      }
      
      const specificPlaceholders = specificCols.map((_, i) => `$${i+1}`).join(',');
      
      const specificInsert = `
        INSERT INTO ${schema_prefix}.${specificTable} (${specificCols.join(',')})
        VALUES (${specificPlaceholders})
        RETURNING *;
      `;
      
      const specificResult = await client.query(specificInsert, specificValues);
      
      // Commit the transaction
      await client.query('COMMIT');
      
      // Prepare the response data in camelCase for frontend
      const newUser = {
        id: userId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        personalEmail: payload.personalEmail || payload.email,
        gender: payload.gender,
        dateOfBirth: payload.dateOfBirth,
        status: 'active'
      };
      
      if (userType === 'student') {
        Object.assign(newUser, {
          studentNumber: payload.studentNumber,
          yearOfStudy: payload.yearOfStudy
        });
      } else { // staff
        Object.assign(newUser, {
          staffId: payload.staffId,
          position: payload.position,
          universityEmail: payload.email || payload.universityEmail
        });
      }
      
      res.status(201).json({ user: newUser });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userType, id } = req.params;
    assertUserType(userType);

    // Get user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Get the user's email from their ID
    const userResult = await centralPool.query(
      'SELECT email FROM central.users WHERE user_id = $1',
      [userId]
    );
    
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const email = userResult.rows[0].email;
    
    // Find department admin's department using email
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Connect to the department database
    const deptPool = await getDepartmentPool(schema_prefix);
    const { profileTable } = USER_CONFIG[userType as 'student' | 'staff'];

    // Deleting from user_profiles will cascade to the specific table due to ON DELETE CASCADE
    await deptPool.query(`
      DELETE FROM ${schema_prefix}.${profileTable}
      WHERE user_id = $1
    `, [id]);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  // Get a client for transaction handling
  const client = await centralPool.connect();
  
  try {
    const { userType, id } = req.params;
    assertUserType(userType);
    const payload = req.body;
    
    // Get user ID from JWT token
    const adminUserId = req.user?.userId;
    if (!adminUserId) {
      return res.status(400).json({ message: 'Admin user ID not available' });
    }
    
    // Get the admin's email from their ID
    const userResult = await client.query(
      'SELECT email FROM central.users WHERE user_id = $1',
      [adminUserId]
    );
    
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    const email = userResult.rows[0].email;
    
    // Find department admin's department using email
    const mapResult = await client.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Connect to the department database
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // Begin transaction
    await client.query('BEGIN');
    
    // First verify the user exists
    const { profileTable, specificTable, specificColumns } = USER_CONFIG[userType];
    const userCheckQuery = `
      SELECT p.user_id FROM ${schema_prefix}.${profileTable} p
      WHERE p.user_id = $1
    `;
    
    const userCheck = await deptPool.query(userCheckQuery, [id]);
    if (!userCheck.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} not found` });
    }
    
    // 1. Update the profile table
    const profileColumns = ['first_name', 'last_name', 'personal_email', 'gender', 'date_of_birth'];
    const profileUpdateParts: string[] = [];
    const profileValues: any[] = [];
    let valueCounter = 1;
    
    // Build the SET clause dynamically based on provided fields
    profileColumns.forEach(column => {
      const camelColumn = column.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (payload[camelColumn] !== undefined) {
        profileUpdateParts.push(`${column} = $${valueCounter}`);
        profileValues.push(payload[camelColumn]);
        valueCounter++;
      }
    });
    
    // Only update if there are fields to update
    if (profileUpdateParts.length > 0) {
      const profileUpdateQuery = `
        UPDATE ${schema_prefix}.${profileTable}
        SET ${profileUpdateParts.join(', ')}
        WHERE user_id = $${valueCounter}
        RETURNING *;
      `;
      
      profileValues.push(id); // Add user_id for the WHERE clause
      await deptPool.query(profileUpdateQuery, profileValues);
    }
    
    // 2. Update the specific table (student or staff)
    const specificUpdateParts: string[] = [];
    const specificValues: any[] = [];
    valueCounter = 1;
    
    if (userType === 'student') {
      // Handle student-specific fields
      const studentFields = ['student_number', 'university_email', 'year', 'status'];
      studentFields.forEach(column => {
        let payloadField;
        switch (column) {
          case 'student_number': payloadField = 'studentNumber'; break;
          case 'university_email': payloadField = 'universityEmail'; break;
          case 'year': payloadField = 'yearOfStudy'; break;
          default: payloadField = column;
        }
        
        if (payload[payloadField] !== undefined) {
          specificUpdateParts.push(`${column} = $${valueCounter}`);
          specificValues.push(payload[payloadField]);
          valueCounter++;
        }
      });
    } else { // staff
      // Handle staff-specific fields
      const staffFields = ['staff_number', 'university_email', 'title'];
      staffFields.forEach(column => {
        let payloadField;
        switch (column) {
          case 'staff_number': payloadField = 'staffId'; break;
          case 'university_email': payloadField = 'universityEmail'; break;
          case 'title': payloadField = 'position'; break;
          default: payloadField = column;
        }
        
        if (payload[payloadField] !== undefined) {
          specificUpdateParts.push(`${column} = $${valueCounter}`);
          specificValues.push(payload[payloadField]);
          valueCounter++;
        }
      });
    }
    
    // Only update if there are fields to update
    if (specificUpdateParts.length > 0) {
      const specificUpdateQuery = `
        UPDATE ${schema_prefix}.${specificTable}
        SET ${specificUpdateParts.join(', ')}
        WHERE user_id = $${valueCounter}
        RETURNING *;
      `;
      
      specificValues.push(id); // Add user_id for the WHERE clause
      await deptPool.query(specificUpdateQuery, specificValues);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Fetch the updated user to return in the response
    const updatedUserQuery = `
      SELECT p.*, s.* 
      FROM ${schema_prefix}.${profileTable} p
      JOIN ${schema_prefix}.${specificTable} s ON p.user_id = s.user_id
      WHERE p.user_id = $1
    `;
    
    const updatedUserResult = await deptPool.query(updatedUserQuery, [id]);
    
    if (!updatedUserResult.rowCount) {
      return res.status(404).json({ message: 'User not found after update' });
    }
    
    // Transform the data for frontend consumption
    const updatedUser = {
      id: updatedUserResult.rows[0].user_id,
      firstName: updatedUserResult.rows[0].first_name,
      lastName: updatedUserResult.rows[0].last_name,
      email: updatedUserResult.rows[0].personal_email,
      gender: updatedUserResult.rows[0].gender,
      dateOfBirth: updatedUserResult.rows[0].date_of_birth
    };
    
    if (userType === 'student') {
      Object.assign(updatedUser, {
        studentNumber: updatedUserResult.rows[0].student_number,
        universityEmail: updatedUserResult.rows[0].university_email,
        yearOfStudy: updatedUserResult.rows[0].year,
        status: updatedUserResult.rows[0].status
      });
    } else { // staff
      Object.assign(updatedUser, {
        staffId: updatedUserResult.rows[0].staff_number,
        universityEmail: updatedUserResult.rows[0].university_email,
        position: updatedUserResult.rows[0].title
      });
    }
    
    res.json({ user: updatedUser });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};
