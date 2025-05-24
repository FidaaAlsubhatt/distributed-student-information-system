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

/**
 * Get the class timetable for a student
 * Shows all scheduled classes for modules the student is enrolled in
 */
export const getStudentClassTimetable = async (req: Request, res: Response) => {
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
    // Get department-specific database connection
    let deptPool;
    try {
      deptPool = await getDepartmentPool(schema_prefix);
      console.log(`Connected to ${schema_prefix} database successfully`);
    } catch (error) {
      console.error(`Failed to connect to ${schema_prefix} database:`, error);
      return res.status(503).json({ message: `${schema_prefix} database unavailable` });
    }
    
    // First check if we have any timetable entries at all (for debugging)
    const timetableCheckResult = await deptPool.query(`
      SELECT COUNT(*) as count FROM ${schema_prefix}.timetables
    `);
    console.log('Total timetable entries:', timetableCheckResult.rows[0].count);
    
    // First check if student is enrolled in any programs
    const programEnrollmentCheck = await deptPool.query(`
      SELECT COUNT(*) as count FROM ${schema_prefix}.student_programs WHERE student_id = $1
    `, [local_user_id]);
    console.log('Student program enrollments (timetable):', programEnrollmentCheck.rows[0].count);
    
    // Simplified timetable query that focuses on getting module timetables for a student's program
    const timetableResult = await deptPool.query(`
      -- First get all modules the student is enrolled in through their program
      WITH student_modules AS (
        SELECT DISTINCT m.module_id
        FROM ${schema_prefix}.student_programs sp
        JOIN ${schema_prefix}.program_modules pm ON sp.program_id = pm.program_id
        JOIN ${schema_prefix}.modules m ON pm.module_id = m.module_id
        WHERE sp.student_id = $1
      )
      -- Then get all timetable entries for those modules
      SELECT 
        t.timetable_id as id,
        CASE 
          WHEN EXTRACT(DOW FROM t.event_date) = 1 THEN 'Monday'
          WHEN EXTRACT(DOW FROM t.event_date) = 2 THEN 'Tuesday'
          WHEN EXTRACT(DOW FROM t.event_date) = 3 THEN 'Wednesday'
          WHEN EXTRACT(DOW FROM t.event_date) = 4 THEN 'Thursday'
          WHEN EXTRACT(DOW FROM t.event_date) = 5 THEN 'Friday'
          WHEN EXTRACT(DOW FROM t.event_date) = 6 THEN 'Saturday'
          ELSE 'Sunday'
        END as day,
        TO_CHAR(t.event_date, 'HH24:MI') as startTime,
        TO_CHAR(t.event_date + INTERVAL '1 hour', 'HH24:MI') as endTime,
        l.name as room,
        l.building,
        t.type as sessionType,
        m.module_id as moduleId,
        m.code as moduleCode,
        m.title as moduleName,
        'TBD' as lecturer,
        'class' as type
      FROM ${schema_prefix}.timetables t
      JOIN student_modules sm ON t.module_id = sm.module_id
      JOIN ${schema_prefix}.modules m ON t.module_id = m.module_id
      LEFT JOIN ${schema_prefix}.locations l ON t.location_id = l.location_id
      ORDER BY t.event_date
    `, [local_user_id]);

    // Print the actual row count for debugging
    console.log(`Found ${timetableResult.rowCount} timetable entries for student ${local_user_id} in program`);
    
    // Also check for any direct module enrollments (for backward compatibility)
    const directEnrollmentsResult = await deptPool.query(`
      SELECT COUNT(*) as count FROM ${schema_prefix}.enrollments WHERE student_id = $1
    `, [local_user_id]);
    console.log('Direct module enrollments (timetable):', directEnrollmentsResult.rows[0].count);
    
    console.log('Timetable query returned rows:', timetableResult.rowCount);
    
    // Format timetable data for frontend
    const formattedTimetable = timetableResult.rows.map(session => ({
      id: session.id,
      day: session.day,
      startTime: session.starttime,
      endTime: session.endtime,
      room: session.room,
      building: session.building,
      moduleId: session.moduleid,
      moduleCode: session.modulecode,
      moduleName: session.modulename,
      sessionType: session.sessiontype || 'Lecture',
      lecturer: session.lecturer,
      type: session.type
    }));
    
    // Include department info in the response for frontend to display
    return res.status(200).json({ 
      classes: formattedTimetable,
      department: schema_prefix 
    });
  } catch (error) {
    console.error('Error fetching student class timetable:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get the exam timetable for a student
 * Shows all scheduled exams for modules the student is enrolled in
 */
export const getStudentExamTimetable = async (req: Request, res: Response) => {
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
    // Get department-specific database connection
    let deptPool;
    try {
      deptPool = await getDepartmentPool(schema_prefix);
      console.log(`Connected to ${schema_prefix} database successfully`);
    } catch (error) {
      console.error(`Failed to connect to ${schema_prefix} database:`, error);
      return res.status(503).json({ message: `${schema_prefix} database unavailable` });
    }
    
    // First check if student is enrolled in any programs
    const programEnrollmentCheck = await deptPool.query(`
      SELECT COUNT(*) as count FROM ${schema_prefix}.student_programs WHERE student_id = $1
    `, [local_user_id]);
    console.log('Student program enrollments (exams):', programEnrollmentCheck.rows[0].count);
    
    // First check if we have any exam entries (for debugging)
    const examCheckResult = await deptPool.query(`
      SELECT COUNT(*) as count FROM ${schema_prefix}.exams
    `);
    console.log('Total exam entries:', examCheckResult.rows[0].count);

    // Simplified exam query that focuses on getting exams for a student's program modules
    const examResult = await deptPool.query(`
      -- First get all modules the student is enrolled in through their program
      WITH student_modules AS (
        SELECT DISTINCT m.module_id
        FROM ${schema_prefix}.student_programs sp
        JOIN ${schema_prefix}.program_modules pm ON sp.program_id = pm.program_id
        JOIN ${schema_prefix}.modules m ON pm.module_id = m.module_id
        WHERE sp.student_id = $1
      )
      -- Then get all exam entries for those modules
      SELECT 
        e.exam_id as id,
        TO_CHAR(e.exam_date, 'DD/MM/YYYY') as date,
        CASE 
          WHEN EXTRACT(DOW FROM e.exam_date) = 1 THEN 'Monday'
          WHEN EXTRACT(DOW FROM e.exam_date) = 2 THEN 'Tuesday'
          WHEN EXTRACT(DOW FROM e.exam_date) = 3 THEN 'Wednesday'
          WHEN EXTRACT(DOW FROM e.exam_date) = 4 THEN 'Thursday'
          WHEN EXTRACT(DOW FROM e.exam_date) = 5 THEN 'Friday'
          WHEN EXTRACT(DOW FROM e.exam_date) = 6 THEN 'Saturday'
          ELSE 'Sunday'
        END as day,
        TO_CHAR(e.exam_date, 'HH24:MI') as startTime,
        TO_CHAR(e.exam_date + INTERVAL '2 hours', 'HH24:MI') as endTime,
        120 as duration,
        l.name as room,
        l.building,
        e.title as examTitle,
        m.module_id as moduleId,
        m.code as moduleCode,
        m.title as moduleName,
        'exam' as type
      FROM ${schema_prefix}.exams e
      JOIN student_modules sm ON e.module_id = sm.module_id
      JOIN ${schema_prefix}.modules m ON e.module_id = m.module_id
      LEFT JOIN ${schema_prefix}.locations l ON e.location_id = l.location_id
      ORDER BY e.exam_date
    `, [local_user_id]);
    
    // Print the actual row count for debugging
    console.log(`Found ${examResult.rowCount} exam entries for student ${local_user_id} in program`);
    
    // Also check for any direct module enrollments (for backward compatibility)
    const directEnrollmentsResult = await deptPool.query(`
      SELECT COUNT(*) as count FROM ${schema_prefix}.enrollments WHERE student_id = $1
    `, [local_user_id]);
    console.log('Direct module enrollments (exams):', directEnrollmentsResult.rows[0].count);
    
    // Debug the raw exam data from database
    console.log('Raw exam data from database:', examResult.rows[0]);
    
    // Format exam data for frontend with FULL information
    const formattedExams = examResult.rows.map(exam => ({
      id: exam.id,
      date: exam.date,
      day: exam.day, 
      startTime: exam.starttime,
      endTime: exam.endtime,
      duration: exam.duration || 120, // Default 2 hours if not specified
      room: exam.room,
      building: exam.building,
      examTitle: exam.examtitle, // Include the final exam title
      moduleId: exam.moduleid,
      moduleCode: exam.modulecode,
      moduleName: exam.modulename,
      type: 'exam' // Explicitly ensure this is marked as exam
    }));
    
    // Debug first formatted exam for verification
    if (formattedExams.length > 0) {
      console.log('First formatted exam:', formattedExams[0]);
    }
    
    // Include department info in the response for frontend to display
    return res.status(200).json({ 
      exams: formattedExams,
      department: schema_prefix 
    });
  } catch (error) {
    console.error('Error fetching student exam timetable:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
