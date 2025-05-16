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

export const getAssignments = async (req: Request, res: Response) => {
  try {
    // Cast req.user to our interface
    const user = req.user as AuthUser;
    
    // Check if user is available
    if (!user || !user.userId) {
      console.error('No user found in request');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Try to get email from JWT payload or query param
    let email = user.email;
    
    // If not available in token, try to get user from database
    if (!email) {
      try {
        const userResult = await pool.query(
          'SELECT email FROM central.users WHERE user_id = $1',
          [user.userId]
        );
        
        if (userResult.rows.length > 0) {
          email = userResult.rows[0].email;
        } else {
          console.error(`User with ID ${user.userId} not found in central.users`);
          return res.status(400).json({ message: 'User email not available' });
        }
      } catch (dbError) {
        console.error('Error querying central.users:', dbError);
        return res.status(500).json({ message: 'Database error while retrieving user' });
      }
    }
    
    console.log(`Fetching assignments for user email: ${email}`);
    
    // Find staff member's department using email
    let mapResult;
    try {
      mapResult = await pool.query(
        `SELECT uim.dept_id, uim.local_user_id, d.schema_prefix 
         FROM central.user_id_map uim
         JOIN central.departments d ON uim.dept_id = d.dept_id
         WHERE uim.university_email = $1`,
        [email]
      );
      
      if (!mapResult.rowCount) {
        console.error(`Staff member with email ${email} not found in any department`);
        return res.status(404).json({ message: 'Staff member not found in any department' });
      }
    } catch (dbError) {
      console.error('Error querying department mapping:', dbError);
      return res.status(500).json({ message: 'Database error while retrieving department mapping' });
    }
    
    const { local_user_id, schema_prefix } = mapResult.rows[0];
    console.log(`Staff identified: local_id=${local_user_id}, dept=${schema_prefix}`);
    
    // Get department-specific database connection with proper error handling
    let deptPool;
    try {
      deptPool = await getDepartmentPool(schema_prefix);
      console.log(`Connected to ${schema_prefix} database successfully for staff assignments`);
    } catch (error) {
      console.error(`Failed to connect to ${schema_prefix} database:`, error);
      return res.status(503).json({ message: `${schema_prefix} database unavailable` });
    }
    
    // First, check if the staff_id exists in the module_staff table
    try {
      const staffCheck = await deptPool.query(
        `SELECT COUNT(*) FROM ${schema_prefix}.module_staff WHERE staff_id = $1`,
        [local_user_id]
      );
      
      if (parseInt(staffCheck.rows[0].count) === 0) {
        console.log(`Staff ID ${local_user_id} not found in ${schema_prefix}.module_staff table`);
        // Return empty assignments instead of error
        return res.status(200).json({
          assignments: [],
          department: schema_prefix
        });
      }
    } catch (dbError) {
      console.error(`Error checking staff existence in ${schema_prefix}.module_staff:`, dbError);
      return res.status(500).json({ message: 'Error verifying staff record' });
    }
    
    // Get assignments for modules taught by this staff member
    try {
      // Simplified query to reduce complexity and potential errors
      const assignmentsResult = await deptPool.query(`
        SELECT 
          a.assignment_id::text,
          a.title,
          a.description,
          a.instructions,
          a.due_date,
          a.total_marks,
          a.weight,
          a.created_at,
          m.module_id::text,
          m.code as module_code,
          m.title as module_title,
          s.name as semester,
          CONCAT(EXTRACT(YEAR FROM s.start_date), '-', EXTRACT(YEAR FROM s.end_date)) as academic_year,
          COALESCE((            
            SELECT COUNT(*) 
            FROM ${schema_prefix}.submissions sub 
            WHERE sub.assignment_id = a.assignment_id
          ), 0) as submission_count,
          COALESCE((            
            SELECT COUNT(*) 
            FROM ${schema_prefix}.enrollments e 
            WHERE e.module_id = m.module_id
          ), 0) as enrolled_students,
          CASE
            -- First handle graded submissions with higher priority
            WHEN (
              SELECT COUNT(DISTINCT sub.student_id) 
              FROM ${schema_prefix}.submissions sub 
              JOIN ${schema_prefix}.assignment_grades ag ON sub.submission_id = ag.submission_id
              WHERE sub.assignment_id = a.assignment_id
            ) = (
              SELECT COUNT(*) 
              FROM ${schema_prefix}.enrollments e 
              WHERE e.module_id = m.module_id
            ) AND (
              SELECT COUNT(*) 
              FROM ${schema_prefix}.enrollments e 
              WHERE e.module_id = m.module_id
            ) > 0 THEN 'fully_graded'
            
            WHEN EXISTS (
              SELECT 1 
              FROM ${schema_prefix}.submissions sub 
              JOIN ${schema_prefix}.assignment_grades ag ON sub.submission_id = ag.submission_id
              WHERE sub.assignment_id = a.assignment_id
            ) THEN 'partially_graded'
            
            -- Then handle time-based statuses
            WHEN a.due_date < NOW() AND NOT EXISTS (
              SELECT 1 
              FROM ${schema_prefix}.submissions sub 
              WHERE sub.assignment_id = a.assignment_id
            ) THEN 'overdue'
            
            WHEN DATE(a.due_date) = CURRENT_DATE THEN 'due_today'
            
            WHEN a.due_date <= NOW() + INTERVAL '7 days' THEN 'due_soon'
            
            WHEN a.due_date > NOW() + INTERVAL '7 days' THEN 'upcoming'
            
            ELSE 'upcoming'
          END as status
        FROM ${schema_prefix}.assignments a
        JOIN ${schema_prefix}.modules m ON a.module_id = m.module_id
        JOIN ${schema_prefix}.semesters s ON m.semester_id = s.semester_id
        JOIN ${schema_prefix}.module_staff ms ON m.module_id = ms.module_id
        WHERE ms.staff_id = $1
        ORDER BY a.due_date DESC
      `, [local_user_id]);
      
      console.log(`Found ${assignmentsResult.rows.length} assignments for staff member in ${schema_prefix}`);
      
      // Return assignments with department information
      return res.status(200).json({
        assignments: assignmentsResult.rows,
        department: schema_prefix
      });
    } catch (dbError) {
      console.error(`Error executing assignments query in ${schema_prefix}:`, dbError);
      return res.status(500).json({ message: 'Error retrieving assignments data' });
    }
  } catch (error) {
    console.error('Error fetching staff assignments:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAssignmentSubmissions = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
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
    
    const { local_user_id, schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // First check if the staff member teaches the module this assignment belongs to
    const authCheck = await deptPool.query(`
      SELECT ms.module_id
      FROM ${schema_prefix}.assignments a
      JOIN ${schema_prefix}.modules m ON a.module_id = m.module_id
      JOIN ${schema_prefix}.module_staff ms ON m.module_id = ms.module_id
      WHERE a.assignment_id = $1 AND ms.staff_id = $2
    `, [assignmentId, local_user_id]);
    
    if (authCheck.rowCount === 0) {
      return res.status(403).json({ message: 'You are not authorized to view submissions for this assignment' });
    }
    
    // Get all submissions for this assignment with latest grades
    const submissionsResult = await deptPool.query(`
      WITH latest_grades AS (
        SELECT 
          ag.submission_id,
          ag.grade,
          ag.feedback,
          ag.graded_at,
          ag.staff_id,
          ROW_NUMBER() OVER (PARTITION BY sub.student_id ORDER BY ag.revision_number DESC) as rn
        FROM ${schema_prefix}.assignment_grades ag
        JOIN ${schema_prefix}.submissions sub ON ag.submission_id = sub.submission_id
        WHERE sub.assignment_id = $1
      )
      SELECT 
        s.submission_id::text,
        s.student_id::text,
        up.first_name || ' ' || up.last_name as student_name,
        s.submitted_at,
        lg.grade,
        lg.feedback,
        lg.graded_at,
        s.file_path,
        s.status as submission_status,
        CASE 
          WHEN lg.grade IS NOT NULL THEN 'graded'
          WHEN s.submitted_at > a.due_date THEN 'late'
          ELSE 'submitted'
        END as status,
        a.total_marks,
        a.title as assignment_title,
        m.code as module_code
      FROM ${schema_prefix}.submissions s
      JOIN ${schema_prefix}.assignments a ON s.assignment_id = a.assignment_id
      JOIN ${schema_prefix}.modules m ON a.module_id = m.module_id
      JOIN ${schema_prefix}.students st ON s.student_id = st.user_id
      JOIN ${schema_prefix}.user_profiles up ON st.user_id = up.user_id
      LEFT JOIN latest_grades lg ON s.submission_id = lg.submission_id AND lg.rn = 1
    `, [assignmentId]);
    
    // Get assignment details
    const assignmentResult = await deptPool.query(`
      SELECT 
        a.assignment_id::text,
        a.title,
        a.description,
        a.instructions,
        a.due_date,
        a.total_marks,
        a.weight,
        m.code as module_code,
        m.title as module_title
      FROM ${schema_prefix}.assignments a
      JOIN ${schema_prefix}.modules m ON a.module_id = m.module_id
      WHERE a.assignment_id = $1
    `, [assignmentId]);
    
    if (assignmentResult.rowCount === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Get students who haven't submitted
    const nonSubmittersResult = await deptPool.query(`
      SELECT 
        st.user_id::text as student_id,
        up.first_name || ' ' || up.last_name as student_name,
        NULL as submitted_at,
        NULL as grade,
        NULL as feedback,
        NULL as graded_at,
        NULL as file_path,
        'unsubmitted' as submission_status,
        'unsubmitted' as status,
        a.total_marks,
        a.title as assignment_title,
        m.code as module_code
      FROM ${schema_prefix}.enrollments e
      JOIN ${schema_prefix}.students st ON e.student_id = st.user_id
      JOIN ${schema_prefix}.user_profiles up ON st.user_id = up.user_id
      JOIN ${schema_prefix}.modules m ON e.module_id = m.module_id
      JOIN ${schema_prefix}.assignments a ON a.module_id = m.module_id
      WHERE a.assignment_id = $1
      AND NOT EXISTS (
        SELECT 1 FROM ${schema_prefix}.submissions s 
        WHERE s.assignment_id = a.assignment_id AND s.student_id = st.user_id
      )
    `, [assignmentId]);
    
    // Combine submitted and non-submitted students
    const allSubmissions = [
      ...submissionsResult.rows,
      ...nonSubmittersResult.rows
    ];
    
    return res.status(200).json({
      assignment: assignmentResult.rows[0],
      submissions: allSubmissions,
      department: schema_prefix
    });
  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { title, moduleId, dueDate, totalMarks, weight, description, instructions } = req.body;
    const user = req.user as AuthUser;
    
    // Validate required fields
    if (!title || !moduleId || !dueDate) {
      return res.status(400).json({ message: 'Required fields are missing: title, moduleId, dueDate' });
    }
    
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
    
    const { local_user_id, schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // Check if staff member is authorized to create assignments for this module
    const authCheck = await deptPool.query(`
      SELECT module_id FROM ${schema_prefix}.module_staff
      WHERE module_id = $1 AND staff_id = $2
    `, [moduleId, local_user_id]);
    
    if (authCheck.rowCount === 0) {
      return res.status(403).json({ message: 'You are not authorized to create assignments for this module' });
    }
    
    // Create the assignment
    const createResult = await deptPool.query(`
      INSERT INTO ${schema_prefix}.assignments (module_id, title, description, instructions, due_date, total_marks, weight, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [moduleId, title, description, instructions, dueDate, totalMarks, weight || 25.0]);
    
    // Get module details to include in response
    const moduleResult = await deptPool.query(`
      SELECT code, title FROM ${schema_prefix}.modules WHERE module_id = $1
    `, [moduleId]);
    
    const assignment = {
      ...createResult.rows[0],
      module_code: moduleResult.rows[0].code,
      module_title: moduleResult.rows[0].title
    };
    
    return res.status(201).json({
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { title, dueDate, totalMarks, weight, description, instructions } = req.body;
    const user = req.user as AuthUser;
    
    // Validate required fields
    if (!title || !dueDate) {
      return res.status(400).json({ message: 'Required fields are missing: title, dueDate' });
    }
    
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
    
    const { local_user_id, schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // Check if staff member is authorized to update this assignment
    const authCheck = await deptPool.query(`
      SELECT a.module_id
      FROM ${schema_prefix}.assignments a
      JOIN ${schema_prefix}.module_staff ms ON a.module_id = ms.module_id
      WHERE a.assignment_id = $1 AND ms.staff_id = $2
    `, [assignmentId, local_user_id]);
    
    if (authCheck.rowCount === 0) {
      return res.status(403).json({ message: 'You are not authorized to update this assignment' });
    }
    
    // Update the assignment
    const updateResult = await deptPool.query(`
      UPDATE ${schema_prefix}.assignments 
      SET title = $1, description = $2, instructions = $3, due_date = $4, total_marks = $5, weight = $6
      WHERE assignment_id = $7
      RETURNING *
    `, [title, description, instructions, dueDate, totalMarks, weight || 25.0, assignmentId]);
    
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Get module details to include in response
    const moduleResult = await deptPool.query(`
      SELECT m.code, m.title 
      FROM ${schema_prefix}.modules m
      JOIN ${schema_prefix}.assignments a ON m.module_id = a.module_id
      WHERE a.assignment_id = $1
    `, [assignmentId]);
    
    const assignment = {
      ...updateResult.rows[0],
      module_code: moduleResult.rows[0].code,
      module_title: moduleResult.rows[0].title
    };
    
    return res.status(200).json({
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
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
    
    const { local_user_id, schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // Check if staff member is authorized to delete this assignment
    const authCheck = await deptPool.query(`
      SELECT a.module_id
      FROM ${schema_prefix}.assignments a
      JOIN ${schema_prefix}.module_staff ms ON a.module_id = ms.module_id
      WHERE a.assignment_id = $1 AND ms.staff_id = $2
    `, [assignmentId, local_user_id]);
    
    if (authCheck.rowCount === 0) {
      return res.status(403).json({ message: 'You are not authorized to delete this assignment' });
    }
    
    // Check if there are any submissions for this assignment
    const submissionCheck = await deptPool.query(`
      SELECT COUNT(*) FROM ${schema_prefix}.submissions WHERE assignment_id = $1
    `, [assignmentId]);
    
    if (parseInt(submissionCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete assignment with existing submissions',
        hasSubmissions: true
      });
    }
    
    // Delete the assignment
    const deleteResult = await deptPool.query(`
      DELETE FROM ${schema_prefix}.assignments WHERE assignment_id = $1 RETURNING *
    `, [assignmentId]);
    
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    return res.status(200).json({
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateSubmissionGrade = async (req: Request, res: Response) => {
  try {
    const { assignmentId, studentId } = req.params;
    const { grade, feedback } = req.body;
    const user = req.user as AuthUser;
    
    // Validate required fields
    if (!grade) {
      return res.status(400).json({ message: 'Grade is required' });
    }
    
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
    
    const { local_user_id, schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // Check if staff member is authorized to grade this assignment
    const authCheck = await deptPool.query(`
      SELECT a.module_id
      FROM ${schema_prefix}.assignments a
      JOIN ${schema_prefix}.module_staff ms ON a.module_id = ms.module_id
      WHERE a.assignment_id = $1 AND ms.staff_id = $2
    `, [assignmentId, local_user_id]);
    
    if (authCheck.rowCount === 0) {
      return res.status(403).json({ message: 'You are not authorized to grade this assignment' });
    }
    
    // Check if the submission exists
    const submissionCheck = await deptPool.query(`
      SELECT submission_id FROM ${schema_prefix}.submissions
      WHERE assignment_id = $1 AND student_id = $2
    `, [assignmentId, studentId]);
    
    // Format the feedback
    const formattedFeedback = feedback || 'Graded by instructor';
    const currentDate = new Date().toISOString();
    const feedbackWithTimestamp = `${formattedFeedback}\nGraded on ${currentDate}`;
    
    if (submissionCheck.rowCount === 0) {
      // Create a submission if it doesn't exist (for cases where instructor grades without submission)
      await deptPool.query(`
        INSERT INTO ${schema_prefix}.submissions (assignment_id, student_id, submitted_at, status)
        VALUES ($1, $2, NOW(), 'unsubmitted')
      `, [assignmentId, studentId]);
      
      // Get the newly created submission ID
      const newSubmissionResult = await deptPool.query(`
        SELECT submission_id FROM ${schema_prefix}.submissions
        WHERE assignment_id = $1 AND student_id = $2
      `, [assignmentId, studentId]);
      
      const submissionId = newSubmissionResult.rows[0].submission_id;
      
      // Create a grade entry
      await deptPool.query(`
        INSERT INTO ${schema_prefix}.assignment_grades 
        (submission_id, staff_id, grade, feedback, graded_at, revision_number)
        VALUES ($1, $2, $3, $4, NOW(), 1)
      `, [submissionId, local_user_id, grade, feedbackWithTimestamp]);
    } else {
      const submissionId = submissionCheck.rows[0].submission_id;
      
      // Check if a grade already exists
      const gradeCheck = await deptPool.query(`
        SELECT grade_id, revision_number FROM ${schema_prefix}.assignment_grades
        WHERE submission_id = $1 ORDER BY revision_number DESC LIMIT 1
      `, [submissionId]);
      
      if (gradeCheck.rowCount === 0) {
        // First time grading
        await deptPool.query(`
          INSERT INTO ${schema_prefix}.assignment_grades 
          (submission_id, staff_id, grade, feedback, graded_at, revision_number)
          VALUES ($1, $2, $3, $4, NOW(), 1)
        `, [submissionId, local_user_id, grade, feedbackWithTimestamp]);
      } else {
        // Update existing grade with new revision
        const newRevisionNumber = gradeCheck.rows[0].revision_number + 1;
        await deptPool.query(`
          INSERT INTO ${schema_prefix}.assignment_grades 
          (submission_id, staff_id, grade, feedback, graded_at, revision_number)
          VALUES ($1, $2, $3, $4, NOW(), $5)
        `, [submissionId, local_user_id, grade, feedbackWithTimestamp, newRevisionNumber]);
      }
    }
    
    return res.status(200).json({
      message: 'Grade updated successfully'
    });
  } catch (error) {
    console.error('Error updating submission grade:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
