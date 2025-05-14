import axios from 'axios';

// Get modules taught by academic staff
export const getAcademicModules = async () => {
  try {
    // Get auth data from localStorage
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Make API request with the token
    const response = await axios.get('/api/staff/modules', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching academic modules:', error);
    throw error;
  }
};

// Get students enrolled in a specific module
export const getModuleStudents = async (moduleId: string) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.get(`/api/staff/modules/${moduleId}/students`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching module students:', error);
    throw error;
  }
};

// Module data interface
export interface ModuleCreateData {
  code: string;
  name: string;
  credits: string;
  description: string;
  semester: string;
  prerequisites?: string;
}

// Create a new module
export const createModule = async (moduleData: ModuleCreateData) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.post('/api/staff/modules', 
      moduleData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating module:', error);
    throw error;
  }
};

// Module update interface
export interface ModuleUpdateData {
  code: string;
  name: string;
  credits: string;
  description: string;
  semester: string;
  prerequisites?: string;
}

// Update an existing module
export const updateModule = async (moduleId: string, moduleData: ModuleUpdateData) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.put(`/api/staff/modules/${moduleId}`, 
      moduleData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating module:', error);
    throw error;
  }
};

// Delete a module
export const deleteModule = async (moduleId: string) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.delete(`/api/staff/modules/${moduleId}`, 
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error deleting module:', error);
    throw error;
  }
};

// Update student grade for an assignment
export const updateStudentGrade = async (moduleId: string, studentId: string, assignmentId: string, grade: string) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.put(
      `/api/staff/modules/${moduleId}/students/${studentId}/assignments/${assignmentId}/grade`,
      { grade },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating student grade:', error);
    throw error;
  }
};
