// src/controllers/departmentAdmin/programController.ts
import { Request, Response, NextFunction } from 'express';
import { pool as centralPool } from '../../db';
import { getDepartmentPool } from '../../db';

/**
 * Get all programs for the department that the authenticated admin has access to
 */
export const getPrograms = async (req: Request, res: Response, next: NextFunction) => {
  let client = null;
  
  try {
    // Get user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    console.log(`Getting programs for admin ID: ${userId}`);
    
    // First get the user's email from their ID
    const userResult = await centralPool.query(
      'SELECT email FROM central.users WHERE user_id = $1',
      [userId]
    );
    
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const email = userResult.rows[0].email;
    
    // Find department admin's department using email
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix, d.name AS department_name
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix, department_name } = mapResult.rows[0];
    console.log(`Getting programs for department: ${department_name} (${schema_prefix})`);
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Fetch all programs from the department's schema
    const query = `
      SELECT 
        program_id as id,
        name,
        level,
        duration,
        status,
        created_at
      FROM ${schema_prefix}.programs
      ORDER BY name
    `;
    
    const result = await client.query(query);
    
    // Format dates to UK format (DD/MM/YYYY)
    const programs = result.rows.map(program => ({
      ...program,
      created_at: new Date(program.created_at).toLocaleDateString('en-GB')
    }));
    
    return res.status(200).json({ 
      programs,
      department: department_name
    });
    
  } catch (error) {
    console.error('Error fetching programs:', error);
    return res.status(500).json({ message: 'Failed to retrieve programs' });
  } finally {
    if (client) client.release();
  }
};

/**
 * Create a new program in the department
 */
export const createProgram = async (req: Request, res: Response, next: NextFunction) => {
  let client = null;
  
  try {
    const { name, level, duration, status } = req.body;
    
    // Validate required fields
    if (!name || !level || !duration) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Get user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Get admin's department
    const userResult = await centralPool.query(
      'SELECT email FROM central.users WHERE user_id = $1',
      [userId]
    );
    
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const email = userResult.rows[0].email;
    
    // Find department admin's department using email
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Insert the new program
    const query = `
      INSERT INTO ${schema_prefix}.programs (name, level, duration, status)
      VALUES ($1, $2, $3, $4)
      RETURNING program_id as id, name, level, duration, status, created_at
    `;
    
    const result = await client.query(query, [
      name, 
      level, 
      duration, 
      status || 'active' // Default to active if not provided
    ]);
    
    // Format the created_at date to UK format
    const program = {
      ...result.rows[0],
      created_at: new Date(result.rows[0].created_at).toLocaleDateString('en-GB')
    };
    
    return res.status(201).json({ program });
    
  } catch (error) {
    console.error('Error creating program:', error);
    return res.status(500).json({ message: 'Failed to create program' });
  } finally {
    if (client) client.release();
  }
};

/**
 * Update an existing program
 */
export const updateProgram = async (req: Request, res: Response, next: NextFunction) => {
  let client = null;
  
  try {
    const { id } = req.params;
    const { name, level, duration, status } = req.body;
    
    // Validate required fields
    if (!name || !level || !duration || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Get user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Get admin's department
    const userResult = await centralPool.query(
      'SELECT email FROM central.users WHERE user_id = $1',
      [userId]
    );
    
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const email = userResult.rows[0].email;
    
    // Find department admin's department using email
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Update the program
    const query = `
      UPDATE ${schema_prefix}.programs
      SET name = $1, level = $2, duration = $3, status = $4
      WHERE program_id = $5
      RETURNING program_id as id, name, level, duration, status, created_at
    `;
    
    const result = await client.query(query, [name, level, duration, status, id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Program not found' });
    }
    
    // Format the created_at date to UK format
    const program = {
      ...result.rows[0],
      created_at: new Date(result.rows[0].created_at).toLocaleDateString('en-GB')
    };
    
    return res.status(200).json({ program });
    
  } catch (error) {
    console.error('Error updating program:', error);
    return res.status(500).json({ message: 'Failed to update program' });
  } finally {
    if (client) client.release();
  }
};

/**
 * Delete a program
 */
export const deleteProgram = async (req: Request, res: Response, next: NextFunction) => {
  let client = null;
  
  try {
    const { id } = req.params;
    
    // Get user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Get admin's department
    const userResult = await centralPool.query(
      'SELECT email FROM central.users WHERE user_id = $1',
      [userId]
    );
    
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const email = userResult.rows[0].email;
    
    // Find department admin's department using email
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // First check if the program has any students enrolled in any related tables
    const checkStudentsQuery = `
      SELECT COUNT(*) FROM ${schema_prefix}.program_modules
      WHERE program_id = $1
    `;
    
    const checkResult = await client.query(checkStudentsQuery, [id]);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete program with enrolled students' 
      });
    }
    
    // Delete the program if no modules are associated with it
    const query = `
      DELETE FROM ${schema_prefix}.programs
      WHERE program_id = $1
      RETURNING program_id
    `;
    
    const result = await client.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Program not found' });
    }
    
    return res.status(200).json({ message: 'Program deleted successfully' });
    
  } catch (error: any) {
    console.error('Error deleting program:', error);
    // Log more details to help debug the issue
    if (error.code) console.error('Database error code:', error.code);
    if (error.detail) console.error('Error detail:', error.detail);
    if (error.stack) console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      message: 'Failed to delete program',
      detail: error.message || 'Unknown database error'
    });
  } finally {
    if (client) client.release();
  }
};
