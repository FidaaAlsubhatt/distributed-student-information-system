import { Request, Response } from 'express';
import { pool, getDepartmentPool } from '../../db';

interface AuthUser {
  userId: number;
  role: string;
  email?: string;
}

export const getDepartmentEnrollmentRequests = async (req: Request, res: Response) => {
  try {
    const token = req.user as AuthUser;
    const email = token?.email;
    if (!email) return res.status(400).json({ message: 'Missing email in token' });

    const result = await pool.query(`
      SELECT d.dept_id, d.schema_prefix, d.name
      FROM central.user_department ud
      JOIN central.departments d ON ud.dept_id = d.dept_id
      JOIN central.users u ON u.user_id = ud.user_id
      WHERE u.email = $1
    `, [email]);

    if (!result.rowCount) return res.status(404).json({ message: 'No department found for this user' });

    const dept = result.rows[0];
    const deptPool = await getDepartmentPool(dept.schema_prefix);

    const internalRaw = await deptPool.query(`
      SELECT er.*, s.university_email, m.code AS module_code, m.title AS module_title
      FROM ${dept.schema_prefix}.enrollment_requests er
      LEFT JOIN ${dept.schema_prefix}.students s ON s.user_id = er.student_id
      LEFT JOIN ${dept.schema_prefix}.modules m ON m.module_id = er.module_id
      ORDER BY er.request_date DESC
    `);

    const internalRequests = internalRaw.rows.map(r => ({
      id: r.request_id.toString(),
      studentEmail: r.university_email || 'unknown@university.ac.uk',
      moduleCode: r.module_code || 'UNKNOWN',
      moduleTitle: r.module_title || 'Unknown Module',
      reason: r.reason,
      requestDate: r.request_date,
      status: r.status,
      type: 'internal'
    }));

    const externalRaw = await deptPool.query(`
      SELECT er.*, m.code AS module_code, m.title AS module_title
      FROM ${dept.schema_prefix}.external_module_requests er
      LEFT JOIN ${dept.schema_prefix}.modules m ON m.module_id = er.target_module_id
      ORDER BY er.request_date DESC
    `);

    const externalRequests = externalRaw.rows.map(r => ({
      id: r.request_id.toString(),
      studentEmail: r.university_email || 'unknown@university.ac.uk',
      studentName: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
      moduleCode: r.module_code || 'UNKNOWN',
      moduleTitle: r.module_title || 'Unknown Module',
      reason: r.reason,
      requestDate: r.request_date,
      status: r.status,
      type: 'external',
      sourceDeptCode: r.source_dept_code
    }));

    return res.status(200).json({
      internalRequests,
      externalRequests,
      departmentInfo: {
        name: dept.name,
        code: dept.name.substring(0, 4).toLowerCase()
      }
    });

  } catch (error) {
    console.error('getDepartmentEnrollmentRequests error:', error);
    return res.status(500).json({ message: 'Failed to fetch enrollment requests' });
  }
};

export const reviewEnrollmentRequest = async (req: Request, res: Response) => {
  let client = null;
  let studentClient = null;

  try {
    const { id } = req.params;
    const { action, type, notes } = req.body;
    const user = req.user as AuthUser;
    const email = user?.email;

    if (!email) return res.status(400).json({ message: 'Missing email' });

    const result = await pool.query(`
      SELECT d.schema_prefix, d.name
      FROM central.user_department ud
      JOIN central.departments d ON d.dept_id = ud.dept_id
      JOIN central.users u ON u.user_id = ud.user_id
      WHERE u.email = $1
    `, [email]);

    if (!result.rowCount) return res.status(404).json({ message: 'Admin department not found' });

    const dept = result.rows[0];
    const deptPool = await getDepartmentPool(dept.schema_prefix);
    client = await deptPool.connect();
    await client.query('BEGIN');

    if (type === 'internal') {
      const request = await client.query(
        `SELECT * FROM ${dept.schema_prefix}.enrollment_requests WHERE request_id = $1`,
        [id]
      );
      if (!request.rowCount) throw new Error('Internal request not found');

      const { student_id, module_id } = request.rows[0];

      await client.query(`
        UPDATE ${dept.schema_prefix}.enrollment_requests
        SET status = $1, review_date = NOW(), reviewer_notes = $2
        WHERE request_id = $3
      `, [action, notes || '', id]);

      if (action === 'approve') {
        await client.query(`
          INSERT INTO ${dept.schema_prefix}.enrollments
          (student_id, module_id, status, request_date)
          VALUES ($1, $2, 'registered', NOW())
        `, [student_id, module_id]);
      }

    } else if (type === 'external') {
      const requestRes = await client.query(
        `SELECT * FROM ${dept.schema_prefix}.external_module_requests WHERE request_id = $1`,
        [id]
      );
      if (!requestRes.rowCount) throw new Error('External request not found');

      const request = requestRes.rows[0];

      const {
        student_id,
        target_module_id,
        source_schema_prefix,
        source_dept_id,
        source_dept_code,
        university_email,
        first_name,
        last_name
      } = request;

      await client.query(`
        UPDATE ${dept.schema_prefix}.external_module_requests
        SET status = $1, response_date = NOW(), response_notes = $2
        WHERE request_id = $3
      `, [action, notes || '', id]);

      if (action === 'approve') {
        const moduleRes = await client.query(`
          SELECT code, title FROM ${dept.schema_prefix}.modules
          WHERE module_id = $1
        `, [target_module_id]);

        const module = moduleRes.rows[0] || {};
        const moduleCode = module.code || 'UNKNOWN';
        const moduleTitle = module.title || 'External Module';

        // Insert shadow student (or update if exists)
        await client.query(`
          INSERT INTO ${dept.schema_prefix}.student_shadow
          (student_id, university_email, first_name, last_name, source_dept_id, source_dept_code, source_schema_prefix)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (student_id) DO UPDATE SET
            university_email = EXCLUDED.university_email,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name
        `, [student_id, university_email, first_name, last_name, source_dept_id, source_dept_code, source_schema_prefix]);

        // Insert enrollment record ONLY in the department where the module belongs (admin's department)
        console.log(`Creating enrollment record in ${dept.schema_prefix}.external_enrollments`);
        await client.query(`
          INSERT INTO ${dept.schema_prefix}.external_enrollments
          (student_id, module_id, status, request_date, module_code, module_title, student_dept_code, student_schema_prefix)
          VALUES ($1, $2, 'registered', NOW(), $3, $4, $5, $6)
        `, [student_id, target_module_id, moduleCode, moduleTitle, source_dept_code, source_schema_prefix]);
        
        console.log(`Successfully enrolled student ${student_id} from ${source_dept_code} department in module ${moduleCode}`);
        
        // Release any student client connections to avoid unused connections
        studentClient = null;
      }
    }

    await client.query('COMMIT');
    return res.status(200).json({ message: `Request ${action}d successfully.` });

  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('reviewEnrollmentRequest error:', err);
    return res.status(500).json({ message: 'Request processing failed', error: err instanceof Error ? err.message : err });
  } finally {
    if (client) client.release();
  }
};