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
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // Get modules with UK terminology - match the actual database schema
    const modulesResult = await deptPool.query(`
      SELECT 
        m.module_id::text, -- Convert to text for frontend compatibility
        m.code as module_code,
        m.title,
        'UK-based module' as description, -- Add default description
        15 as credits, -- Default UK module credits
        CONCAT(EXTRACT(YEAR FROM s.start_date), '-', EXTRACT(YEAR FROM s.end_date)) as academic_year,
        e.status,
        CASE 
          WHEN mg.grade IS NOT NULL THEN mg.grade::text
          ELSE 'Not Graded' 
        END as grade,
        s.name as semester,
        stf.first_name || ' ' || stf.last_name as instructor
      FROM ${schema_prefix}.modules m
      JOIN ${schema_prefix}.enrollments e ON m.module_id = e.module_id
      JOIN ${schema_prefix}.semesters s ON m.semester_id = s.semester_id
      LEFT JOIN ${schema_prefix}.module_grades mg ON m.module_id = mg.module_id AND e.student_id = mg.student_id
      -- Instructor data (assumed from first staff record for demo, would normally use a specific relation)
      LEFT JOIN LATERAL (
        SELECT up.first_name, up.last_name
        FROM ${schema_prefix}.staff st
        JOIN ${schema_prefix}.user_profiles up ON st.user_id = up.user_id
        LIMIT 1
      ) stf ON TRUE
      WHERE e.student_id = $1
      ORDER BY s.start_date DESC
    `, [local_user_id]);
    
    return res.status(200).json(modulesResult.rows);
  } catch (error) {
    console.error('Error fetching student modules:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
