import { pool } from '../db/pool';
import { hashPassword } from '../utils/hash';

async function seedAdmin() {
  const hashed = await hashPassword('33669933');
  const existing = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);

  if (existing.rows.length > 0) {
    console.log('Admin already exists');
    return;
  }

  await pool.query(`
    INSERT INTO users (username, password, email, role, first_name, last_name, full_name)
    VALUES ('admin', $1, 'admin@admin.com', 'central_admin', 'Admin', 'User', 'Admin User')
  `, [hashed]);

  console.log('✅ Admin seeded');
  await pool.end();
}

seedAdmin();

