import { Request, Response } from 'express';
import { pool, getDepartmentPool } from '../../db';
import { Client } from 'pg';

// Define the user type as expected from JWT token
interface AuthUser {
  userId: number;
  role: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * Get student modules from their home department
 */
export const getStudentModules = async (req: Request, res: Response) => {
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
    
    // Find student's department using email
    const mapResult = await pool.query(
      `SELECT uim.dept_id, uim.local_user_id, d.schema_prefix 
       FROM central.user_id_map uim
       JOIN central.departments d ON uim.dept_id = d.dept_id
       WHERE uim.university_email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Student not found in any department' });
    }
    
    const { local_user_id, schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection with proper error handling
    let deptPool;
    try {
      deptPool = await getDepartmentPool(schema_prefix);
      console.log(`Connected to ${schema_prefix} database successfully for modules`);
    } catch (error) {
      console.error(`Failed to connect to ${schema_prefix} database:`, error);
      return res.status(503).json({ message: `${schema_prefix} database unavailable` });
    }
    
    // First check if student exists and has enrollments in a program
    const programEnrollmentCheck = await deptPool.query(`
      SELECT COUNT(*) as count FROM ${schema_prefix}.student_programs WHERE student_id = $1
    `, [local_user_id]);
    console.log('Student program enrollments:', programEnrollmentCheck.rows[0].count);
    
    // Get all modules associated with the student's program(s)
    const modulesResult = await deptPool.query(`
      SELECT 
        m.module_id::text, -- Convert to text for frontend compatibility
        m.code as module_code,
        m.title,
        'UK-based module' as description, -- Add default description
        m.credits,
        CONCAT(EXTRACT(YEAR FROM s.start_date), '-', EXTRACT(YEAR FROM s.end_date)) as academic_year,
        'enrolled' as status, -- Default status for program modules
        'Not Graded' as grade, -- Default grade
        s.name as semester,
        stf.first_name || ' ' || stf.last_name as instructor
      FROM ${schema_prefix}.modules m
      -- Join to program_modules to get modules associated with the student's program
      JOIN ${schema_prefix}.program_modules pm ON m.module_id = pm.module_id
      -- Join to student_programs to filter for the current student
      JOIN ${schema_prefix}.student_programs sp ON pm.program_id = sp.program_id AND sp.student_id = $1
      -- Get semester data
      JOIN ${schema_prefix}.semesters s ON m.semester_id = s.semester_id
      -- Check if the student has any grades for this module (left join in case no grades yet)
      LEFT JOIN ${schema_prefix}.module_grades mg ON m.module_id = mg.module_id AND mg.student_id = $1
      -- Instructor data (assumed from first staff record for demo)
      LEFT JOIN LATERAL (
        SELECT up.first_name, up.last_name
        FROM ${schema_prefix}.module_staff ms
        JOIN ${schema_prefix}.staff st ON ms.staff_id = st.user_id
        JOIN ${schema_prefix}.user_profiles up ON st.user_id = up.user_id
        WHERE ms.module_id = m.module_id
        LIMIT 1
      ) stf ON TRUE
      ORDER BY s.start_date DESC
    `, [local_user_id]);
    
    // Also check for direct module enrollments for backward compatibility
    const directEnrollmentsResult = await deptPool.query(`
      SELECT COUNT(*) as count FROM ${schema_prefix}.enrollments WHERE student_id = $1
    `, [local_user_id]);
    console.log('Direct module enrollments:', directEnrollmentsResult.rows[0].count);
    
    console.log(`Found ${modulesResult.rows.length} modules for student in ${schema_prefix}`);
    
    // Get the moduleType query parameter (if provided)
    const moduleType = req.query.type as string || 'home';
    
    // If external modules are requested, fetch them
    if (moduleType === 'external') {
      const externalModules = await getExternalModulesForStudent(email, local_user_id, schema_prefix);
      return res.status(200).json({
        modules: externalModules,
        department: schema_prefix,
        moduleType: 'external'
      });
    }
    
    // Return home department modules with department information
    return res.status(200).json({
      modules: modulesResult.rows,
      department: schema_prefix,
      moduleType: 'home'
    });
  } catch (error) {
    console.error('Error fetching student modules:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Helper function to get external modules a student is enrolled in across departments
 */
async function getExternalModulesForStudent(
  email: string | undefined,
  homeStudentId: number,
  homeSchemaPrefix: string
): Promise<any[]> {
  // If email is undefined, return empty array
  if (!email) {
    console.error('Email is required to fetch external modules');
    return [];
  }
  try {
    // Find all departments where the student might have external enrollments
    const departmentsResult = await pool.query(
      `SELECT d.dept_id, d.schema_prefix, d.host, d.port, d.dbname
       FROM central.departments d
       WHERE d.schema_prefix != $1`,
      [homeSchemaPrefix]
    );
    
    if (departmentsResult.rows.length === 0) {
      return [];
    }
    
    // Array to collect all external modules
    let allExternalModules: any[] = [];
    
    // Check each department for possible external enrollments
    for (const dept of departmentsResult.rows) {
      try {
        // Get department-specific connection
        const deptPool = await getDepartmentPool(dept.schema_prefix);
        
        // First check if the student has a shadow record in this department
        const shadowCheckResult = await deptPool.query(
          `SELECT student_id FROM ${dept.schema_prefix}.student_shadow
           WHERE university_email = $1`,
          [email]
        );
        
        if (shadowCheckResult.rows.length === 0) {
          // No shadow record, no enrollments possible
          continue;
        }
        
        const shadowStudentId = shadowCheckResult.rows[0].student_id;
        
        // Check for external enrollments
        const externalEnrollmentsResult = await deptPool.query(
          `SELECT 
             ee.id as enrollment_id,
             ee.module_id::text,
             ee.module_code,
             ee.module_title as title,
             'External module' as description,
             15 as credits,
             '2024-2025' as academic_year,
             ee.status,
             'Not Graded' as grade,
             'Current' as semester,
             NULL as instructor,
             ee.student_dept_code as source_department,
             $1 as external_department
           FROM ${dept.schema_prefix}.external_enrollments ee
           WHERE ee.student_id = $2 AND ee.is_active = true`,
          [dept.schema_prefix.replace('_schema', ''), shadowStudentId]
        );
        
        if (externalEnrollmentsResult.rows.length > 0) {
          // Add these modules to our collection
          allExternalModules = [...allExternalModules, ...externalEnrollmentsResult.rows];
        }
      } catch (error) {
        console.error(`Error checking department ${dept.schema_prefix} for external enrollments:`, error);
        // Continue with other departments even if one fails
      }
    }
    
    return allExternalModules;
  } catch (error) {
    console.error('Error fetching external modules:', error);
    return [];
  }
}
