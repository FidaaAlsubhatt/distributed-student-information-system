// src/controllers/departmentAdmin/manageStudentController.ts
import { Request, Response, NextFunction } from 'express';
import { pool as centralPool } from '../../db';
import { getDepartmentPool } from '../../db';

/**
 * Get all students for the department
 */
export const getStudents = async (req: Request, res: Response) => {
  let client = null;
  
  try {
    // Get user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Get admin's email from central database
    const userResult = await centralPool.query(
      'SELECT email FROM central.users WHERE user_id = $1',
      [userId]
    );
    
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const email = userResult.rows[0].email;
    
    // Find department admin's department details
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix, d.name AS department_name
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix, department_name } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Fetch all students from the department schema
    const query = `
      SELECT 
        s.user_id as id, 
        up.first_name as "firstName",
        up.last_name as "lastName",
        s.student_number as "studentNumber",
        s.year as "yearOfStudy",
        s.university_email as "email",
        up.personal_email as "personalEmail",
        up.gender,
        up.date_of_birth as "dateOfBirth",
        s.status
      FROM ${schema_prefix}.students s
      JOIN ${schema_prefix}.user_profiles up ON s.user_id = up.user_id
      ORDER BY up.last_name, up.first_name
    `;
    
    const result = await client.query(query);
    
    // Format dates to UK format (DD/MM/YYYY)
    const students = result.rows.map(student => ({
      ...student,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-GB') : null
    }));
    
    return res.status(200).json({ 
      users: students,
      department: department_name
    });
    
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ message: 'Failed to retrieve students' });
  } finally {
    if (client) client.release();
  }
};

/**
 * Add new student to the department
 */
export const addStudent = async (req: Request, res: Response) => {
  let client = null;
  
  try {
    const { 
      firstName, 
      lastName, 
      studentNumber, 
      yearOfStudy, 
      email, 
      personalEmail, 
      gender, 
      dateOfBirth 
    } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !studentNumber || !yearOfStudy || !email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Create university email if not provided
    const universityEmail = email;
    
    // Get user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Get admin's department
    const userResult = await centralPool.query(
      'SELECT email FROM central.users WHERE user_id = $1',
      [userId]
    );
    
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const adminEmail = userResult.rows[0].email;
    
    // Find department schema
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [adminEmail]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix, dept_id } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // 1. Create user profile entry
      const userProfileQuery = `
        INSERT INTO ${schema_prefix}.user_profiles(
          first_name, last_name, personal_email, gender, date_of_birth
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING user_id
      `;
      
      const profileResult = await client.query(userProfileQuery, [
        firstName,
        lastName,
        personalEmail || email, // Use personalEmail if available, otherwise use email
        gender,
        dateOfBirth
      ]);
      
      if (!profileResult.rowCount) {
        throw new Error('Failed to create user profile');
      }
      
      const userProfileId = profileResult.rows[0].user_id;
      
      // 2. Create student record
      const studentQuery = `
        INSERT INTO ${schema_prefix}.students(
          user_id, student_number, year, university_email, status
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING user_id
      `;
      
      const studentResult = await client.query(studentQuery, [
        userProfileId,
        studentNumber,
        yearOfStudy,
        universityEmail,
        'active' // Default status
      ]);
      
      if (!studentResult.rowCount) {
        throw new Error('Failed to create student record');
      }
      
      // 3. Map central users if required - would go here in a full implementation
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Return success with student info
      return res.status(201).json({
        message: 'Student added successfully',
        student: {
          id: userProfileId,
          firstName,
          lastName,
          studentNumber,
          yearOfStudy,
          email: universityEmail,
          personalEmail: personalEmail || email,
          gender,
          dateOfBirth,
          status: 'active'
        }
      });
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error adding student:', error);
    return res.status(500).json({ message: 'Failed to add student: ' + (error as Error).message });
  } finally {
    if (client) client.release();
  }
};

/**
 * Update existing student
 */
export const updateStudent = async (req: Request, res: Response) => {
  let client = null;
  
  try {
    const { id } = req.params;
    const { 
      firstName, 
      lastName, 
      studentNumber, 
      yearOfStudy, 
      email, 
      personalEmail, 
      gender, 
      dateOfBirth,
      status
    } = req.body;
    
    // Validate required fields
    if (!id || (!firstName && !lastName && !studentNumber && !yearOfStudy && !email && !personalEmail && !gender && !dateOfBirth && !status)) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    // Get user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Get admin's department
    const userResult = await centralPool.query(
      'SELECT email FROM central.users WHERE user_id = $1',
      [userId]
    );
    
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const adminEmail = userResult.rows[0].email;
    
    // Find department schema
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [adminEmail]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // 1. Update user profile fields if provided
      if (firstName || lastName || personalEmail || gender || dateOfBirth) {
        // Build dynamic SET clause for profile updates
        const profileUpdates = [];
        const profileValues = [];
        let paramCount = 1;
        
        if (firstName) {
          profileUpdates.push(`first_name = $${paramCount}`);
          profileValues.push(firstName);
          paramCount++;
        }
        
        if (lastName) {
          profileUpdates.push(`last_name = $${paramCount}`);
          profileValues.push(lastName);
          paramCount++;
        }
        
        if (personalEmail) {
          profileUpdates.push(`personal_email = $${paramCount}`);
          profileValues.push(personalEmail);
          paramCount++;
        }
        
        if (gender) {
          profileUpdates.push(`gender = $${paramCount}`);
          profileValues.push(gender);
          paramCount++;
        }
        
        if (dateOfBirth) {
          profileUpdates.push(`date_of_birth = $${paramCount}`);
          profileValues.push(dateOfBirth);
          paramCount++;
        }
        
        if (profileUpdates.length > 0) {
          const profileQuery = `
            UPDATE ${schema_prefix}.user_profiles
            SET ${profileUpdates.join(', ')}
            WHERE user_id = $${paramCount}
            RETURNING user_id
          `;
          
          profileValues.push(id);
          const profileResult = await client.query(profileQuery, profileValues);
          
          if (!profileResult.rowCount) {
            throw new Error('Student profile not found');
          }
        }
      }
      
      // 2. Update student record if applicable fields provided
      if (studentNumber || yearOfStudy || email || status) {
        // Build dynamic SET clause for student updates
        const studentUpdates = [];
        const studentValues = [];
        let paramCount = 1;
        
        if (studentNumber) {
          studentUpdates.push(`student_number = $${paramCount}`);
          studentValues.push(studentNumber);
          paramCount++;
        }
        
        if (yearOfStudy) {
          studentUpdates.push(`year = $${paramCount}`);
          studentValues.push(yearOfStudy);
          paramCount++;
        }
        
        if (email) {
          studentUpdates.push(`university_email = $${paramCount}`);
          studentValues.push(email);
          paramCount++;
        }
        
        if (status) {
          studentUpdates.push(`status = $${paramCount}`);
          studentValues.push(status);
          paramCount++;
        }
        
        if (studentUpdates.length > 0) {
          const studentQuery = `
            UPDATE ${schema_prefix}.students
            SET ${studentUpdates.join(', ')}
            WHERE user_id = $${paramCount}
            RETURNING user_id
          `;
          
          studentValues.push(id);
          const studentResult = await client.query(studentQuery, studentValues);
          
          if (!studentResult.rowCount) {
            throw new Error('Student record not found');
          }
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Fetch updated student info to return
      const updatedStudentQuery = `
        SELECT 
          s.user_id as id, 
          up.first_name as "firstName",
          up.last_name as "lastName",
          s.student_number as "studentNumber",
          s.year as "yearOfStudy",
          s.university_email as "email",
          up.personal_email as "personalEmail",
          up.gender,
          up.date_of_birth as "dateOfBirth",
          s.status
        FROM ${schema_prefix}.students s
        JOIN ${schema_prefix}.user_profiles up ON s.user_id = up.user_id
        WHERE s.user_id = $1
      `;
      
      const result = await client.query(updatedStudentQuery, [id]);
      
      if (!result.rowCount) {
        return res.status(404).json({ message: 'Student not found after update' });
      }
      
      // Format date to UK format
      const student = {
        ...result.rows[0],
        dateOfBirth: result.rows[0].dateOfBirth ? new Date(result.rows[0].dateOfBirth).toLocaleDateString('en-GB') : null
      };
      
      return res.status(200).json({
        message: 'Student updated successfully',
        student
      });
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating student:', error);
    return res.status(500).json({ message: 'Failed to update student: ' + (error as Error).message });
  } finally {
    if (client) client.release();
  }
};

/**
 * Delete student
 */
export const deleteStudent = async (req: Request, res: Response) => {
  let client = null;
  
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Student ID is required' });
    }
    
    // Get user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Get admin's department
    const userResult = await centralPool.query(
      'SELECT email FROM central.users WHERE user_id = $1',
      [userId]
    );
    
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const adminEmail = userResult.rows[0].email;
    
    // Find department schema
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [adminEmail]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // 1. Delete enrollments for the student if any
      await client.query(`DELETE FROM ${schema_prefix}.enrollments WHERE student_id = $1`, [id]);
      
      // 2. Delete student record
      const deleteStudentQuery = `DELETE FROM ${schema_prefix}.students WHERE user_id = $1 RETURNING user_id`;
      const studentResult = await client.query(deleteStudentQuery, [id]);
      
      if (!studentResult.rowCount) {
        throw new Error('Student record not found');
      }
      
      // 3. Delete user profile
      const deleteProfileQuery = `DELETE FROM ${schema_prefix}.user_profiles WHERE user_id = $1 RETURNING user_id`;
      const profileResult = await client.query(deleteProfileQuery, [id]);
      
      if (!profileResult.rowCount) {
        throw new Error('User profile not found');
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      return res.status(200).json({
        message: 'Student deleted successfully',
        id
      });
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    return res.status(500).json({ message: 'Failed to delete student: ' + (error as Error).message });
  } finally {
    if (client) client.release();
  }
};

/**
 * Assign student to a program
 */
export const assignStudentToProgram = async (req: Request, res: Response) => {
  let client = null;
  
  try {
    const { studentId, programId } = req.body;
    
    if (!studentId || !programId) {
      return res.status(400).json({ message: 'Student ID and Program ID are required' });
    }
    
    // Get user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Get admin's department
    const userResult = await centralPool.query(
      'SELECT email FROM central.users WHERE user_id = $1',
      [userId]
    );
    
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const adminEmail = userResult.rows[0].email;
    
    // Find department schema
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [adminEmail]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Check if student exists
    const studentQuery = `
      SELECT user_id FROM ${schema_prefix}.students WHERE user_id = $1
    `;
    const studentResult = await client.query(studentQuery, [studentId]);
    
    if (!studentResult.rowCount) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if program exists
    const programQuery = `
      SELECT program_id FROM ${schema_prefix}.programs WHERE program_id = $1
    `;
    const programResult = await client.query(programQuery, [programId]);
    
    if (!programResult.rowCount) {
      return res.status(404).json({ message: 'Program not found' });
    }
    
    // Check if assignment already exists
    const existingQuery = `
      SELECT * FROM ${schema_prefix}.student_programs 
      WHERE student_id = $1 AND program_id = $2
    `;
    const existingResult = await client.query(existingQuery, [studentId, programId]);
    
    if ((existingResult.rowCount ?? 0) > 0) {
      return res.status(409).json({ message: 'Student is already assigned to this program' });
    }
    
    // Create assignment
    const assignQuery = `
      INSERT INTO ${schema_prefix}.student_programs(student_id, program_id, start_date)
      VALUES($1, $2, CURRENT_DATE)
      RETURNING *
    `;
    
    const result = await client.query(assignQuery, [studentId, programId]);
    
    return res.status(201).json({
      message: 'Student assigned to program successfully',
      assignment: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error assigning student to program:', error);
    return res.status(500).json({ message: 'Failed to assign student to program: ' + (error as Error).message });
  } finally {
    if (client) client.release();
  }
};

/**
 * Get students in a program
 */
export const getProgramStudents = async (req: Request, res: Response) => {
  let client = null;
  
  try {
    const { programId } = req.params;
    
    if (!programId) {
      return res.status(400).json({ message: 'Program ID is required' });
    }
    
    // Get user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Get admin's department
    const userResult = await centralPool.query(
      'SELECT email FROM central.users WHERE user_id = $1',
      [userId]
    );
    
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const adminEmail = userResult.rows[0].email;
    
    // Find department schema
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix, d.name AS department_name 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [adminEmail]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix, department_name } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Get program details
    const programQuery = `
      SELECT program_id, name, description FROM ${schema_prefix}.programs WHERE program_id = $1
    `;
    const programResult = await client.query(programQuery, [programId]);
    
    if (!programResult.rowCount) {
      return res.status(404).json({ message: 'Program not found' });
    }
    
    const program = programResult.rows[0];
    
    // Get students in the program
    const studentsQuery = `
      SELECT 
        s.user_id as id, 
        up.first_name as "firstName",
        up.last_name as "lastName",
        s.student_number as "studentNumber",
        s.year as "yearOfStudy",
        s.university_email as "email",
        up.personal_email as "personalEmail",
        up.gender,
        up.date_of_birth as "dateOfBirth",
        sp.start_date as "enrollmentDate",
        s.status
      FROM ${schema_prefix}.student_programs sp
      JOIN ${schema_prefix}.students s ON sp.student_id = s.user_id
      JOIN ${schema_prefix}.user_profiles up ON s.user_id = up.user_id
      WHERE sp.program_id = $1
      ORDER BY up.last_name, up.first_name
    `;
    
    const result = await client.query(studentsQuery, [programId]);
    
    // Format dates to UK format (DD/MM/YYYY)
    const students = result.rows.map(student => ({
      ...student,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-GB') : null,
      enrollmentDate: student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString('en-GB') : null
    }));
    
    return res.status(200).json({ 
      program,
      students,
      department: department_name
    });
    
  } catch (error) {
    console.error('Error fetching program students:', error);
    return res.status(500).json({ message: 'Failed to retrieve program students: ' + (error as Error).message });
  } finally {
    if (client) client.release();
  }
};

/**
 * Remove student from a program
 */
export const removeStudentFromProgram = async (req: Request, res: Response) => {
  let client = null;
  
  try {
    const { programId, studentId } = req.params;
    
    if (!programId || !studentId) {
      return res.status(400).json({ message: 'Program ID and Student ID are required' });
    }
    
    // Get user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Get admin's department
    const userResult = await centralPool.query(
      'SELECT email FROM central.users WHERE user_id = $1',
      [userId]
    );
    
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const adminEmail = userResult.rows[0].email;
    
    // Find department schema
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [adminEmail]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Remove assignment
    const deleteQuery = `
      DELETE FROM ${schema_prefix}.student_programs
      WHERE program_id = $1 AND student_id = $2
      RETURNING *
    `;
    
    const result = await client.query(deleteQuery, [programId, studentId]);
    
    if (!result.rowCount) {
      return res.status(404).json({ message: 'Student is not assigned to this program' });
    }
    
    return res.status(200).json({
      message: 'Student removed from program successfully',
      programId,
      studentId
    });
    
  } catch (error) {
    console.error('Error removing student from program:', error);
    return res.status(500).json({ message: 'Failed to remove student from program: ' + (error as Error).message });
  } finally {
    if (client) client.release();
  }
};
