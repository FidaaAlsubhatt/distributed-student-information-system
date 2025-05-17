// src/controllers/departmentAdmin/manageStaffController.ts
import { Request, Response, NextFunction } from 'express';
import { pool as centralPool } from '../../db';
import { getDepartmentPool } from '../../db';
import bcrypt from 'bcrypt';

// All functions are individually exported

/**
 * Get all academic staff for the department
 */
export const getStaff = async (req: Request, res: Response) => {
  let client = null;
  
  try {
    // Get user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Get admin's email from central database
    const userResult = await centralPool.query(
      'SELECT email FROM central.users WHERE user_id = $1',
      [userId]
    );
    
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const email = userResult.rows[0].email;
    
    // Find department admin's department details
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
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Fetch all staff from the department schema
    const query = `
      SELECT 
        s.user_id as id, 
        up.first_name as "firstName",
        up.last_name as "lastName",
        s.staff_number as "staffId",
        s.title as position,
        s.university_email as "universityEmail",
        up.personal_email as email,
        up.gender,
        up.date_of_birth as "dateOfBirth",
        'active' as status
      FROM ${schema_prefix}.staff s
      JOIN ${schema_prefix}.user_profiles up ON s.user_id = up.user_id
      ORDER BY up.last_name, up.first_name
    `;
    
    const result = await client.query(query);
    
    // Format dates to UK format (DD/MM/YYYY)
    const staff = result.rows.map(member => ({
      ...member,
      dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('en-GB') : null
    }));
    
    return res.status(200).json({ 
      users: staff,
      department: department_name
    });
    
  } catch (error) {
    console.error('Error fetching staff:', error);
    return res.status(500).json({ message: 'Failed to retrieve staff' });
  } finally {
    if (client) client.release();
  }
};

/**
 * Add new academic staff to the department
 */
export const addStaff = async (req: Request, res: Response) => {
  let client = null;
  
  try {
    const { firstName, lastName, staffId, position, universityEmail, email, gender, dateOfBirth } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !staffId || !position || !universityEmail || !email) {
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
    
    const adminEmail = userResult.rows[0].email;
    
    // Find department schema
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [adminEmail]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Start transaction
    await client.query('BEGIN');
    
    // Check if staff with same university email already exists
    const checkEmailQuery = `
      SELECT staff_number FROM ${schema_prefix}.staff 
      WHERE university_email = $1
    `;
    
    const emailCheckResult = await client.query(checkEmailQuery, [universityEmail]);
    
    if (emailCheckResult.rowCount !== null && emailCheckResult.rowCount > 0) {
      return res.status(409).json({ message: 'Staff with this university email already exists' });
    }
    
    // Check if staff with same ID already exists
    const checkStaffIdQuery = `
      SELECT university_email FROM ${schema_prefix}.staff 
      WHERE staff_number = $1
    `;
    
    const staffIdCheckResult = await client.query(checkStaffIdQuery, [staffId]);
    
    if ((staffIdCheckResult.rowCount ?? 0) > 0) {
      return res.status(409).json({ message: 'Staff with this ID already exists' });
    }
    
    // First create the user profile
    const createProfileQuery = `
      INSERT INTO ${schema_prefix}.user_profiles 
      (first_name, last_name, date_of_birth, gender, personal_email, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING user_id
    `;
    
    const profileParams = [firstName, lastName, dateOfBirth, gender, email];
    const profileResult = await client.query(createProfileQuery, profileParams);
    
    const newUserId = profileResult.rows[0].user_id;
    
    // Then create staff record
    const createStaffQuery = `
      INSERT INTO ${schema_prefix}.staff
      (user_id, staff_number, university_email, title, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING user_id
    `;
    
    const staffParams = [newUserId, staffId, universityEmail, position];
    await client.query(createStaffQuery, staffParams);
    
    // Commit transaction
    await client.query('COMMIT');
    
    return res.status(201).json({
      message: 'Staff member created successfully',
      id: newUserId,
      firstName,
      lastName,
      staffId,
      universityEmail,
      email,
      position,
      gender,
      dateOfBirth
    });
    
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error creating staff:', error);
    return res.status(500).json({ message: 'Failed to create staff member' });
  } finally {
    if (client) client.release();
  }
};

/**
 * Update existing staff member
 */
export const updateStaff = async (req: Request, res: Response) => {
  let client = null;
  
  try {
    const { id } = req.params;
    const { firstName, lastName, staffId, position, universityEmail, gender, dateOfBirth } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !staffId || !position || !universityEmail) {
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
    
    const adminEmail = userResult.rows[0].email;
    
    // Find department schema
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [adminEmail]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Start transaction
    await client.query('BEGIN');
    
    // Check if staff exists
    const checkStaffQuery = `
      SELECT s.user_id FROM ${schema_prefix}.staff s
      WHERE s.user_id = $1
    `;
    
    const staffCheckResult = await client.query(checkStaffQuery, [id]);
    
    if (staffCheckResult.rowCount === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    // Check if staff with same email exists but different ID
    const checkEmailQuery = `
      SELECT user_id FROM ${schema_prefix}.staff 
      WHERE university_email = $1 AND user_id != $2
    `;
    
    const emailCheckResult = await client.query(checkEmailQuery, [universityEmail, id]);
    
    if ((emailCheckResult.rowCount ?? 0) > 0) {
      return res.status(409).json({ message: 'Another staff member already uses this university email' });
    }
    
    // Check if staff with same ID exists but different user
    const checkStaffIdQuery = `
      SELECT user_id FROM ${schema_prefix}.staff 
      WHERE staff_number = $1 AND user_id != $2
    `;
    
    const staffIdCheckResult = await client.query(checkStaffIdQuery, [staffId, id]);
    
    if ((staffIdCheckResult.rowCount ?? 0) > 0) {
      return res.status(409).json({ message: 'Another staff member already uses this staff ID' });
    }
    
    // Update user profile
    const updateProfileQuery = `
      UPDATE ${schema_prefix}.user_profiles
      SET first_name = $1, last_name = $2, date_of_birth = $3, gender = $4
      WHERE user_id = $5
    `;
    
    const profileParams = [firstName, lastName, dateOfBirth, gender, id];
    await client.query(updateProfileQuery, profileParams);
    
    // Update staff record
    const updateStaffQuery = `
      UPDATE ${schema_prefix}.staff
      SET staff_number = $1, university_email = $2, title = $3
      WHERE user_id = $4
    `;
    
    const staffParams = [staffId, universityEmail, position, id];
    await client.query(updateStaffQuery, staffParams);
    
    // Commit transaction
    await client.query('COMMIT');
    
    return res.status(200).json({
      message: 'Staff member updated successfully',
      id,
      firstName,
      lastName,
      staffId,
      universityEmail,
      position,
      gender,
      dateOfBirth
    });
    
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error updating staff:', error);
    return res.status(500).json({ message: 'Failed to update staff member' });
  } finally {
    if (client) client.release();
  }
};

/**
 * Delete staff member
 */
export const deleteStaff = async (req: Request, res: Response) => {
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
    
    const adminEmail = userResult.rows[0].email;
    
    // Find department schema
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [adminEmail]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Start transaction
    await client.query('BEGIN');
    
    // Check if staff member is teaching any modules
    const checkModulesQuery = `
      SELECT COUNT(*) FROM ${schema_prefix}.module_staff
      WHERE staff_id = $1
    `;
    
    const moduleCheckResult = await client.query(checkModulesQuery, [id]);
    
    if (parseInt(moduleCheckResult.rows[0].count) > 0) {
      // First remove the staff from all module assignments
      const deleteModuleAssignmentsQuery = `
        DELETE FROM ${schema_prefix}.module_staff
        WHERE staff_id = $1
      `;
      
      await client.query(deleteModuleAssignmentsQuery, [id]);
    }
    
    // Delete staff record first (follows foreign key constraints)
    const deleteStaffQuery = `
      DELETE FROM ${schema_prefix}.staff
      WHERE user_id = $1
      RETURNING user_id
    `;
    
    const staffDeleteResult = await client.query(deleteStaffQuery, [id]);
    
    if (staffDeleteResult.rowCount === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    // Delete user profile
    const deleteProfileQuery = `
      DELETE FROM ${schema_prefix}.user_profiles
      WHERE user_id = $1
    `;
    
    await client.query(deleteProfileQuery, [id]);
    
    // Commit transaction
    await client.query('COMMIT');
    
    return res.status(200).json({ message: 'Staff member deleted successfully' });
    
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error deleting staff:', error);
    return res.status(500).json({ message: 'Failed to delete staff member' });
  } finally {
    if (client) client.release();
  }
};

/**
 * Assign staff to a module
 */
export const assignStaffToModule = async (req: Request, res: Response) => {
  let client = null;
  
  try {
    const { staffId, moduleId, role } = req.body;
    
    // Validate required fields
    if (!staffId || !moduleId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Default role if not provided
    const staffRole = role || 'lecturer';
    
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
    
    const adminEmail = userResult.rows[0].email;
    
    // Find department schema
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [adminEmail]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Check if staff exists
    const checkStaffQuery = `
      SELECT user_id FROM ${schema_prefix}.staff
      WHERE user_id = $1
    `;
    
    const staffCheckResult = await client.query(checkStaffQuery, [staffId]);
    
    if (staffCheckResult.rowCount === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    // Check if module exists
    const checkModuleQuery = `
      SELECT module_id FROM ${schema_prefix}.modules
      WHERE module_id = $1
    `;
    
    const moduleCheckResult = await client.query(checkModuleQuery, [moduleId]);
    
    if (moduleCheckResult.rowCount === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Check if assignment already exists
    const checkAssignmentQuery = `
      SELECT id FROM ${schema_prefix}.module_staff
      WHERE module_id = $1 AND staff_id = $2
    `;
    
    const assignmentCheckResult = await client.query(checkAssignmentQuery, [moduleId, staffId]);
    
    if (assignmentCheckResult && assignmentCheckResult.rowCount && assignmentCheckResult.rowCount > 0) {
      // Update role if assignment exists
      const updateRoleQuery = `
        UPDATE ${schema_prefix}.module_staff
        SET role = $1
        WHERE module_id = $2 AND staff_id = $3
        RETURNING id
      `;
      
      await client.query(updateRoleQuery, [staffRole, moduleId, staffId]);
      
      return res.status(200).json({ 
        message: 'Staff member role updated for module',
        staffId,
        moduleId,
        role: staffRole
      });
    }
    
    // Create new module assignment
    const assignQuery = `
      INSERT INTO ${schema_prefix}.module_staff
      (module_id, staff_id, role)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    
    const result = await client.query(assignQuery, [moduleId, staffId, staffRole]);
    
    return res.status(201).json({
      message: 'Staff member assigned to module successfully',
      id: result.rows[0].id,
      staffId,
      moduleId,
      role: staffRole
    });
    
  } catch (error) {
    console.error('Error assigning staff to module:', error);
    return res.status(500).json({ message: 'Failed to assign staff to module' });
  } finally {
    if (client) client.release();
  }
};

/**
 * Get staff assigned to a module
 */
export const getModuleStaff = async (req: Request, res: Response) => {
  let client = null;
  
  try {
    const { moduleId } = req.params;
    
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
    
    const adminEmail = userResult.rows[0].email;
    
    // Find department schema
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [adminEmail]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Check if module exists
    const checkModuleQuery = `
      SELECT module_id, code, title FROM ${schema_prefix}.modules
      WHERE module_id = $1
    `;
    
    const moduleCheckResult = await client.query(checkModuleQuery, [moduleId]);
    
    if (moduleCheckResult.rowCount === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    const module = moduleCheckResult.rows[0];
    
    // Get staff assigned to this module
    const query = `
      SELECT 
        ms.id as assignment_id,
        s.user_id as id,
        up.first_name as "firstName",
        up.last_name as "lastName",
        s.staff_number as "staffId",
        s.title as position,
        s.university_email as "universityEmail",
        ms.role
      FROM ${schema_prefix}.module_staff ms
      JOIN ${schema_prefix}.staff s ON ms.staff_id = s.user_id
      JOIN ${schema_prefix}.user_profiles up ON s.user_id = up.user_id
      WHERE ms.module_id = $1
      ORDER BY up.last_name, up.first_name
    `;
    
    const result = await client.query(query, [moduleId]);
    
    return res.status(200).json({
      module: {
        id: module.module_id,
        code: module.code,
        title: module.title
      },
      staff: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching module staff:', error);
    return res.status(500).json({ message: 'Failed to retrieve module staff' });
  } finally {
    if (client) client.release();
  }
};

/**
 * Remove staff from a module
 */
export const removeStaffFromModule = async (req: Request, res: Response) => {
  let client = null;
  
  try {
    const { moduleId, staffId } = req.params;
    
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
    
    const adminEmail = userResult.rows[0].email;
    
    // Find department schema
    const mapResult = await centralPool.query(
      `SELECT d.dept_id, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [adminEmail]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection
    const deptPool = await getDepartmentPool(schema_prefix);
    client = await deptPool.connect();
    
    // Delete the assignment
    const query = `
      DELETE FROM ${schema_prefix}.module_staff
      WHERE module_id = $1 AND staff_id = $2
      RETURNING id
    `;
    
    const result = await client.query(query, [moduleId, staffId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Staff assignment not found' });
    }
    
    return res.status(200).json({
      message: 'Staff member removed from module successfully'
    });
    
  } catch (error) {
    console.error('Error removing staff from module:', error);
    return res.status(500).json({ message: 'Failed to remove staff from module' });
  } finally {
    if (client) client.release();
  }
};