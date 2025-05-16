// src/controllers/centralAdmin/reportsController.ts
import { Request, Response, NextFunction } from 'express';
import { pool as centralPool } from '../../db';

/**
 * Get all students from all departments using the centralized view
 */
export const getStudentDirectory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user ID from JWT token to verify central admin role
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Verify the user has central admin role
    const roleCheck = await centralPool.query(
      `SELECT r.name FROM central.user_roles ur
       JOIN central.roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = $1 AND r.name = 'central_admin'`,
      [userId]
    );
    
    if (roleCheck.rowCount === 0) {
      return res.status(403).json({ message: 'Access denied: Central admin role required' });
    }
    
    // Query the centralized FDW view
    const result = await centralPool.query('SELECT * FROM central.student_directory');
    
    // Return the data
    return res.status(200).json(result.rows);
    
  } catch (error: any) {
    console.error('Error fetching student directory:', error);
    return res.status(500).json({ 
      message: 'Failed to retrieve student directory',
      detail: error.message
    });
  }
};

/**
 * Get all module enrollments from all departments using the centralized view
 */
export const getModuleEnrollments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user ID from JWT token to verify central admin role
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Verify the user has central admin role
    const roleCheck = await centralPool.query(
      `SELECT r.name FROM central.user_roles ur
       JOIN central.roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = $1 AND r.name = 'central_admin'`,
      [userId]
    );
    
    if (roleCheck.rowCount === 0) {
      return res.status(403).json({ message: 'Access denied: Central admin role required' });
    }
    
    // Query the centralized FDW view
    const result = await centralPool.query('SELECT * FROM central.module_enrollments');
    
    // Return the data
    return res.status(200).json(result.rows);
    
  } catch (error: any) {
    console.error('Error fetching module enrollments:', error);
    return res.status(500).json({ 
      message: 'Failed to retrieve module enrollments',
      detail: error.message
    });
  }
};

/**
 * Get all grades from all departments using the centralized view
 */
export const getGradesOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user ID from JWT token to verify central admin role
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Verify the user has central admin role
    const roleCheck = await centralPool.query(
      `SELECT r.name FROM central.user_roles ur
       JOIN central.roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = $1 AND r.name = 'central_admin'`,
      [userId]
    );
    
    if (roleCheck.rowCount === 0) {
      return res.status(403).json({ message: 'Access denied: Central admin role required' });
    }
    
    // Query the centralized FDW view
    const result = await centralPool.query('SELECT * FROM central.grades_overview');
    
    // Return the data
    return res.status(200).json(result.rows);
    
  } catch (error: any) {
    console.error('Error fetching grades overview:', error);
    return res.status(500).json({ 
      message: 'Failed to retrieve grades overview',
      detail: error.message
    });
  }
};

/**
 * Get all staff from all departments using the centralized view
 */
export const getStaffDirectory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user ID from JWT token to verify central admin role
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Verify the user has central admin role
    const roleCheck = await centralPool.query(
      `SELECT r.name FROM central.user_roles ur
       JOIN central.roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = $1 AND r.name = 'central_admin'`,
      [userId]
    );
    
    if (roleCheck.rowCount === 0) {
      return res.status(403).json({ message: 'Access denied: Central admin role required' });
    }
    
    // Query the centralized FDW view
    const result = await centralPool.query('SELECT * FROM central.staff_directory');
    
    // Return the data
    return res.status(200).json(result.rows);
    
  } catch (error: any) {
    console.error('Error fetching staff directory:', error);
    return res.status(500).json({ 
      message: 'Failed to retrieve staff directory',
      detail: error.message
    });
  }
};

/**
 * Get all exams from all departments using the centralized view
 */
export const getExamSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user ID from JWT token to verify central admin role
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not available' });
    }
    
    // Verify the user has central admin role
    const roleCheck = await centralPool.query(
      `SELECT r.name FROM central.user_roles ur
       JOIN central.roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = $1 AND r.name = 'central_admin'`,
      [userId]
    );
    
    if (roleCheck.rowCount === 0) {
      return res.status(403).json({ message: 'Access denied: Central admin role required' });
    }
    
    // Query the centralized FDW view
    const result = await centralPool.query('SELECT * FROM central.exam_schedule');
    
    // Return the data
    return res.status(200).json(result.rows);
    
  } catch (error: any) {
    console.error('Error fetching exam schedule:', error);
    return res.status(500).json({ 
      message: 'Failed to retrieve exam schedule',
      detail: error.message
    });
  }
};
