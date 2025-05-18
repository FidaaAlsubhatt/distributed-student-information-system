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

    const external = await pool.query(`
      SELECT 
        er.request_id::text AS id,
        u.email AS studentEmail,
        gm.code AS moduleCode,
        gm.title AS moduleTitle,
        er.reason,
        er.request_date AS requestDate,
        er.status,
        'external' AS type,
        gm.department_code AS departmentCode
      FROM central.external_module_requests er
      JOIN central.user_id_map uim ON er.student_id = uim.local_user_id
      JOIN central.users u ON u.user_id = uim.user_id
      JOIN central.global_modules gm ON gm.module_id = er.target_module_id AND gm.dept_id = $1
      WHERE er.target_dept_id = $1 AND er.status = 'pending'
      ORDER BY er.request_date DESC
    `, [dept_id]);

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
      const request = await pool.query(`SELECT * FROM central.external_module_requests WHERE request_id = $1`, [id]);
      if (!request.rowCount) return res.status(404).json({ message: 'External request not found' });

      const { student_id, target_module_id, target_dept_id } = request.rows[0];

      await pool.query(`
        UPDATE central.external_module_requests
        SET status = $1, response_date = NOW(), response_notes = $2
        WHERE request_id = $3
      `, [action, notes || '', id]);

      if (action === 'approve') {
        const studentMap = await pool.query(`
          SELECT schema_prefix FROM central.departments d
          JOIN central.user_id_map uim ON uim.dept_id = d.dept_id
          WHERE uim.local_user_id = $1
        `, [student_id]);

        if (!studentMap.rowCount) throw new Error('Could not determine student schema');

        const studentDeptPool = await getDepartmentPool(studentMap.rows[0].schema_prefix);
        await studentDeptPool.query(`
          INSERT INTO ${studentMap.rows[0].schema_prefix}.enrollments (student_id, module_id, status, request_date)
          VALUES ($1, $2, 'registered', NOW())
        `, [student_id, target_module_id]);
      }
    }

    return res.status(200).json({ message: `Request ${action}d successfully.` });
  } catch (err) {
    console.error('Error reviewing request:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};