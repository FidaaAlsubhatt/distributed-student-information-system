import axios from 'axios';

// Helper function to get the authentication token
const getAuthToken = (): string | null => {
  const authJson = localStorage.getItem('auth');
  if (!authJson) return null;
  
  try {
    const auth = JSON.parse(authJson);
    return auth.token || null;
  } catch (error) {
    console.error('Error parsing auth JSON:', error);
    return null;
  }
};

// Configure axios with auth headers
const authAxios = axios.create();

authAxios.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface Module {
  id: string;
  title: string;
  code: string;
  credits: number;
  academicYear: number;
  semester: number;
  isOptional: boolean;
  isEnrolled: boolean;
  isPending: boolean;
  departmentCode?: string;
  departmentId?: number;
  isGlobalModule?: boolean;
  compositeId?: string; // Added to support unique module identification across departments
  uniqueKey?: string; // Added to ensure unique React keys in lists
  displayName?: string; // For formatted display in the UI
}

export interface EnrollmentRequest {
  id: string;
  moduleId: string;
  moduleTitle: string;
  moduleCode: string;
  reason: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewDate?: string;
  reviewerNotes?: string;
  reviewedBy?: string;
  isGlobalModule?: boolean;
  departmentCode?: string;
}

// API Functions
export const getAvailableModules = async (): Promise<{modules: Module[], departmentCode: string}> => {
  try {
    const response = await authAxios.get('/api/student/enrollment/available-modules');
    return response.data;
  } catch (error) {
    console.error('Error fetching available modules:', error);
    throw error;
  }
};

export const requestEnrollment = async (moduleId: string, reason: string, departmentId?: number, isGlobalModule?: boolean): Promise<{message: string, requestId: string, isGlobalModule?: boolean}> => {
  try {
    const response = await authAxios.post('/api/student/enrollment/request', { 
      moduleId, 
      reason,
      departmentId: isGlobalModule ? departmentId : undefined,
      isGlobalModule
    });
    return response.data;
  } catch (error) {
    console.error('Error requesting enrollment:', error);
    throw error;
  }
};

export const getEnrollmentRequests = async (): Promise<EnrollmentRequest[]> => {
  const response = await authAxios.get('/api/student/enrollment/requests');
  return response.data;
};
