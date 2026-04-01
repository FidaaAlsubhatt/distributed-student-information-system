import { Pool } from 'pg';
import { env, type DbConfig } from './config/env';

// Create a connection pool to the global database
export const pool = new Pool(env.globalDb);

// Cache for department-specific connection pools
const departmentPoolCache = new Map<string, Pool>();

// Map schema_prefix values to department database connection details
const departmentConfigs: Record<'cs_schema' | 'math_schema', DbConfig> = {
  cs_schema: env.departmentDbs.cs_schema,
  math_schema: env.departmentDbs.math_schema,
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
    const deptConfig = departmentConfigs[schemaPrefix as keyof typeof departmentConfigs];
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
