import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { pool, getDepartmentPool } from '../../db';

// Add a new student
export const addStudent = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      personalEmail,
      personalPhone,
      address,
      studentNumber,
      universityEmail,
      phoneNumber,
      yearOfStudy,
      password,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !gender || !address || 
        !studentNumber || !universityEmail || !yearOfStudy || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate address fields
    if (!address.line1 || !address.city || !address.state || !address.postalCode || !address.country) {
      return res.status(400).json({ message: 'Missing required address fields' });
    }

    // Get department ID and schema from the request body
    const { departmentId, departmentCode } = req.body;
    
    if (!departmentId || !departmentCode) {
      return res.status(400).json({ message: 'Department ID and department code are required' });
    }
    
    // In a production environment, we would validate that the user has permission to add to this department
    // by checking the JWT token claims against the provided departmentId
    // For now, we'll trust the frontend validation
    
    // Get the department-specific pool
    const deptPool = await getDepartmentPool(departmentCode);

    // Check if student number already exists in department
    const existingStudent = await deptPool.query(
      `SELECT * FROM students WHERE student_number = $1`,
      [studentNumber]
    );

    if (existingStudent.rows.length > 0) {
      return res.status(409).json({ message: 'Student number already exists' });
    }

    // Check if university email already exists
    const existingEmail = await deptPool.query(
      `SELECT * FROM students WHERE university_email = $1`,
      [universityEmail]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ message: 'University email already exists' });
    }

    // Generate UUID for the new user
    const userId = uuidv4();

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Start a transaction in the department database
    const deptClient = await deptPool.connect();
    try {
      await deptClient.query('BEGIN');

      // Insert address
      const addressResult = await deptClient.query(
        `INSERT INTO addresses 
         (address_id, line1, line2, city, state, postal_code, country, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
         RETURNING address_id`,
        [
          uuidv4(),
          address.line1,
          address.line2 || null,
          address.city,
          address.state,
          address.postalCode,
          address.country,
        ]
      );

      const addressId = addressResult.rows[0].address_id;

      // Insert user profile
      await deptClient.query(
        `INSERT INTO user_profiles 
         (user_id, first_name, last_name, date_of_birth, gender, personal_email, personal_phone, address_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          firstName,
          lastName,
          dateOfBirth,
          gender,
          personalEmail || null,
          personalPhone || null,
          addressId,
        ]
      );

      // Insert student record
      await deptClient.query(
        `INSERT INTO students 
         (student_id, user_id, student_number, university_email, phone_number, year_of_study, enrolment_date, status) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
        [
          uuidv4(),
          userId,
          studentNumber,
          universityEmail,
          phoneNumber || null,
          yearOfStudy,
          'enrolled',
        ]
      );

      // Insert into outbox for central DB provisioning
      await deptClient.query(
        `INSERT INTO outbox 
         (event_id, event_type, payload, created_at) 
         VALUES ($1, $2, $3, NOW())`,
        [
          uuidv4(),
          'student_created',
          JSON.stringify({
            userId,
            email: universityEmail,
            passwordHash,
            firstName,
            lastName,
            departmentId,
            role: 'student',
          }),
        ]
      );

      await deptClient.query('COMMIT');

      // Return success response
      return res.status(201).json({
        userId,
        studentNumber,
        firstName,
        lastName,
        universityEmail,
        message: 'Student added successfully',
      });
    } catch (error) {
      await deptClient.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      deptClient.release();
    }
  } catch (error) {
    console.error('Add student error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all students in a department
export const getStudents = async (req: Request, res: Response) => {
  try {
    // Get department code from header (e.g., 'cs', 'math')
    const departmentCode = req.headers['x-schema-prefix'] as string || 'dept1'; // TODO: Consider renaming header to x-department-code
    
    const deptPool = await getDepartmentPool(departmentCode);
    
    // Get all students with their profiles
    const studentsResult = await deptPool.query(`
      SELECT s.student_id, s.student_number, s.university_email, s.phone_number, 
             s.year_of_study, s.enrolment_date, s.status,
             p.first_name, p.last_name, p.date_of_birth, p.gender
      FROM students s
      JOIN user_profiles p ON s.user_id = p.user_id
      ORDER BY s.enrolment_date DESC
    `);

    return res.status(200).json(studentsResult.rows);
  } catch (error) {
    console.error('Get students error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
