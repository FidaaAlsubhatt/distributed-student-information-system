import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function seedUsers() {
  // Create a connection to the global database
  const pool = new Pool({
    host: process.env.GLOBAL_DB_HOST || 'localhost',
    port: parseInt(process.env.GLOBAL_DB_PORT || '5435'),
    database: process.env.GLOBAL_DB_NAME || 'global_sis',
    user: process.env.GLOBAL_DB_USER || 'admin',
    password: process.env.GLOBAL_DB_PASSWORD || 'adminpass',
  });

  try {
    console.log('🌱 Seeding users and roles...');
    
    // Read the SQL file
    const sqlFilePath = path.resolve(__dirname, 'seed-users.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await pool.end();
  }
}

// Run the seed function
seedUsers();
