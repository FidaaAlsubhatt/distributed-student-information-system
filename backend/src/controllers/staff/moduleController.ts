import { Request, Response } from 'express';
import { pool, getDepartmentPool } from '../../db';

// Define the user type as expected from JWT token
interface AuthUser {
  userId: number;
  role: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export const getAcademicModules = async (req: Request, res: Response) => {
  try {
    // Cast req.user to our interface
    const user = req.user as AuthUser;
    
    // Try to get email from JWT payload or query param
    let email = user?.email;
    
    // If not available in token, try to get user from database
    if (!email) {
      // Get user details from DB using userId 
      const userResult = await pool.query(
        'SELECT email FROM central.users WHERE user_id = $1',
        [user?.userId]
      );
      
      if (userResult.rows.length > 0) {
        email = userResult.rows[0].email;
      } else {
        return res.status(400).json({ message: 'User email not available' });
      }
    }
    
    // Find staff member's department using email
    const mapResult = await pool.query(
      `SELECT uim.dept_id, uim.local_user_id, d.schema_prefix 
       FROM central.user_id_map uim
       JOIN central.departments d ON uim.dept_id = d.dept_id
       WHERE uim.university_email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Staff member not found in any department' });
    }
    
    const { local_user_id, schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection with proper error handling
    let deptPool;
    try {
      deptPool = await getDepartmentPool(schema_prefix);
      console.log(`Connected to ${schema_prefix} database successfully for staff modules`);
    } catch (error) {
      console.error(`Failed to connect to ${schema_prefix} database:`, error);
      return res.status(503).json({ message: `${schema_prefix} database unavailable` });
    }
    
    // Now we have a module_staff relationship table, so we'll use it to get modules for this staff member
    const modulesResult = await deptPool.query(`
      SELECT 
        m.module_id::text, 
        m.code,
        m.title,
        COALESCE(m.description, 'Module description not available') as description,
        COALESCE(m.credits, 15) as credits,
        s.name as semester,
        CONCAT(EXTRACT(YEAR FROM s.start_date), '-', EXTRACT(YEAR FROM s.end_date)) as academic_year,
        m.is_active,
        CASE 
          WHEN m.is_active = true THEN 'active'
          ELSE 'inactive'
        END as status,
        st.title || ' ' || up.first_name || ' ' || up.last_name as instructor,
        COUNT(e.enrollment_id) as enrolled_students,
        m.capacity,
        ms.role
      FROM ${schema_prefix}.modules m
      JOIN ${schema_prefix}.semesters s ON m.semester_id = s.semester_id
      LEFT JOIN ${schema_prefix}.enrollments e ON m.module_id = e.module_id
      JOIN ${schema_prefix}.module_staff ms ON m.module_id = ms.module_id
      JOIN ${schema_prefix}.staff st ON ms.staff_id = st.user_id
      JOIN ${schema_prefix}.user_profiles up ON st.user_id = up.user_id
      WHERE ms.staff_id = $1
      GROUP BY m.module_id, m.code, m.title, s.name, s.start_date, s.end_date, m.is_active, st.title, up.first_name, up.last_name, m.capacity, ms.role
      ORDER BY s.start_date DESC
    `, [local_user_id]);
    
    console.log(`Found ${modulesResult.rows.length} modules for staff member in ${schema_prefix}`);
    
    // Return modules with department information
    return res.status(200).json({
      modules: modulesResult.rows,
      department: schema_prefix
    });
  } catch (error) {
    console.error('Error fetching academic staff modules:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getModuleStudents = async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const user = req.user as AuthUser;
    
    // Get email from JWT or database
    let email = user?.email;
    if (!email) {
      const userResult = await pool.query(
        'SELECT email FROM central.users WHERE user_id = $1',
        [user?.userId]
      );
      
      if (userResult.rows.length > 0) {
        email = userResult.rows[0].email;
      } else {
        return res.status(400).json({ message: 'User email not available' });
      }
    }
    
    // Find staff member's department
    const mapResult = await pool.query(
      `SELECT uim.dept_id, uim.local_user_id, d.schema_prefix 
       FROM central.user_id_map uim
       JOIN central.departments d ON uim.dept_id = d.dept_id
       WHERE uim.university_email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Staff member not found in any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // Get students enrolled in this module
    const studentsResult = await deptPool.query(`
      SELECT 
        s.user_id::text as student_id,
        s.student_number,
        up.first_name,
        up.last_name,
        e.status as enrollment_status,
        CASE 
          WHEN mg.grade IS NOT NULL THEN mg.grade::text
          ELSE 'Not Graded' 
        END as grade
      FROM ${schema_prefix}.students s
      JOIN ${schema_prefix}.user_profiles up ON s.user_id = up.user_id
      JOIN ${schema_prefix}.enrollments e ON s.user_id = e.student_id
      LEFT JOIN ${schema_prefix}.module_grades mg ON e.module_id = mg.module_id AND e.student_id = mg.student_id
      WHERE e.module_id = $1
      ORDER BY up.last_name, up.first_name
    `, [moduleId]);
    
    return res.status(200).json({
      students: studentsResult.rows,
      department: schema_prefix
    });
  } catch (error) {
    console.error('Error fetching module students:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createModule = async (req: Request, res: Response) => {
  try {
    const { code, name, credits, description, semester, prerequisites } = req.body;
    
    // Validate inputs
    if (!code || !name || !credits || !description || !semester) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Cast req.user to our interface
    const user = req.user as AuthUser;
    
    // Try to get email from JWT payload
    let email = user?.email;
    
    // If not available in token, try to get user from database
    if (!email) {
      // Get user details from DB using userId 
      const userResult = await pool.query(
        'SELECT email FROM central.users WHERE user_id = $1',
        [user?.userId]
      );
      
      if (userResult.rows.length > 0) {
        email = userResult.rows[0].email;
      } else {
        return res.status(400).json({ message: 'User email not available' });
      }
    }
    
    // Find staff member's department using email
    const mapResult = await pool.query(
      `SELECT uim.dept_id, uim.local_user_id, d.schema_prefix 
       FROM central.user_id_map uim
       JOIN central.departments d ON uim.dept_id = d.dept_id
       WHERE uim.university_email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Staff member not found in any department' });
    }
    
    const { local_user_id, schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // Get the semester_id from the semester name
    const semesterResult = await deptPool.query(
      `SELECT semester_id FROM ${schema_prefix}.semesters WHERE name = $1`,
      [semester]
    );
    
    if (semesterResult.rowCount === 0) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    const semester_id = semesterResult.rows[0].semester_id;
    
    // Create the module in the database
    const moduleResult = await deptPool.query(
      `INSERT INTO ${schema_prefix}.modules (code, title, semester_id, capacity, is_active, description, credits)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [code, name, semester_id, parseInt(credits) * 8, true, description, parseInt(credits)] // Capacity is set to credits * 8 as a simple formula
    );
    
    if (moduleResult.rowCount === 0) {
      return res.status(500).json({ message: 'Failed to create module' });
    }
    
    const module = moduleResult.rows[0];
    
    // Associate the module with the staff member who created it
    await deptPool.query(
      `INSERT INTO ${schema_prefix}.module_staff (module_id, staff_id, role)
       VALUES ($1, $2, $3)`,
      [module.module_id, local_user_id, 'lecturer']
    );
    
    return res.status(201).json({
      message: 'Module created successfully',
      module: module
    });
    
  } catch (error) {
    console.error('Error creating module:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateModule = async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { code, name, credits, description, semester, is_active } = req.body;
    
    // Validate inputs
    if (!moduleId || !code || !name || !credits || !description || !semester) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Cast req.user to our interface
    const user = req.user as AuthUser;
    
    // Try to get email from JWT payload
    let email = user?.email;
    
    // If not available in token, try to get user from database
    if (!email) {
      // Get user details from DB using userId 
      const userResult = await pool.query(
        'SELECT email FROM central.users WHERE user_id = $1',
        [user?.userId]
      );
      
      if (userResult.rows.length > 0) {
        email = userResult.rows[0].email;
      } else {
        return res.status(400).json({ message: 'User email not available' });
      }
    }
    
    // Find staff member's department using email
    const mapResult = await pool.query(
      `SELECT uim.dept_id, uim.local_user_id, d.schema_prefix 
       FROM central.user_id_map uim
       JOIN central.departments d ON uim.dept_id = d.dept_id
       WHERE uim.university_email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Staff member not found in any department' });
    }
    
    const { local_user_id, schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // Verify that the staff member is associated with this module
    const staffModuleCheck = await deptPool.query(
      `SELECT ms.id FROM ${schema_prefix}.module_staff ms
       WHERE ms.module_id = $1 AND ms.staff_id = $2`,
      [moduleId, local_user_id]
    );
    
    if (staffModuleCheck.rowCount === 0) {
      return res.status(403).json({ message: 'You are not authorized to update this module' });
    }
    
    // Get the semester_id from the semester name
    const semesterResult = await deptPool.query(
      `SELECT semester_id FROM ${schema_prefix}.semesters WHERE name = $1`,
      [semester]
    );
    
    if (semesterResult.rowCount === 0) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    const semester_id = semesterResult.rows[0].semester_id;
    
    // Update the module in the database
    const moduleResult = await deptPool.query(
      `UPDATE ${schema_prefix}.modules
       SET code = $1, title = $2, semester_id = $3, capacity = $4, is_active = $5, description = $6, credits = $7
       WHERE module_id = $8
       RETURNING *`,
      [code, name, semester_id, parseInt(credits) * 8, is_active !== undefined ? is_active : true, description, parseInt(credits), moduleId]
    );
    
    if (moduleResult.rowCount === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    return res.status(200).json({
      message: 'Module updated successfully',
      module: moduleResult.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating module:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteModule = async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    
    if (!moduleId) {
      return res.status(400).json({ message: 'Module ID is required' });
    }
    
    // Cast req.user to our interface
    const user = req.user as AuthUser;
    
    // Try to get email from JWT payload
    let email = user?.email;
    
    // If not available in token, try to get user from database
    if (!email) {
      // Get user details from DB using userId 
      const userResult = await pool.query(
        'SELECT email FROM central.users WHERE user_id = $1',
        [user?.userId]
      );
      
      if (userResult.rows.length > 0) {
        email = userResult.rows[0].email;
      } else {
        return res.status(400).json({ message: 'User email not available' });
      }
    }
    
    // Find staff member's department using email
    const mapResult = await pool.query(
      `SELECT uim.dept_id, uim.local_user_id, d.schema_prefix 
       FROM central.user_id_map uim
       JOIN central.departments d ON uim.dept_id = d.dept_id
       WHERE uim.university_email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Staff member not found in any department' });
    }
    
    const { local_user_id, schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // Verify that the staff member is associated with this module
    const staffModuleCheck = await deptPool.query(
      `SELECT ms.id FROM ${schema_prefix}.module_staff ms
       WHERE ms.module_id = $1 AND ms.staff_id = $2`,
      [moduleId, local_user_id]
    );
    
    if (staffModuleCheck.rowCount === 0) {
      return res.status(403).json({ message: 'You are not authorized to delete this module' });
    }
    
    // Check if there are any enrollments for this module
    const enrollmentCheck = await deptPool.query(
      `SELECT COUNT(*) FROM ${schema_prefix}.enrollments WHERE module_id = $1`,
      [moduleId]
    );
    
    if (parseInt(enrollmentCheck.rows[0].count) > 0) {
      // Instead of deleting, just mark as inactive
      const inactiveResult = await deptPool.query(
        `UPDATE ${schema_prefix}.modules SET is_active = false WHERE module_id = $1 RETURNING *`,
        [moduleId]
      );
      
      if (inactiveResult.rowCount === 0) {
        return res.status(404).json({ message: 'Module not found' });
      }
      
      return res.status(200).json({
        message: 'Module marked as inactive due to existing enrollments',
        module: inactiveResult.rows[0]
      });
    }
    
    // If no enrollments, delete the module and its associations
    await deptPool.query(
      `DELETE FROM ${schema_prefix}.module_staff WHERE module_id = $1`,
      [moduleId]
    );
    
    const deleteResult = await deptPool.query(
      `DELETE FROM ${schema_prefix}.modules WHERE module_id = $1 RETURNING *`,
      [moduleId]
    );
    
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    return res.status(200).json({
      message: 'Module deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting module:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateStudentGrade = async (req: Request, res: Response) => {
  try {
    const { moduleId, studentId, assignmentId } = req.params;
    const { grade } = req.body;
    const user = req.user as AuthUser;
    
    // Get email from JWT or database
    let email = user?.email;
    if (!email) {
      const userResult = await pool.query(
        'SELECT email FROM central.users WHERE user_id = $1',
        [user?.userId]
      );
      
      if (userResult.rows.length > 0) {
        email = userResult.rows[0].email;
      } else {
        return res.status(400).json({ message: 'User email not available' });
      }
    }
    
    // Find staff member's department
    const mapResult = await pool.query(
      `SELECT uim.dept_id, uim.local_user_id, d.schema_prefix 
       FROM central.user_id_map uim
       JOIN central.departments d ON uim.dept_id = d.dept_id
       WHERE uim.university_email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Staff member not found in any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // First check if the submission exists
    const submissionCheck = await deptPool.query(`
      SELECT submission_id FROM ${schema_prefix}.submissions
      WHERE assignment_id = $1 AND student_id = $2
    `, [assignmentId, studentId]);
    
    if (submissionCheck.rowCount === 0) {
      // Create a submission if it doesn't exist
      await deptPool.query(`
        INSERT INTO ${schema_prefix}.submissions (assignment_id, student_id, grade, feedback, submitted_at)
        VALUES ($1, $2, $3, 'Graded by instructor', NOW())
      `, [assignmentId, studentId, grade]);
    } else {
      // Update the existing submission
      await deptPool.query(`
        UPDATE ${schema_prefix}.submissions
        SET grade = $3, feedback = CONCAT(feedback, '\nUpdated on ', NOW()::text)
        WHERE assignment_id = $1 AND student_id = $2
      `, [assignmentId, studentId, grade]);
    }
    
    return res.status(200).json({
      message: 'Grade updated successfully'
    });
  } catch (error) {
    console.error('Error updating student grade:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
