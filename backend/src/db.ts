import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create a connection pool to the global database
export const pool = new Pool({
  host: process.env.GLOBAL_DB_HOST || 'localhost',
  port: parseInt(process.env.GLOBAL_DB_PORT || '5435'),
  database: process.env.GLOBAL_DB_NAME || 'global_sis',
  user: process.env.GLOBAL_DB_USER || 'admin',
  password: process.env.GLOBAL_DB_PASSWORD || 'adminpass',
});

// Create a function to get a department-specific connection pool
export const getDepartmentPool = (deptSchemaPrefix: string) => {
  return new Pool({
    host: process.env.DEPT_DB_HOST || 'localhost',
    port: parseInt(process.env.DEPT_DB_PORT || '5436'),
    database: process.env.DEPT_DB_NAME || 'dept_sis',
    user: process.env.DEPT_DB_USER || 'admin',
    password: process.env.DEPT_DB_PASSWORD || 'adminpass',
    // Set the search path to the department schema
    options: `-c search_path=${deptSchemaPrefix},public`
  });
};

// Test the database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected at:', res.rows[0].now);
  }
});
