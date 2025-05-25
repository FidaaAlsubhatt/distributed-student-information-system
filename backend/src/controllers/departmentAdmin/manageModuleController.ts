import { Request, Response } from 'express';
import { pool, getDepartmentPool } from '../../db';

// Define the user type as expected from JWT token
interface AuthUser {
  userId: number;
  role: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * Get all modules in the department
 * Department admins can see all modules regardless of who teaches them
 */
export const getDepartmentModules = async (req: Request, res: Response) => {
  try {
    // Cast req.user to our interface
    const user = req.user as AuthUser;
    
    // Try to get email from JWT payload or query param
    let email = user?.email;
    
    // If not available in token, try to get user from database
    if (!email) {
      // Get user details from DB using userId 
      const userResult = await pool.query(
        'SELECT email FROM central.users WHERE user_id = $1',
        [user?.userId]
      );
      
      if (userResult.rows.length > 0) {
        email = userResult.rows[0].email;
      } else {
        return res.status(400).json({ message: 'User email not available' });
      }
    }
    
    // Find department admin's department using email
    const mapResult = await pool.query(
      `SELECT d.dept_id, d.name as dept_name, d.schema_prefix 
       FROM central.user_department ud
       JOIN central.departments d ON ud.dept_id = d.dept_id
       JOIN central.users u ON ud.user_id = u.user_id
       WHERE u.email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Department admin not found or not assigned to any department' });
    }
    
    const { dept_id, dept_name, schema_prefix } = mapResult.rows[0];
    
    // Get department-specific database connection with proper error handling
    let deptPool;
    try {
      deptPool = await getDepartmentPool(schema_prefix);
      console.log(`Connected to ${schema_prefix} database successfully for department modules`);
    } catch (error) {
      console.error(`Failed to connect to ${schema_prefix} database:`, error);
      return res.status(503).json({ message: `${schema_prefix} database unavailable` });
    }
    
    // Get all modules in the department (not just for a specific staff member)
    const modulesResult = await deptPool.query(`
      SELECT 
        m.module_id::text, 
        m.code,
        m.title,
        COALESCE(m.description, 'Module description not available') as description,
        COALESCE(m.credits, 15) as credits,
        s.name as semester,
        CONCAT(EXTRACT(YEAR FROM s.start_date), '-', EXTRACT(YEAR FROM s.end_date)) as academic_year,
        m.is_active,
        CASE 
          WHEN m.is_active = true THEN 'active'
          ELSE 'inactive'
        END as status,
        COUNT(e.enrollment_id) as enrolled_students,
        m.capacity,
        ARRAY_AGG(DISTINCT CONCAT(st.title, ' ', up.first_name, ' ', up.last_name)) as instructors,
        ARRAY_AGG(DISTINCT ms.staff_id::text) as staff_ids,
        ARRAY_AGG(DISTINCT ms.role) as staff_roles
      FROM ${schema_prefix}.modules m
      JOIN ${schema_prefix}.semesters s ON m.semester_id = s.semester_id
      LEFT JOIN ${schema_prefix}.enrollments e ON m.module_id = e.module_id
      LEFT JOIN ${schema_prefix}.module_staff ms ON m.module_id = ms.module_id
      LEFT JOIN ${schema_prefix}.staff st ON ms.staff_id = st.user_id
      LEFT JOIN ${schema_prefix}.user_profiles up ON st.user_id = up.user_id
      GROUP BY m.module_id, m.code, m.title, s.name, s.start_date, s.end_date, m.is_active, m.capacity
      ORDER BY s.start_date DESC
    `);
    
    console.log(`Found ${modulesResult.rows.length} modules in department ${dept_name}`);
    
    // Return modules with department information
    return res.status(200).json({
      modules: modulesResult.rows,
      department: {
        id: dept_id,
        name: dept_name,
        schema: schema_prefix
      }
    });
  } catch (error) {
    console.error('Error fetching department modules:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all staff in the department for assignment to modules
 */
export const getDepartmentStaff = async (req: Request, res: Response) => {
  try {
    // Cast req.user to our interface
    const user = req.user as AuthUser;
    
    // Get email from JWT or database
    let email = user?.email;
    if (!email) {
      const userResult = await pool.query(
        'SELECT email FROM central.users WHERE user_id = $1',
        [user?.userId]
      );
      
      if (userResult.rows.length > 0) {
        email = userResult.rows[0].email;
      } else {
        return res.status(400).json({ message: 'User email not available' });
      }
    }
    
    // Find department admin's department
    const mapResult = await pool.query(
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
    
    // Get all staff in the department
    const staffResult = await deptPool.query(`
      SELECT 
        s.user_id as id, 
        up.first_name as "firstName", 
        up.last_name as "lastName", 
        s.title as position,
        s.staff_number as "staffId",
        s.university_email as "universityEmail"
      FROM ${schema_prefix}.staff s
      JOIN ${schema_prefix}.user_profiles up ON s.user_id = up.user_id
      ORDER BY up.last_name, up.first_name
    `);
    
    const departmentResult = await pool.query(
      `SELECT name AS department_name FROM central.departments WHERE schema_prefix = $1`,
      [schema_prefix]
    );
    
    const department_name = departmentResult.rows.length > 0 ? departmentResult.rows[0].department_name : schema_prefix;
    
    return res.status(200).json({
      users: staffResult.rows,
      department: department_name
    });
  } catch (error) {
    console.error('Error fetching department staff:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new module in the department
 */
export const createModule = async (req: Request, res: Response) => {
  try {
    const { code, name, credits, description, semester, prerequisites, capacity } = req.body;
    const user = req.user as AuthUser;
    
    // Get email from JWT or database
    let email = user?.email;
    if (!email) {
      const userResult = await pool.query(
        'SELECT email FROM central.users WHERE user_id = $1',
        [user?.userId]
      );
      
      if (userResult.rows.length > 0) {
        email = userResult.rows[0].email;
      } else {
        return res.status(400).json({ message: 'User email not available' });
      }
    }
    
    // Find department admin's department
    const mapResult = await pool.query(
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
    
    // Find semester ID based on the semester name
    const semesterResult = await deptPool.query(
      `SELECT semester_id FROM ${schema_prefix}.semesters WHERE name = $1`,
      [semester]
    );
    
    if (!semesterResult.rowCount) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    const semesterId = semesterResult.rows[0].semester_id;
    
    // Create the module
    const moduleResult = await deptPool.query(
      `INSERT INTO ${schema_prefix}.modules 
        (code, title, description, credits, semester_id, prerequisites, capacity, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, true) 
       RETURNING *`,
      [code, name, description, credits, semesterId, prerequisites, capacity || 100]
    );
    
    const newModule = moduleResult.rows[0];
    
    return res.status(201).json({
      message: 'Module created successfully',
      module: {
        ...newModule,
        module_id: newModule.module_id.toString()
      }
    });
  } catch (error) {
    console.error('Error creating module:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update an existing module in the department
 */
export const updateModule = async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { code, name, credits, description, semester, prerequisites, capacity, isActive } = req.body;
    const user = req.user as AuthUser;
    
    // Get email from JWT or database
    let email = user?.email;
    if (!email) {
      const userResult = await pool.query(
        'SELECT email FROM central.users WHERE user_id = $1',
        [user?.userId]
      );
      
      if (userResult.rows.length > 0) {
        email = userResult.rows[0].email;
      } else {
        return res.status(400).json({ message: 'User email not available' });
      }
    }
    
    // Find department admin's department
    const mapResult = await pool.query(
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
    
    // Find semester ID based on the semester name if provided
    let semesterId;
    if (semester) {
      const semesterResult = await deptPool.query(
        `SELECT semester_id FROM ${schema_prefix}.semesters WHERE name = $1`,
        [semester]
      );
      
      if (!semesterResult.rowCount) {
        return res.status(404).json({ message: 'Semester not found' });
      }
      
      semesterId = semesterResult.rows[0].semester_id;
    }
    
    // Build the update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];
    let valueIndex = 1;
    
    if (code !== undefined) {
      updateFields.push(`code = $${valueIndex}`);
      updateValues.push(code);
      valueIndex++;
    }
    
    if (name !== undefined) {
      updateFields.push(`title = $${valueIndex}`);
      updateValues.push(name);
      valueIndex++;
    }
    
    if (credits !== undefined) {
      updateFields.push(`credits = $${valueIndex}`);
      updateValues.push(credits);
      valueIndex++;
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${valueIndex}`);
      updateValues.push(description);
      valueIndex++;
    }
    
    if (semesterId !== undefined) {
      updateFields.push(`semester_id = $${valueIndex}`);
      updateValues.push(semesterId);
      valueIndex++;
    }
    
    if (prerequisites !== undefined) {
      updateFields.push(`prerequisites = $${valueIndex}`);
      updateValues.push(prerequisites);
      valueIndex++;
    }
    
    if (capacity !== undefined) {
      updateFields.push(`capacity = $${valueIndex}`);
      updateValues.push(capacity);
      valueIndex++;
    }
    
    if (isActive !== undefined) {
      updateFields.push(`is_active = $${valueIndex}`);
      updateValues.push(isActive);
      valueIndex++;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    // Add the module ID to the values array
    updateValues.push(moduleId);
    
    // Construct and execute the update query
    const updateQuery = `
      UPDATE ${schema_prefix}.modules 
      SET ${updateFields.join(', ')} 
      WHERE module_id = $${valueIndex} 
      RETURNING *
    `;
    
    const updateResult = await deptPool.query(updateQuery, updateValues);
    
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    return res.status(200).json({
      message: 'Module updated successfully',
      module: {
        ...updateResult.rows[0],
        module_id: updateResult.rows[0].module_id.toString()
      }
    });
  } catch (error) {
    console.error('Error updating module:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a module or mark it as inactive
 */
export const deleteModule = async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const user = req.user as AuthUser;
    
    // Get email from JWT or database
    let email = user?.email;
    if (!email) {
      const userResult = await pool.query(
        'SELECT email FROM central.users WHERE user_id = $1',
        [user?.userId]
      );
      
      if (userResult.rows.length > 0) {
        email = userResult.rows[0].email;
      } else {
        return res.status(400).json({ message: 'User email not available' });
      }
    }
    
    // Find department admin's department
    const mapResult = await pool.query(
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
    
    // Check if there are any enrollments for this module
    const enrollmentCheck = await deptPool.query(
      `SELECT COUNT(*) FROM ${schema_prefix}.enrollments WHERE module_id = $1`,
      [moduleId]
    );
    
    if (parseInt(enrollmentCheck.rows[0].count) > 0) {
      // Instead of deleting, just mark as inactive
      const inactiveResult = await deptPool.query(
        `UPDATE ${schema_prefix}.modules SET is_active = false WHERE module_id = $1 RETURNING *`,
        [moduleId]
      );
      
      if (inactiveResult.rowCount === 0) {
        return res.status(404).json({ message: 'Module not found' });
      }
      
      return res.status(200).json({
        message: 'Module marked as inactive due to existing enrollments',
        module: inactiveResult.rows[0]
      });
    }
    
    // If no enrollments, delete the module and its associations
    await deptPool.query(
      `DELETE FROM ${schema_prefix}.module_staff WHERE module_id = $1`,
      [moduleId]
    );
    
    const deleteResult = await deptPool.query(
      `DELETE FROM ${schema_prefix}.modules WHERE module_id = $1 RETURNING *`,
      [moduleId]
    );
    
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    return res.status(200).json({
      message: 'Module deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting module:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Assign staff to a module
 */
export const assignStaffToModule = async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { staffId, role } = req.body;
    const user = req.user as AuthUser;
    
    if (!staffId || !role) {
      return res.status(400).json({ message: 'Staff ID and role are required' });
    }
    
    // Get email from JWT or database
    let email = user?.email;
    if (!email) {
      const userResult = await pool.query(
        'SELECT email FROM central.users WHERE user_id = $1',
        [user?.userId]
      );
      
      if (userResult.rows.length > 0) {
        email = userResult.rows[0].email;
      } else {
        return res.status(400).json({ message: 'User email not available' });
      }
    }
    
    // Find department admin's department
    const mapResult = await pool.query(
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
    
    // Check if module exists
    const moduleResult = await deptPool.query(
      `SELECT * FROM ${schema_prefix}.modules WHERE module_id = $1`,
      [moduleId]
    );
    
    if (!moduleResult.rowCount) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Check if staff exists
    const staffResult = await deptPool.query(
      `SELECT * FROM ${schema_prefix}.staff WHERE user_id = $1`,
      [staffId]
    );
    
    if (!staffResult.rowCount) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    
    // Check if the staff is already assigned to this module
    const existingAssignment = await deptPool.query(
      `SELECT * FROM ${schema_prefix}.module_staff WHERE module_id = $1 AND staff_id = $2`,
      [moduleId, staffId]
    );
    
    if (existingAssignment.rowCount && existingAssignment.rowCount > 0) {
      // Update the existing assignment
      const updateResult = await deptPool.query(
        `UPDATE ${schema_prefix}.module_staff SET role = $1 WHERE module_id = $2 AND staff_id = $3 RETURNING *`,
        [role, moduleId, staffId]
      );
      
      return res.status(200).json({
        message: 'Staff role updated for module',
        assignment: updateResult.rows[0]
      });
    }
    
    // Assign the staff to the module
    const assignResult = await deptPool.query(
      `INSERT INTO ${schema_prefix}.module_staff (module_id, staff_id, role) VALUES ($1, $2, $3) RETURNING *`,
      [moduleId, staffId, role]
    );
    
    return res.status(201).json({
      message: 'Staff assigned to module successfully',
      assignment: assignResult.rows[0]
    });
  } catch (error) {
    console.error('Error assigning staff to module:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Remove staff from a module
 */
export const removeStaffFromModule = async (req: Request, res: Response) => {
  try {
    const { moduleId, staffId } = req.params;
    const user = req.user as AuthUser;
    
    // Get email from JWT or database
    let email = user?.email;
    if (!email) {
      const userResult = await pool.query(
        'SELECT email FROM central.users WHERE user_id = $1',
        [user?.userId]
      );
      
      if (userResult.rows.length > 0) {
        email = userResult.rows[0].email;
      } else {
        return res.status(400).json({ message: 'User email not available' });
      }
    }
    
    // Find department admin's department
    const mapResult = await pool.query(
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
    
    // Remove the staff from the module
    const removeResult = await deptPool.query(
      `DELETE FROM ${schema_prefix}.module_staff WHERE module_id = $1 AND staff_id = $2 RETURNING *`,
      [moduleId, staffId]
    );
    
    if (removeResult.rowCount === 0) {
      return res.status(404).json({ message: 'Staff not assigned to this module' });
    }
    
    return res.status(200).json({
      message: 'Staff removed from module successfully'
    });
  } catch (error) {
    console.error('Error removing staff from module:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
