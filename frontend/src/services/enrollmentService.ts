import axios from 'axios';

// Helper to extract auth token from localStorage
const getAuthToken = (): string | null => {
  try {
    const authJson = localStorage.getItem('auth');
    if (!authJson) return null;
    const auth = JSON.parse(authJson);
    return auth?.token ?? null;
  } catch (error) {
    console.error('Error parsing auth JSON:', error);
    return null;
  }
};

// Authenticated Axios instance
const authAxios = axios.create();

authAxios.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// -----------------------------
// Types
// -----------------------------

export interface Module {
  id: string;
  title: string;
  code: string;
  credits: number;
  semester: number;
  isOptional?: boolean;
  isEnrolled: boolean;
  isPending: boolean;
  departmentCode: string;
  departmentId: number;
  isGlobalModule: boolean;
  globalModuleId: string;    // e.g., "5-2"
  displayName?: string;
  compositeId?: string;
  uniqueKey?: string;
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
  isGlobalModule: boolean;
  departmentCode?: string;
  globalModuleId?: string;
}

// -----------------------------
// API Calls
// -----------------------------

export const getAvailableModules = async (): Promise<{
  modules: Module[];
  departmentCode: string;
  departmentId: number;
}> => {
  try {
    const response = await authAxios.get('/api/student/enrollment/available-modules');
    return response.data;
  } catch (error) {
    console.error('Error fetching available modules:', error);
    throw error;
  }
};

export const requestEnrollment = async (
  moduleId: string,
  reason: string,
  departmentId?: number,
  isGlobalModule?: boolean
): Promise<{
  message: string;
  requestId: string;
  isGlobalModule?: boolean;
  moduleCode?: string;
  departmentCode?: string;
}> => {
  try {
    // Ensure fields are always sent
    const payload = {
      moduleId,
      reason,
      isGlobalModule: !!isGlobalModule,
      departmentId: departmentId ?? null
    };

    console.log('Sending enrollment request payload:', payload);

    const response = await authAxios.post('/api/student/enrollment/request', payload);
    return response.data;
  } catch (error) {
    console.error('Error requesting enrollment:', error);
    throw error;
  }
};

export const getEnrollmentRequests = async (): Promise<EnrollmentRequest[]> => {
  try {
    const response = await authAxios.get('/api/student/enrollment/requests');
    return response.data.requests; // be sure your controller returns { requests: [...] }
  } catch (error) {
    console.error('Error fetching enrollment requests:', error);
    throw error;
  }
};