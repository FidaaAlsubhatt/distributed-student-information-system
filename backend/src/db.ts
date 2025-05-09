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

// Cache for department-specific connection pools
const departmentPoolCache = new Map<string, Pool>();

// Create a function to get a department-specific connection pool
export const getDepartmentPool = async (departmentCode: string): Promise<Pool> => {
  // Check cache first
  if (departmentPoolCache.has(departmentCode)) {
    return departmentPoolCache.get(departmentCode)!;
  }

  // If not in cache, query global_sis for department connection details
  const query = {
    text: 'SELECT dept_db_host, dept_db_port, dept_db_name, dept_db_user, dept_db_password FROM central.departments WHERE department_code = $1',
    values: [departmentCode],
  };

  try {
    const result = await pool.query(query);
    if (result.rows.length === 0) {
      throw new Error(`Connection details not found for department: ${departmentCode}`);
    }

    const deptConfig = result.rows[0];

    const newDepartmentPool = new Pool({
      host: deptConfig.dept_db_host || process.env.DEPT_DB_HOST || 'localhost',
      port: parseInt(deptConfig.dept_db_port || process.env.DEPT_DB_PORT || '5436'),
      database: deptConfig.dept_db_name || process.env.DEPT_DB_NAME || 'dept_sis', // Fallback, though ideally config should be complete
      user: deptConfig.dept_db_user || process.env.DEPT_DB_USER || 'admin',
      password: deptConfig.dept_db_password || process.env.DEPT_DB_PASSWORD || 'adminpass',
      // No search_path needed as we are connecting to a specific DB
    });

    // Test the new department pool connection (optional, but good for diagnostics)
    await newDepartmentPool.query('SELECT NOW()');
    console.log(`✅ Database connected for department: ${departmentCode} to ${deptConfig.dept_db_name} on ${deptConfig.dept_db_host}:${deptConfig.dept_db_port}`);

    // Store in cache
    departmentPoolCache.set(departmentCode, newDepartmentPool);
    return newDepartmentPool;
  } catch (error) {
    console.error(`❌ Error creating/connecting department pool for ${departmentCode}:`, error);
    throw error; // Re-throw to be handled by caller
  }
};

// Test the database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected at:', res.rows[0].now);
  }
});
