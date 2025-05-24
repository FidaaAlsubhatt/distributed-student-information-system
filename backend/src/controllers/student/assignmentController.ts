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
    
    // First, check if student is enrolled in any programs
    const programEnrollmentCheck = await deptPool.query(`
      SELECT COUNT(*) as count FROM ${schema_prefix}.student_programs WHERE student_id = $1
    `, [local_user_id]);
    console.log('Student program enrollments (assignments):', programEnrollmentCheck.rows[0].count);
    
    // Get assignments for modules linked to the student's program(s)
    const assignmentsResult = await deptPool.query(`
      SELECT 
        a.assignment_id::text as id,
        a.title,
        a.description,
        a.instructions,
        a.total_marks as totalmarks,
        a.weight,
        a.created_at as createdat,
        m.title as module,
        m.code as modulecode,
        a.due_date as duedate,
        CASE
          -- First handle submitted and graded statuses with higher priority
          WHEN s.submission_id IS NOT NULL AND ag.grade IS NOT NULL THEN 
            CASE 
              WHEN (
                SELECT COUNT(*) 
                FROM ${schema_prefix}.submissions sub
                JOIN ${schema_prefix}.assignment_grades ag_inner ON sub.submission_id = ag_inner.submission_id
                WHERE sub.assignment_id = a.assignment_id AND ag_inner.grade IS NOT NULL
              ) = (
                SELECT COUNT(*) 
                FROM ${schema_prefix}.student_programs 
                WHERE student_id = $1
              ) THEN 'fully_graded'
              ELSE 'partially_graded'
            END
          WHEN s.submission_id IS NOT NULL THEN 'submitted'
          
          -- Then handle time-based statuses for assignments not yet submitted
          WHEN a.due_date < NOW() THEN 'overdue'
          WHEN DATE(a.due_date) = CURRENT_DATE THEN 'due_today'
          WHEN a.due_date <= NOW() + INTERVAL '7 days' THEN 'due_soon'
          ELSE 'upcoming'
        END as status,
        ag.grade::text as grade,
        ag.feedback,
        s.submitted_at as submittedat,
        s.file_path as filepath,
        -- Include extra fields for debugging
        s.submission_id::text as submission_id,
        ag.grade_id::text as grade_id,
        ag.staff_id::text as staff_id,
        ag.revision_number::text as revision_number,
        ag.graded_at as gradedat
      FROM ${schema_prefix}.assignments a
      JOIN ${schema_prefix}.modules m ON a.module_id = m.module_id
      -- Link to program modules and student programs instead of direct enrollments
      JOIN ${schema_prefix}.program_modules pm ON m.module_id = pm.module_id
      JOIN ${schema_prefix}.student_programs sp ON pm.program_id = sp.program_id AND sp.student_id = $1
      -- Get any submissions for this student and assignment
      LEFT JOIN ${schema_prefix}.submissions s ON a.assignment_id = s.assignment_id AND s.student_id = $1
      LEFT JOIN ${schema_prefix}.assignment_grades ag ON s.submission_id = ag.submission_id
      ORDER BY a.due_date DESC
    `, [local_user_id]);
    
    console.log(`Found ${assignmentsResult.rows.length} assignments for student through program enrollment`);
    
    // Also check for any direct module enrollments (for backward compatibility)
    const directEnrollmentsResult = await deptPool.query(`
      SELECT COUNT(*) as count FROM ${schema_prefix}.enrollments WHERE student_id = $1
    `, [local_user_id]);
    console.log('Direct module enrollments (assignments):', directEnrollmentsResult.rows[0].count);
    
    return res.status(200).json(assignmentsResult.rows);
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
