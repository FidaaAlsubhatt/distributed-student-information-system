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

export const getStudentProfile = async (req: Request, res: Response) => {
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
      `SELECT uim.dept_id, uim.local_user_id, d.schema_prefix, d.name as department_name
       FROM central.user_id_map uim
       JOIN central.departments d ON uim.dept_id = d.dept_id
       WHERE uim.university_email = $1`,
      [email]
    );
    
    if (!mapResult.rowCount) {
      return res.status(404).json({ message: 'Student not found in any department' });
    }
    
    const { local_user_id, schema_prefix, department_name } = mapResult.rows[0];
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // Get complete student profile with UK terminology
    const profileResult = await deptPool.query(`
      SELECT 
        s.user_id,
        s.student_number,
        s.university_email,
        s.year,
        s.enroll_date,
        s.status,
        up.first_name,
        up.last_name,
        up.date_of_birth,
        up.gender,
        up.personal_email,
        up.phone,
        a.line1 as address_line1,
        a.line2 as address_line2,
        a.city,
        a.state as county,
        a.postal_code,
        a.country,
        n.name as nationality,
        nok.name as next_of_kin_name,
        nok.relation as next_of_kin_relation,
        nok.contact_number as next_of_kin_phone
      FROM ${schema_prefix}.students s
      JOIN ${schema_prefix}.user_profiles up ON s.user_id = up.user_id
      LEFT JOIN ${schema_prefix}.addresses a ON up.address_id = a.id
      LEFT JOIN ${schema_prefix}.nationalities n ON up.nationality_id = n.nationality_id
      LEFT JOIN ${schema_prefix}.next_of_kin nok ON s.user_id = nok.student_id
      WHERE s.user_id = $1
    `, [local_user_id]);
    
    if (!profileResult.rowCount) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    // Format the profile data for frontend
    const studentData = profileResult.rows[0];
    const formattedProfile = {
      id: studentData.user_id.toString(),
      name: `${studentData.first_name} ${studentData.last_name}`,
      username: studentData.student_number,
      email: studentData.university_email,
      personalEmail: studentData.personal_email,
      phone: studentData.phone || '',
      address: {
        line1: studentData.address_line1 || '',
        line2: studentData.address_line2 || '',
        city: studentData.city || '',
        county: studentData.county || '',
        postalCode: studentData.postal_code || '',
        country: studentData.country || 'United Kingdom',
      },
      dateOfBirth: studentData.date_of_birth,
      gender: studentData.gender,
      nationality: studentData.nationality,
      academicInfo: {
        studentNumber: studentData.student_number,
        department: department_name,
        year: studentData.year,
        enrollDate: studentData.enroll_date,
        status: studentData.status,
      },
      emergencyContact: {
        name: studentData.next_of_kin_name || '',
        relation: studentData.next_of_kin_relation || '',
        phone: studentData.next_of_kin_phone || '',
      },
      // Default avatar URL based on name initials - will be replaced with real avatars in future
      avatar: `https://ui-avatars.com/api/?name=${studentData.first_name}+${studentData.last_name}&background=random`
    };
    
    return res.status(200).json(formattedProfile);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateStudentProfile = async (req: Request, res: Response) => {
  try {
    // Cast req.user to our interface
    const user = req.user as AuthUser;
    const { 
      phone, 
      personalEmail,
      address 
    } = req.body;
    
    // Try to get email from JWT payload
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
    
    const { local_user_id, schema_prefix } = mapResult.rows[0];
    const deptPool = await getDepartmentPool(schema_prefix);
    
    // Get user profile
    const profileResult = await deptPool.query(
      `SELECT user_id, address_id FROM ${schema_prefix}.user_profiles WHERE user_id = $1`, 
      [local_user_id]
    );
    
    if (!profileResult.rowCount) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    
    const { address_id } = profileResult.rows[0];
    
    // Update user profile with allowed fields
    await deptPool.query(
      `UPDATE ${schema_prefix}.user_profiles 
       SET phone = $1, personal_email = $2
       WHERE user_id = $3`,
      [phone, personalEmail, local_user_id]
    );
    
    // Update address if provided
    if (address && address_id) {
      await deptPool.query(
        `UPDATE ${schema_prefix}.addresses
         SET line1 = $1, line2 = $2, city = $3, state = $4, postal_code = $5, country = $6
         WHERE id = $7`,
        [
          address.line1,
          address.line2, 
          address.city,
          address.county, 
          address.postalCode,
          address.country || 'United Kingdom',
          address_id
        ]
      );
    }
    
    return res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating student profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
