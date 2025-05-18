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

// Get all available modules that a student can enroll in
export const getAvailableModules = async (req: Request, res: Response) => {
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
    
    // Find student's department using email
    const mapResult = await pool.query(
      `SELECT uim.dept_id, uim.local_user_id, d.schema_prefix 
       FROM central.user_id_map uim
       JOIN central.departments d ON uim.dept_id = d.dept_id
       WHERE uim.university_email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Student not found in any department' });
    }
    
    const { local_user_id, schema_prefix, dept_id } = mapResult.rows[0];
    
    // Get department name
    const deptResult = await pool.query(
      `SELECT name FROM central.departments WHERE dept_id = $1`,
      [dept_id]
    );
    
    if (!deptResult.rowCount) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    const deptName = deptResult.rows[0].name;
    // Use first 5 chars of department name lowercase as code (cs, math, etc.)
    const deptCode = deptName.substring(0, 5).toLowerCase();
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // STEP 1: Get all local modules from the student's department
    const localModulesResult = await deptPool.query(`
      SELECT 
        m.module_id::text as id,
        m.title,
        m.code,
        m.credits,
        m.semester_id as semesterId,
        '${deptCode}' as departmentCode,
        ${dept_id} as departmentId,
        '${deptName}' as departmentName,
        false as isGlobalModule,
        CASE 
          WHEN e.enrollment_id IS NULL THEN false
          ELSE true
        END as isEnrolled,
        CASE
          WHEN er.request_id IS NULL THEN false
          ELSE true
        END as isPending
      FROM ${schema_prefix}.modules m
      LEFT JOIN ${schema_prefix}.enrollments e ON m.module_id = e.module_id AND e.student_id = $1
      LEFT JOIN ${schema_prefix}.enrollment_requests er ON m.module_id = er.module_id AND er.student_id = $1 AND er.status = 'pending'
      WHERE m.is_active = true
      ORDER BY m.code ASC
    `, [local_user_id]);
    
    // STEP 2: Get global modules from other departments using the central database view
    // Get global modules from the central view that matches the schema in docker/global-FDW/03-global-modules-view.sql
    // The global_modules view already filters for is_global=TRUE in its definition
    const globalModulesResult = await pool.query(`
      SELECT 
        gm.module_id::text as id,
        gm.title,
        gm.code,
        gm.credits,
        gm.semester_id as semesterId,
        gm.department_code as departmentCode,
        gm.dept_id as departmentId,
        gm.department_name as departmentName,
        gm.global_module_id,
        true as isGlobalModule,
        false as isEnrolled,
        false as isPending
      FROM central.global_modules gm
      WHERE gm.dept_id != $1
      ORDER BY gm.code ASC
    `, [dept_id]);
    
    let globalModules = globalModulesResult.rows;
    
    // STEP 3: Check if student has already requested these global modules
    if (globalModules.length > 0) {
      try {
        // Check if the student has pending external enrollment requests
        const pendingExternalRequestsResult = await deptPool.query(`
          SELECT target_module_id::text as module_id, target_dept_id
          FROM ${schema_prefix}.external_module_requests
          WHERE student_id = $1 AND status = 'pending'
        `, [local_user_id]);
        
        if (pendingExternalRequestsResult.rowCount && pendingExternalRequestsResult.rows.length > 0) {
          const pendingRequests = pendingExternalRequestsResult.rows;
          
          // Mark global modules as pending if there's a request
          globalModules = globalModules.map(module => {
            // Check if this module has a pending request
            const isPending = pendingRequests.some(req => 
              parseInt(req.target_dept_id) === parseInt(module.departmentId) && 
              req.module_id === module.id
            );
            
            return {
              ...module,
              isPending
            };
          });
        }
      } catch (error) {
        console.error('Error checking pending external requests:', error);
        // If there's an error, just continue without marking any as pending
        globalModules = globalModules.map(module => ({
          ...module,
          isPending: false
        }));
      }
    }
    
    // Process local modules to add globalModuleId (to unify UI handling)
    const localModules = localModulesResult.rows.map(module => ({
      ...module,
      globalModuleId: `${module.id}-${module.departmentId}`  // Fake global ID for local modules
    }));

    // Process global modules to include globalModuleId
    const processedGlobalModules = globalModules.map(module => ({
      ...module,
      globalModuleId: module.global_module_id  // Use the global_module_id from the view
    }));
    
    // STEP 4: Combine local and global modules
    const allModules = [
      ...localModules,
      ...processedGlobalModules // Using the processed globalModules with pending status and globalModuleId
    ];
    
    return res.status(200).json({
      modules: allModules,
      departmentCode: deptCode,
      departmentId: dept_id
    });
  } catch (error) {
    console.error('Error fetching available modules:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Submit an enrollment request for a module
export const requestEnrollment = async (req: Request, res: Response) => {
  try {
    const { moduleId, departmentId, isGlobalModule, reason } = req.body;
    
    if (!moduleId) {
      return res.status(400).json({ message: 'Module ID is required' });
    }
    
    // Cast req.user to our interface
    const user = req.user as AuthUser;
    
    // Get student email
    let email = user?.email;
    
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
    
    // Find student's department using email
    const mapResult = await pool.query(
      `SELECT uim.dept_id, uim.local_user_id, d.schema_prefix 
       FROM central.user_id_map uim
       JOIN central.departments d ON uim.dept_id = d.dept_id
       WHERE uim.university_email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Student not found in any department' });
    }
    
    const { local_user_id, schema_prefix, dept_id } = mapResult.rows[0];
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // CROSS-DEPARTMENT ENROLLMENT: Handle global module enrollment request
    if (isGlobalModule && departmentId && parseInt(departmentId) !== parseInt(dept_id)) {
      // Verify the module exists in the global modules view
      // The global_modules view already filters for is_global=TRUE and is_active=TRUE
      const moduleCheckResult = await pool.query(`
        SELECT * FROM central.global_modules
        WHERE module_id = $1 AND dept_id = $2
      `, [moduleId, departmentId]);
      
      if (!moduleCheckResult.rowCount || moduleCheckResult.rowCount === 0) {
        return res.status(404).json({ message: 'Global module not found or is not available for cross-department enrollment' });
      }
      
      const moduleDetails = moduleCheckResult.rows[0];
      
      try {
        // Check if this student already has a pending request for this module
        const pendingCheckResult = await deptPool.query(`
          SELECT request_id 
          FROM ${schema_prefix}.external_module_requests 
          WHERE student_id = $1 AND target_module_id = $2 AND target_dept_id = $3 AND status = 'pending'
        `, [local_user_id, moduleId, departmentId]);
        
        if (pendingCheckResult.rowCount && pendingCheckResult.rowCount > 0) {
          return res.status(400).json({ message: 'You already have a pending request for this module' });
        }
        
        // Check if student is already enrolled in a module with the same ID in their own department
        // This is important because module IDs can be the same across different departments
        const enrollmentCheckResult = await deptPool.query(`
          SELECT e.enrollment_id 
          FROM ${schema_prefix}.enrollments e
          JOIN ${schema_prefix}.modules m ON e.module_id = m.module_id
          WHERE e.student_id = $1 AND m.module_id = $2
        `, [local_user_id, moduleId]);
        
        if (enrollmentCheckResult.rowCount && enrollmentCheckResult.rowCount > 0) {
          // Get the module code to provide a clearer error message
          const localModuleResult = await deptPool.query(`
            SELECT code, title FROM ${schema_prefix}.modules WHERE module_id = $1
          `, [moduleId]);
          
          const targetModuleResult = await pool.query(`
            SELECT code, title FROM central.global_modules WHERE module_id = $1 AND dept_id = $2
          `, [moduleId, departmentId]);
          
          // TypeScript safety check for rowCount properties
          const hasLocalModule = localModuleResult && localModuleResult.rowCount && localModuleResult.rowCount > 0;
          const hasTargetModule = targetModuleResult && targetModuleResult.rowCount && targetModuleResult.rowCount > 0;
          
          if (hasLocalModule && hasTargetModule) {
            const localModule = localModuleResult.rows[0];
            const targetModule = targetModuleResult.rows[0];
            
            return res.status(400).json({ 
              message: `You are already enrolled in ${localModule.code} (${localModule.title}) which has the same internal ID as ${targetModule.code} (${targetModule.title}). Please contact an administrator for assistance.`
            });
          } else {
            return res.status(400).json({ 
              message: `You are already enrolled in a module with the same internal ID. This appears to be a system conflict. Please contact an administrator.`
            });
          }
        }
        
        // Submit the external module request to student's home department schema
        const externalRequestResult = await deptPool.query(`
          INSERT INTO ${schema_prefix}.external_module_requests
            (student_id, target_module_id, target_dept_id, reason, request_date, status)
          VALUES
            ($1, $2, $3, $4, NOW(), 'pending')
          RETURNING request_id
        `, [local_user_id, moduleId, departmentId, reason]);
        
        if (externalRequestResult.rowCount && externalRequestResult.rows.length > 0) {
          return res.status(201).json({
            message: `Your request to enroll in ${moduleDetails.title} (${moduleDetails.code}) from the ${moduleDetails.department_name} department has been submitted successfully.`,
            requestId: externalRequestResult.rows[0].request_id,
            isGlobalModule: true,
            departmentCode: moduleDetails.department_code,
            moduleCode: moduleDetails.code // Include module code in response
          });
        } else {
          throw new Error('Failed to insert external module request');
        }
      } catch (error) {
        console.error('Error processing cross-department enrollment request:', error);
        return res.status(500).json({ message: 'An error occurred while processing your cross-department enrollment request' });
      }
    }
    
    // SAME-DEPARTMENT ENROLLMENT: Handle regular module enrollment within student's own department
    
    // Check if student is already enrolled in this module
    const enrollmentCheck = await deptPool.query(`
      SELECT enrollment_id 
      FROM ${schema_prefix}.enrollments 
      WHERE student_id = $1 AND module_id = $2
    `, [local_user_id, moduleId]);
    
    if (enrollmentCheck.rowCount && enrollmentCheck.rowCount > 0) {
      return res.status(400).json({ message: 'You are already enrolled in this module' });
    }
    
    // Check if student already has a pending request for this module
    const pendingRequestCheck = await deptPool.query(`
      SELECT request_id 
      FROM ${schema_prefix}.enrollment_requests 
      WHERE student_id = $1 AND module_id = $2 AND status = 'pending'
    `, [local_user_id, moduleId]);
    
    if (pendingRequestCheck.rowCount && pendingRequestCheck.rowCount > 0) {
      return res.status(400).json({ message: 'You already have a pending request for this module' });
    }
    
    // Check if module exists and is active
    const moduleCheck = await deptPool.query(`
      SELECT * 
      FROM ${schema_prefix}.modules 
      WHERE module_id = $1 AND is_active = true
    `, [moduleId]);
    
    if (!moduleCheck.rowCount || moduleCheck.rowCount === 0) {
      return res.status(404).json({ message: 'Module not found or is not active' });
    }
    
    // Insert the enrollment request
    const moduleDetails = moduleCheck.rows[0];
    const requestResult = await deptPool.query(`
      INSERT INTO ${schema_prefix}.enrollment_requests
        (student_id, module_id, reason, request_date, status)
      VALUES
        ($1, $2, $3, NOW(), 'pending')
      RETURNING request_id
    `, [local_user_id, moduleId, reason]);
    
    if (requestResult.rowCount && requestResult.rows.length > 0) {
      return res.status(201).json({
        message: `Your request to enroll in ${moduleDetails.title} (${moduleDetails.code}) has been submitted successfully.`,
        requestId: requestResult.rows[0].request_id,
        isGlobalModule: false
      });
    } else {
      throw new Error('Failed to insert enrollment request');
    }
  } catch (error) {
    console.error('Error submitting enrollment request:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all enrollment requests for a student
export const getEnrollmentRequests = async (req: Request, res: Response) => {
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
    
    // Find student's department using email
    const mapResult = await pool.query(
      `SELECT uim.dept_id, uim.local_user_id, d.schema_prefix 
       FROM central.user_id_map uim
       JOIN central.departments d ON uim.dept_id = d.dept_id
       WHERE uim.university_email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Student not found in any department' });
    }
    
    const { local_user_id, schema_prefix, dept_id } = mapResult.rows[0];
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // STEP 1: Get all local enrollment requests for this student
    const localRequestsResult = await deptPool.query(`
      SELECT 
        er.request_id::text as id,
        m.module_id::text as moduleId,
        m.title as moduleTitle,
        m.code as moduleCode,
        er.reason,
        er.request_date as requestDate,
        er.status,
        er.review_date as reviewDate,
        er.reviewer_notes as reviewerNotes,
        false as isGlobalModule,
        null as departmentCode
      FROM ${schema_prefix}.enrollment_requests er
      JOIN ${schema_prefix}.modules m ON er.module_id = m.module_id
      WHERE er.student_id = $1
      ORDER BY er.request_date DESC
    `, [local_user_id]);
    
    // STEP 2: Get all external (global) module enrollment requests for this student
    const externalRequestsResult = await deptPool.query(`
      SELECT 
        er.request_id::text as id,
        er.target_module_id::text as moduleId,
        er.target_dept_id as departmentId,
        er.reason,
        er.request_date as requestDate,
        er.status,
        er.response_date as reviewDate,
        er.response_notes as reviewerNotes,
        true as isGlobalModule
      FROM ${schema_prefix}.external_module_requests er
      WHERE er.student_id = $1
      ORDER BY er.request_date DESC
    `, [local_user_id]);
    
    // STEP 3: Fetch additional details about global modules from the central database
    const externalRequests: Array<any> = [];
    
    if (externalRequestsResult.rowCount && externalRequestsResult.rows.length > 0) {
      // Create a map of dept_id -> [module_ids] for efficient querying
      const deptModuleMap = new Map<number, string[]>();
      
      externalRequestsResult.rows.forEach(request => {
        const deptId = request.departmentId;
        if (!deptModuleMap.has(deptId)) {
          deptModuleMap.set(deptId, []);
        }
        deptModuleMap.get(deptId)?.push(request.moduleId);
      });
      
      // For each department, get the module details via the global_modules view
      for (const [deptId, moduleIds] of deptModuleMap.entries()) {
        // Get department code
        const deptResult = await pool.query(
          `SELECT code FROM central.departments WHERE dept_id = $1`,
          [deptId]
        );
        
        if (deptResult.rowCount && deptResult.rowCount > 0) {
          const deptCode = deptResult.rows[0].code;
          
          // Get module details from central.global_modules view
          const placeholders = moduleIds.map((_, i) => `$${i + 2}`).join(',');
          const moduleDetailsQuery = `
            SELECT 
              module_id::text as moduleId,
              title as moduleTitle,
              code as moduleCode,
              department_code as departmentCode,
              global_module_id as globalModuleId
            FROM central.global_modules 
            WHERE dept_id = $1 AND module_id IN (${placeholders})
          `;
          
          const moduleDetailsResult = await pool.query(
            moduleDetailsQuery,
            [deptId, ...moduleIds]
          );
          
          // Create a map for quick lookup of module details
          const moduleDetailsMap = new Map();
          if (moduleDetailsResult.rowCount && moduleDetailsResult.rows.length > 0) {
            moduleDetailsResult.rows.forEach(module => {
              moduleDetailsMap.set(module.moduleId, module);
            });
          }
          
          // Enrich the external requests with module details
          externalRequestsResult.rows.forEach(request => {
            if (request.departmentId === deptId) {
              const moduleDetails = moduleDetailsMap.get(request.moduleId) || {
                moduleTitle: 'Unknown Module',
                moduleCode: 'Unknown Code',
                departmentCode: deptCode
              };
              
              externalRequests.push({
                ...request,
                moduleTitle: moduleDetails.moduleTitle,
                moduleCode: moduleDetails.moduleCode,
                departmentCode: moduleDetails.departmentCode || deptCode,
                globalModuleId: moduleDetails.globalModuleId || `${request.moduleId}-${request.departmentId}`
              });
            }
          });
        }
      }
    }
    
    // STEP 4: Combine local and external requests
    const allRequests = [
      ...localRequestsResult.rows,
      ...externalRequests
    ];
    
    // Sort by request date descending
    allRequests.sort((a, b) => {
      return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
    });
    
    return res.status(200).json({
      requests: allRequests
    });
  } catch (error) {
    console.error('Error fetching enrollment requests:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
