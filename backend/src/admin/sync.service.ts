import { pool } from '../db';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const OVERWRITE_EXISTING_PASSWORDS = true; // ✅ Toggle this on/off

export async function syncUsersFromDepartments() {
  const { rows } = await pool.query('SELECT * FROM central.vw_pending_users');

  for (const row of rows) {
    const { email, date_of_birth, role, department, first_name, last_name } = row;

    function formatDOB(dob: any): string {
        const date = new Date(dob);
        const year = date.getFullYear();
        const month = (`0${date.getMonth() + 1}`).slice(-2);
        const day = (`0${date.getDate()}`).slice(-2);
        return `${year}${month}${day}`;
      }
      
      const rawPassword = date_of_birth ? formatDOB(date_of_birth) : 'changeme';
      

    const hashedPassword = await bcrypt.hash(rawPassword, SALT_ROUNDS);

    // Check if user already exists
    const existing = await pool.query(
      'SELECT user_id FROM central.users WHERE email = $1',
      [email]
    );

    let userId: number;

    if (existing.rowCount) {
      userId = existing.rows[0].user_id;

      if (OVERWRITE_EXISTING_PASSWORDS) {
        await pool.query(
          'UPDATE central.users SET password_hash = $1 WHERE user_id = $2',
          [hashedPassword, userId]
        );
        console.log(`🔄 Updated password for existing user: ${email}`);
      } else {
        console.log(`⏭ Skipped existing user: ${email}`);
        continue;
      }
    } else {
      const insert = await pool.query(
        `INSERT INTO central.users (email, password_hash)
         VALUES ($1, $2) RETURNING user_id`,
        [email, hashedPassword]
      );
      userId = insert.rows[0].user_id;
      console.log(`✅ Created new user: ${email}`);
    }

    // Assign role if not already assigned
    const roleId = await resolveRoleId(role);
    await pool.query(
      `INSERT INTO central.user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, roleId]
    );

    // Link department
    const dept = await pool.query(
      `SELECT dept_id FROM central.departments WHERE name = $1`,
      [department]
    );

    if (dept.rowCount) {
      await pool.query(
        `INSERT INTO central.user_department (user_id, dept_id, role_id)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [userId, dept.rows[0].dept_id, roleId]
      );
    }
  }
}

async function resolveRoleId(roleName: string) {
  const res = await pool.query(
    `SELECT role_id FROM central.roles WHERE name = $1`,
    [roleName]
  );
  return res.rows[0]?.role_id;
}
