import axios from 'axios';

// Define user role type
export type UserRole = 'student' | 'academic_staff' | 'department_admin' | 'central_admin';

// Define admin type
export type AdminRole = 'central_admin' | 'department_admin';

// Define department role type
export interface DepartmentRole {
  id: number;
  name: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
}

// Define user data type
export interface UserData {
  id: string;
  userId?: string; // Added for compatibility with UserContext
  username?: string; // Added for compatibility with UserContext
  avatar?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  studentNumber?: string;
  yearOfStudy?: number;
  staffId?: string;
  position?: string;
  universityEmail?: string;
  departmentName?: string;
  roles?: { id: number; name: string; scope: string; }[]; // Added for compatibility with UserContext
  departmentRoles?: DepartmentRole[]; // Added for compatibility with UserContext
}

export interface StudentFormData {
  // Personal details
  firstName: string;
  lastName: string;
  personalEmail: string;
  gender: string;
  dateOfBirth: string;
  yearOfStudy: number;
  programId: string;
  nationalityId?: string;
  role: 'student';
  
  // Address
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  
  // Next of kin / emergency contact
  kinName: string;
  kinRelation: string;
  kinPhone: string;
  
  // Department info - used internally
  departmentId?: string;
}

export interface AcademicStaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'academic_staff';
  staffId: string;
  position: string;
  universityEmail: string;
  departmentId?: string;
}

// Define form data for admin users
export interface AdminFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: AdminRole;
  departmentId?: string;
}

export type CreateUserFormData = Partial<StudentFormData> & Partial<AcademicStaffFormData> & {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: string;
  departmentId?: string;
};

// Define API request function
const apiRequest = async <T>(
  method: string,
  url: string,
  data?: any,
  departmentCode?: string | null
): Promise<T> => {
  const authData = localStorage.getItem('auth');
  const token = authData ? JSON.parse(authData).token : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (departmentCode) {
    headers['x-schema-prefix'] = departmentCode;
  }

  try {
    const response = await axios({
      method,
      url: url,
      data,
      headers,
    });

    return response.data;
  } catch (error: any) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

// API client
export const api = {
  // Authentication
  login: async (email: string, password: string): Promise<UserData> => {
    return apiRequest<UserData>('POST', '/api/auth/login', { email, password });
  },

  verifyToken: async () => {
    // Assuming the backend returns the user object or at least the id upon verification
    return apiRequest<{ valid: boolean; user: UserData }>('GET', '/api/auth/verify');
  },

  logout: async () => {
    return apiRequest<{ message: string }>('POST', '/api/auth/logout');
  },

  // Student data
  getStudentProfile: async (studentId: string) => {
    return apiRequest<any>('GET', `/api/students/${studentId}`);
  },

  // Academic staff data
  getAcademicProfile: async (staffId: string) => {
    return apiRequest<any>('GET', `/api/staff/${staffId}`);
  },

  // Department data
  getDepartmentData: async (departmentId: string) => {
    return apiRequest<any>('GET', `/api/departments/${departmentId}`);
  },

  getDepartments: async () => {
    return apiRequest<any[]>('GET', '/api/departments');
  },

  // Notifications
  getNotifications: async (userId: string) => {
    return apiRequest<any>('GET', `/api/notifications/${userId}`);
  },

  markNotificationAsSeen: async (notificationId: string) => {
    return apiRequest<any>('PUT', `/api/notifications/${notificationId}/seen`);
  },

  // Users
  getUsers: async () => {
    return apiRequest<any[]>('GET', '/api/users');
  },

  getUserById: async (id: string) => {
    return apiRequest<any>('GET', `/api/users/${id}`);
  },

  updateUser: async (id: string, userData: any) => {
    return apiRequest<any>('PUT', `/api/users/${id}`, userData);
  },

  createUser: async (userData: CreateUserFormData) => {
    return apiRequest<any>('POST', '/api/users', userData);
  },

  // Students
  addStudent: async (studentData: StudentFormData, departmentCode: string): Promise<any> => {
    return apiRequest('POST', '/api/department/users/student', studentData, departmentCode);
  },

  getStudents: async (departmentCode: string) => {
    return apiRequest<any[]>('GET', '/api/department/users/student', undefined, departmentCode);
  },
  
  getDepartmentStudents: async (departmentCode: string) => {
    return apiRequest<any[]>('GET', '/api/department/users/student', undefined, departmentCode);
  },
  
  updateStudent: async (id: string, studentData: any, departmentCode: string): Promise<any> => {
    // Fixed URL pattern to match what the backend expects
    return apiRequest('PUT', `/api/department/users/${'student'}/${id}`, studentData, departmentCode);
  },
  
  deleteStudent: async (studentId: string, departmentCode: string): Promise<any> => {
    return apiRequest('DELETE', `/api/department/users/student/${studentId}`, undefined, departmentCode);
  },

  // Academic staff
  addAcademicStaff: async (staffData: AcademicStaffFormData, departmentCode: string): Promise<any> => {
    return apiRequest('POST', '/api/department/staff', staffData, departmentCode);
  },

  getDepartmentStaff: async (departmentCode: string) => {
    return apiRequest<any[]>('GET', '/api/department/staff', undefined, departmentCode);
  },
  
  updateStaff: async (id: string, staffData: any, departmentCode: string): Promise<any> => {
    return apiRequest('PUT', `/api/department/staff/${id}`, staffData, departmentCode);
  },

  deleteStaff: async (staffId: string, departmentCode: string): Promise<any> => {
    return apiRequest('DELETE', `/api/department/staff/${staffId}`, undefined, departmentCode);
  },
  
  // Module staff assignments
  getModuleStaff: async (moduleId: string, departmentCode: string) => {
    return apiRequest<any[]>('GET', `/api/department/modules/${moduleId}/staff`, undefined, departmentCode);
  },
  
  assignStaffToModule: async (assignmentData: {staffId: string, moduleId: string, role?: string}, departmentCode: string): Promise<any> => {
    return apiRequest('POST', '/api/department/modules/staff', assignmentData, departmentCode);
  },
  
  removeStaffFromModule: async (moduleId: string, staffId: string, departmentCode: string): Promise<any> => {
    return apiRequest('DELETE', `/api/department/modules/${moduleId}/staff/${staffId}`, undefined, departmentCode);
  },

  // Department users - generic endpoint for all users
  getDepartmentUsers: async (departmentCode: string): Promise<UserData[]> => {
    return apiRequest('GET', '/api/department/users', undefined, departmentCode);
  },

  deleteUserInDepartment: async (userId: string, departmentCode: string): Promise<any> => {
    return apiRequest('DELETE', `/api/users/${userId}`, undefined, departmentCode);
  },

  // Admin management
  createAdmin: async (adminData: AdminFormData): Promise<any> => {
    return apiRequest('POST', '/api/admin', adminData);
  },

  getAdmins: async (type?: string): Promise<any[]> => {
    const queryParams = type ? `?type=${type}` : '';
    return apiRequest('GET', `/api/admin${queryParams}`);
  },

  getAdminById: async (adminId: string): Promise<any> => {
    return apiRequest('GET', `/api/admin/${adminId}`);
  },

  updateAdmin: async (adminId: string, adminData: Partial<AdminFormData>): Promise<any> => {
    return apiRequest('PUT', `/api/admin/${adminId}`, adminData);
  },

  deleteAdmin: async (adminId: string): Promise<any> => {
    return apiRequest('DELETE', `/api/admin/${adminId}`);
  },
};