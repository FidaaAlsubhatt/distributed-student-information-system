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

export const getStudentAssignments = async (req: Request, res: Response) => {
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
    
    // Get assignments with UK terminology
    const assignmentsResult = await deptPool.query(`
      SELECT 
        a.assignment_id::text as id,
        a.title,
        m.title as module,
        m.code as moduleCode,
        a.due_date as dueDate,
        CASE 
          WHEN s.submission_id IS NULL THEN 'pending'
          WHEN s.grade IS NULL THEN 'submitted'
          ELSE 'graded'
        END as status,
        s.grade::text as grade,
        s.feedback,
        s.submitted_at as submittedAt,
        s.file_path as filePath
      FROM ${schema_prefix}.assignments a
      JOIN ${schema_prefix}.modules m ON a.module_id = m.module_id
      LEFT JOIN ${schema_prefix}.submissions s ON a.assignment_id = s.assignment_id AND s.student_id = $1
      ORDER BY a.due_date DESC
    `, [local_user_id]);
    
    return res.status(200).json(assignmentsResult.rows);
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
