import { Request, Response } from 'express';
import { pool, getDepartmentPool } from '../../db';

interface AuthUser {
  userId: number;
  role: string;
  email?: string;
}

export const getDepartmentEnrollmentRequests = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    const email = user.email;
    if (!email) return res.status(400).json({ message: 'Missing email in token' });

    const result = await pool.query(`
      SELECT d.dept_id, d.schema_prefix
      FROM central.user_id_map uim
      JOIN central.departments d ON uim.dept_id = d.dept_id
      WHERE uim.university_email = $1
    `, [email]);

    if (!result.rowCount) return res.status(404).json({ message: 'Department not found for this admin' });

    const { dept_id, schema_prefix } = result.rows[0];
    const deptPool = await getDepartmentPool(schema_prefix);

    const internal = await deptPool.query(`
      SELECT 
        er.request_id::text AS id,
        sp.university_email AS studentEmail,
        m.code AS moduleCode,
        m.title AS moduleTitle,
        er.reason,
        er.request_date AS requestDate,
        er.status,
        'internal' AS type
      FROM ${schema_prefix}.enrollment_requests er
      JOIN ${schema_prefix}.students s ON er.student_id = s.user_id
      JOIN ${schema_prefix}.user_profiles sp ON s.user_id = sp.user_id
      JOIN ${schema_prefix}.modules m ON er.module_id = m.module_id
      WHERE er.status = 'pending'
      ORDER BY er.request_date DESC
    `);

    // Get cross-department (external) requests from our department's schema
    // These are requests from students in other departments to enroll in our modules
    const external = await deptPool.query(`
      SELECT 
        er.request_id::text AS id,
        u.email AS studentEmail,
        m.code AS moduleCode,
        m.title AS moduleTitle,
        er.reason,
        er.request_date AS requestDate,
        er.status,
        'external' AS type,
        sd.code AS sourceDeptCode,
        sd.name AS sourceDeptName,
        '${schema_prefix}' AS targetSchemaPrefix,
        CONCAT(sd.code, ':', er.student_id) AS compositeStudentId,
        CONCAT('${schema_prefix}', ':', m.code) AS compositeModuleId
      FROM ${schema_prefix}.external_module_requests er
      JOIN ${schema_prefix}.modules m ON er.target_module_id = m.module_id
      JOIN central.user_id_map uim ON er.student_id = uim.local_user_id
      JOIN central.users u ON uim.user_id = u.user_id
      JOIN central.departments sd ON uim.dept_id = sd.dept_id
      WHERE er.status = 'pending'
      ORDER BY er.request_date DESC
    `);

    return res.status(200).json({
      internalRequests: internal.rows,
      externalRequests: external.rows
    });
  } catch (err) {
    console.error('Error fetching department requests:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const reviewEnrollmentRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, type, notes } = req.body;
    if (!['approve', 'reject'].includes(action) || !['internal', 'external'].includes(type)) {
      return res.status(400).json({ message: 'Invalid action or type' });
    }

    const user = req.user as AuthUser;
    const email = user.email;
    const result = await pool.query(`
      SELECT d.dept_id, d.schema_prefix
      FROM central.user_id_map uim
      JOIN central.departments d ON uim.dept_id = d.dept_id
      WHERE uim.university_email = $1
    `, [email]);

    if (!result.rowCount) return res.status(404).json({ message: 'Department not found for admin' });

    const { schema_prefix } = result.rows[0];
    const deptPool = await getDepartmentPool(schema_prefix);

    if (type === 'internal') {
      const request = await deptPool.query(`SELECT * FROM ${schema_prefix}.enrollment_requests WHERE request_id = $1`, [id]);
      if (!request.rowCount) return res.status(404).json({ message: 'Request not found' });

      const { student_id, module_id } = request.rows[0];

      await deptPool.query(`
        UPDATE ${schema_prefix}.enrollment_requests
        SET status = $1, review_date = NOW(), reviewer_notes = $2
        WHERE request_id = $3
      `, [action, notes || '', id]);

      if (action === 'approve') {
        await deptPool.query(`
          INSERT INTO ${schema_prefix}.enrollments (student_id, module_id, status, request_date)
          VALUES ($1, $2, 'registered', NOW())
        `, [student_id, module_id]);
      }
    } else if (type === 'external') {
      // For external requests, we need to check in our department schema
      const request = await deptPool.query(`SELECT * FROM ${schema_prefix}.external_module_requests WHERE request_id = $1`, [id]);
      if (!request.rowCount) return res.status(404).json({ message: 'External request not found' });

      const { student_id, target_module_id, target_dept_id } = request.rows[0];
      
      // Log request details for debugging
      console.log('Processing external request:', {
        request_id: id,
        student_id,
        target_module_id,
        target_dept_id,
        schema_prefix
      });

      // Update the request in our schema
      await deptPool.query(`
        UPDATE ${schema_prefix}.external_module_requests
        SET status = $1, response_date = NOW(), response_notes = $2
        WHERE request_id = $3
      `, [action, notes || '', id]);

      if (action === 'approve') {
        // Get module details to include in the enrollment record
        const moduleDetails = await pool.query(`
          SELECT gm.*, d.schema_prefix 
          FROM central.global_modules gm
          JOIN central.departments d ON gm.dept_id = d.dept_id
          WHERE gm.module_id = $1 AND gm.dept_id = $2
        `, [target_module_id, target_dept_id]);
        
        if (!moduleDetails.rowCount) {
          throw new Error('Module details not found');
        }

        const moduleInfo = moduleDetails.rows[0];
        
        // Find the student's department and schema
        const studentMap = await pool.query(`
          SELECT uim.*, d.schema_prefix, d.code as dept_code 
          FROM central.user_id_map uim
          JOIN central.departments d ON uim.dept_id = d.dept_id
          WHERE uim.local_user_id = $1
        `, [student_id]);

        if (!studentMap.rowCount) throw new Error('Could not determine student schema');

        const studentInfo = studentMap.rows[0];
        const studentDeptPool = await getDepartmentPool(studentInfo.schema_prefix);
        
        // Insert enrollment in student's department schema with reference to the global module
        await studentDeptPool.query(`
          INSERT INTO ${studentInfo.schema_prefix}.enrollments 
            (student_id, module_id, status, request_date, is_external_module, 
             external_module_code, external_dept_code, external_module_title)
          VALUES ($1, $2, 'registered', NOW(), TRUE, $3, $4, $5)
        `, [student_id, target_module_id, moduleInfo.code, moduleInfo.department_code, moduleInfo.title]);
        
        console.log(`Enrolled student ${student_id} (${studentInfo.dept_code}) in external module ${target_module_id} (${moduleInfo.department_code}:${moduleInfo.code})`);
        
        // Also notify the student via central database or messaging system
        // This is a placeholder for future notification system
        console.log('Student enrollment notification would be sent here');
        
      }
    }

    return res.status(200).json({ message: `Request ${action}d successfully.` });
  } catch (err) {
    console.error('Error reviewing request:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};