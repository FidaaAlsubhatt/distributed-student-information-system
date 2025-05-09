import axios from 'axios';
import { User } from '@/contexts/UserContext';

// Define user role type
export type UserRole = 'student' | 'academic_staff' | 'department_admin' | 'central_admin';

// Define department role type
export interface DepartmentRole {
  id: number;
  name: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
}

// Define user data type
export interface UserData extends User {
  id: string;
  userId?: string; // Added for compatibility with UserContext
  username?: string; // Added for compatibility with UserContext
  avatar?: string;
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
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'student';
  studentNumber: string;
  yearOfStudy: number;
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

export type CreateUserFormData = Partial<StudentFormData> & Partial<AcademicStaffFormData> & {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'student' | 'academic_staff';
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
    return apiRequest('POST', '/api/students', studentData, departmentCode);
  },

  getStudents: async (departmentCode: string) => {
    return apiRequest<any[]>('GET', '/api/department/students', undefined, departmentCode);
  },

  // Academic staff
  addAcademicStaff: async (staffData: AcademicStaffFormData, departmentCode: string): Promise<any> => {
    return apiRequest('POST', '/api/academic-staff', staffData, departmentCode);
  },

  // Department users
  getDepartmentUsers: async (departmentCode: string): Promise<UserData[]> => {
    return apiRequest('GET', '/api/department/users', undefined, departmentCode);
  },

  deleteUserInDepartment: async (userId: string, departmentCode: string): Promise<any> => {
    return apiRequest('DELETE', `/api/users/${userId}`, undefined, departmentCode);
  },
};