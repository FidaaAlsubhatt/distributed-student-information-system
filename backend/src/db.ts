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

// Map schema_prefix values to department database connection details
const departmentConfigs: Record<string, any> = {
  'cs_schema': {
    host: process.env.CS_DB_HOST || 'localhost',
    port: parseInt(process.env.CS_DB_PORT || '5433'),
    database: process.env.CS_DB_NAME || 'cs_sis',
    user: process.env.CS_DB_USER || 'cs_admin',
    password: process.env.CS_DB_PASSWORD || 'cspass',
  },
  'math_schema': {
    host: process.env.MATH_DB_HOST || 'localhost',
    port: parseInt(process.env.MATH_DB_PORT || '5434'),
    database: process.env.MATH_DB_NAME || 'math_sis',
    user: process.env.MATH_DB_USER || 'math_admin',
    password: process.env.MATH_DB_PASSWORD || 'mathpass',
  }
};

// Create a function to get a department-specific connection pool
export const getDepartmentPool = async (schemaPrefix: string): Promise<Pool> => {
  // Check cache first
  if (departmentPoolCache.has(schemaPrefix)) {
    return departmentPoolCache.get(schemaPrefix)!;
  }

  try {
    // Get schema info from departments table
    const deptResult = await pool.query(
      'SELECT schema_prefix FROM central.departments WHERE schema_prefix = $1',
      [schemaPrefix]
    );

    // Validate schema prefix exists
    if (deptResult.rows.length === 0) {
      throw new Error(`Schema prefix not found: ${schemaPrefix}`);
    }

    // Get the department configuration from our static map
    const deptConfig = departmentConfigs[schemaPrefix];
    if (!deptConfig) {
      throw new Error(`Connection configuration not found for schema: ${schemaPrefix}`);
    }

    // Create a new pool with the department config
    const newDepartmentPool = new Pool(deptConfig);

    // Test the connection
    await newDepartmentPool.query('SELECT NOW()');
    console.log(`✅ Connected to department DB for schema: ${schemaPrefix}`);

    // Store in cache
    departmentPoolCache.set(schemaPrefix, newDepartmentPool);
    return newDepartmentPool;
  } catch (error) {
    console.error(`❌ Error creating/connecting department pool for ${schemaPrefix}:`, error);
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
