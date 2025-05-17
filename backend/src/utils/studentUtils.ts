// studentUtils.ts - Utility functions for student management
import { Pool, PoolClient } from 'pg';

// Type to handle both Pool and PoolClient
type DbConnection = Pool | PoolClient;

/**
 * Generate a unique student number based on department code and current year
 * Format: CS20240001 (Department code + Year + Sequential number)
 */
export const generateStudentNumber = async (deptCode: string, pool: DbConnection): Promise<string> => {
  const currentYear = new Date().getFullYear();
  
  try {
    // Find the highest student number for this department and year
    // Extract schema prefix from pool if it's a connection object
    let schemaPrefix = '';
    
    // If it's a PoolClient object from a transaction, we need to determine the schema
    // We can determine it from the department code, assuming format is consistent
    schemaPrefix = deptCode.toLowerCase() + '_schema';
    
    const query = `
      SELECT student_number 
      FROM ${schemaPrefix}.students 
      WHERE student_number LIKE $1 
      ORDER BY student_number DESC 
      LIMIT 1
    `;
    
    const prefix = `${deptCode}${currentYear}`;
    const result = await pool.query(query, [`${prefix}%`]);
    
    let sequenceNumber = 1;
    
    // Check if result.rowCount is not null or undefined and greater than 0
    if (result.rowCount && result.rowCount > 0) {
      // Extract the sequence number from the last student number
      const lastStudentNumber = result.rows[0].student_number;
      const lastSequence = parseInt(lastStudentNumber.substring(prefix.length), 10);
      sequenceNumber = lastSequence + 1;
    }
    
    // Format the sequence number with leading zeros (4 digits)
    const formattedSequence = sequenceNumber.toString().padStart(4, '0');
    return `${prefix}${formattedSequence}`;
  } catch (error) {
    console.error('Error generating student number:', error);
    throw new Error('Failed to generate student number');
  }
};

/**
 * Generate a unique university email based on student name and department
 * Format: firstname.lastname@{DEPT_CODE}.university.ac.uk
 * If a conflict exists, append a number
 */
export const generateUniversityEmail = async (
  firstName: string, 
  lastName: string, 
  deptCode: string, 
  pool: DbConnection
): Promise<string> => {
  try {
    // Normalize names - lowercase, remove spaces and special characters
    const normalizedFirst = firstName.toLowerCase().trim().replace(/[^\w]/g, '');
    const normalizedLast = lastName.toLowerCase().trim().replace(/[^\w]/g, '');
    
    // Base email without the counter
    const baseEmail = `${normalizedFirst}.${normalizedLast}@${deptCode.toLowerCase()}.university.ac.uk`;
    
    // Check if the base email already exists
    // Extract schema prefix from department code for consistency
    let schemaPrefix = deptCode.toLowerCase() + '_schema';
    
    const query = `
      SELECT university_email 
      FROM ${schemaPrefix}.students 
      WHERE university_email = $1
      UNION
      SELECT university_email 
      FROM ${schemaPrefix}.staff 
      WHERE university_email = $1
    `;
    
    const result = await pool.query(query, [baseEmail]);
    
    // If no conflict, return the base email (safely check for rowCount)
    if (!result.rowCount || result.rowCount === 0) {
      return baseEmail;
    }
    
    // If there's a conflict, try appending numbers until we find a unique one
    let counter = 2;
    let candidateEmail = '';
    
    // We'll reuse the same query with the schema prefix from above
    while (true) {
      candidateEmail = `${normalizedFirst}.${normalizedLast}${counter}@${deptCode.toLowerCase()}.university.ac.uk`;
      
      const checkResult = await pool.query(query, [candidateEmail]);
      
      // Safely check for rowCount
      if (!checkResult.rowCount || checkResult.rowCount === 0) {
        return candidateEmail;
      }
      
      counter++;
      
      // Safety check to prevent infinite loops
      if (counter > 100) {
        throw new Error('Unable to generate a unique email after 100 attempts');
      }
    }
  } catch (error) {
    console.error('Error generating university email:', error);
    throw new Error('Failed to generate university email');
  }
};
