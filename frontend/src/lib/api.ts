import axios from 'axios';

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
export interface UserData {
  userId: string;
  username: string;
  email: string;
  token: string;
  roles: {
    id: number;
    name: string;
    scope: string;
  }[];
  departmentRoles: DepartmentRole[];
}

// Define API request function
const apiRequest = async <T>(method: string, url: string, data?: any): Promise<T> => {
  // Get token from localStorage
  const authData = localStorage.getItem('auth');
  const token = authData ? JSON.parse(authData).token : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await axios({
      method,
      url: `http://localhost:3001${url}`,
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
    return apiRequest<{ valid: boolean; userId: string }>('GET', '/api/auth/verify');
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
  
  createUser: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    departmentId?: string;
  }) => {
    return apiRequest<any>('POST', '/api/users', userData);
  },

  // Students
  addStudent: async (studentData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    personalEmail?: string;
    personalPhone?: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    studentNumber: string;
    universityEmail: string;
    phoneNumber?: string;
    yearOfStudy: number;
    password: string;
  }) => {
    return apiRequest<any>('POST', '/api/department/students', studentData);
  },

  getStudents: async () => {
    return apiRequest<any[]>('GET', '/api/department/students');
  }
};