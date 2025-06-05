import { pool } from '../db';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const OVERWRITE_EXISTING_PASSWORDS = false;

export async function syncUsersFromDepartments() {
  console.log('🔁 Starting sync process...');
  const { rows } = await pool.query('SELECT * FROM central.vw_pending_users');

  console.log(`🔍 Found ${rows.length} user(s) to sync.`);

  if (rows.length === 0) {
    console.log('🚫 No users to sync. Exiting.');
    return;
  }

  for (const row of rows) {
    try {
      const {
        local_user_id: localUserId, // ✅ FIXED key name from the view
        email: universityEmail,
        date_of_birth,
        role,
        department, // e.g. 'Computer Science'
        first_name,
        last_name
      } = row;

      const rawPassword = date_of_birth
        ? formatDOB(date_of_birth)
        : 'changeme';

      const hashedPassword = await bcrypt.hash(rawPassword, SALT_ROUNDS);

      // Step 1: Check if user exists
      const existing = await pool.query(
        'SELECT user_id FROM central.users WHERE email = $1',
        [universityEmail]
      );

      let userId: number;

      if (existing.rowCount) {
        userId = existing.rows[0].user_id;

        if (OVERWRITE_EXISTING_PASSWORDS) {
          await pool.query(
            'UPDATE central.users SET password_hash = $1 WHERE user_id = $2',
            [hashedPassword, userId]
          );
          console.log(`🔄 Updated password for existing user: ${universityEmail}`);
        } else {
          console.log(`⏭ Skipped existing user: ${universityEmail}`);
          continue;
        }
      } else {
        const insert = await pool.query(
          `INSERT INTO central.users (email, password_hash)
           VALUES ($1, $2) RETURNING user_id`,
          [universityEmail, hashedPassword]
        );
        userId = insert.rows[0].user_id;
        console.log(`✅ Created new user: ${universityEmail}`);
      }

      // Step 2: Resolve role
      const roleId = await resolveRoleId(role);
      await pool.query(
        `INSERT INTO central.user_roles (user_id, role_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, roleId]
      );

      // ✅ FIX: Use name match instead of schema_prefix
      const dept = await pool.query(
        `SELECT dept_id FROM central.departments WHERE name = $1`,
        [department]
      );

      if (dept.rowCount) {
        const deptId = dept.rows[0].dept_id;

        await pool.query(
          `INSERT INTO central.user_department (user_id, dept_id, role_id)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [userId, deptId, roleId]
        );

        await pool.query(
          `INSERT INTO central.user_id_map (dept_id, local_user_id, university_email)
           VALUES ($1, $2, $3)
           ON CONFLICT (dept_id, local_user_id) DO NOTHING`,
          [deptId, localUserId, universityEmail]
        );
      } else {
        console.warn(`⚠️ Department not found for name: ${department}`);
      }
    } catch (err) {
      console.error('❌ Error processing user:', row?.email, err);
    }
  }

  console.log('✅ Sync process completed.');
}

function formatDOB(dob: any): string {
  const date = new Date(dob);
  const year = date.getFullYear();
  const month = (`0${date.getMonth() + 1}`).slice(-2);
  const day = (`0${date.getDate()}`).slice(-2);
  return `${year}${month}${day}`;
}

async function resolveRoleId(roleName: string): Promise<number> {
  const res = await pool.query(
    `SELECT role_id FROM central.roles WHERE name = $1`,
    [roleName]
  );
  if (!res.rows.length) throw new Error(`Role "${roleName}" not found.`);
  return res.rows[0].role_id;
}

// Run the function
syncUsersFromDepartments();
