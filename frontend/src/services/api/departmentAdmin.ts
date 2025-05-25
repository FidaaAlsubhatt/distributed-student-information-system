import axios from 'axios';

// Module data interfaces
export interface ModuleCreateData {
  code: string;
  name: string;
  credits: string;
  description: string;
  semester: string;
  prerequisites?: string;
  capacity?: number;
}

export interface ModuleUpdateData {
  code?: string;
  name?: string;
  credits?: string;
  description?: string;
  semester?: string;
  prerequisites?: string;
  capacity?: number;
  isActive?: boolean;
}

export interface StaffAssignmentData {
  staffId: string;
  role: string;
}

// Get all modules in the department
export const getDepartmentModules = async () => {
  try {
    // Get auth data from localStorage
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Make API request with the token
    const response = await axios.get('/api/department/modules', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching department modules:', error);
    throw error;
  }
};

// Get all staff in the department
export const getDepartmentStaff = async () => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.get('/api/department/staff', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching department staff:', error);
    throw error;
  }
};

// Create a new module
export const createModule = async (moduleData: ModuleCreateData) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.post('/api/department/modules', 
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

// Update an existing module
export const updateModule = async (moduleId: string, moduleData: ModuleUpdateData) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.put(`/api/department/modules/${moduleId}`, 
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

    const response = await axios.delete(`/api/department/modules/${moduleId}`, 
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

// Assign staff to a module
export const assignStaffToModule = async (moduleId: string, assignmentData: StaffAssignmentData) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.post(`/api/department/modules/${moduleId}/staff`, 
      assignmentData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error assigning staff to module:', error);
    throw error;
  }
};

// Remove staff from a module
export const removeStaffFromModule = async (moduleId: string, staffId: string) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.delete(`/api/department/modules/${moduleId}/staff/${staffId}`, 
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error removing staff from module:', error);
    throw error;
  }
};
