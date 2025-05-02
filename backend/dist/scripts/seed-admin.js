"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pool_1 = require("../db/pool");
const hash_1 = require("../utils/hash");
async function seedAdmin() {
    const hashed = await (0, hash_1.hashPassword)('33669933');
    const existing = await pool_1.pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (existing.rows.length > 0) {
        console.log('Admin already exists');
        return;
    }
    await pool_1.pool.query(`
    INSERT INTO users (username, password, email, role, first_name, last_name, full_name)
    VALUES ('admin', $1, 'admin@admin.com', 'central_admin', 'Admin', 'User', 'Admin User')
  `, [hashed]);
    console.log('✅ Admin seeded');
    await pool_1.pool.end();
}
seedAdmin();
