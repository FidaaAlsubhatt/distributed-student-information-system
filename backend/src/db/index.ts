import { Pool } from 'pg';

// Central database pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'global_sis',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Cache for department database pools
const departmentPools: Record<string, Pool> = {};

/**
 * Get a database pool for a specific department
 * @param schema_prefix The schema prefix for the department (e.g., 'cs_schema', 'math_schema')
 */
export async function getDepartmentPool(schema_prefix: string): Promise<Pool> {
  // If we already have a pool for this department, return it
  if (departmentPools[schema_prefix]) {
    return departmentPools[schema_prefix];
  }

  // Otherwise, create a new pool based on the department
  let dbName = 'cs_sis'; // Default to CS department
  let dbHost = process.env.CS_DB_HOST || 'localhost';
  
  if (schema_prefix === 'math_schema') {
    dbName = 'math_sis';
    dbHost = process.env.MATH_DB_HOST || 'localhost';
  }
  
  // Create a new pool for this department
  const deptPool = new Pool({
    user: process.env.DB_USER,
    host: dbHost,
    database: dbName,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
  });
  
  // Cache the pool for future use
  departmentPools[schema_prefix] = deptPool;
  
  return deptPool;
}

export { pool };
