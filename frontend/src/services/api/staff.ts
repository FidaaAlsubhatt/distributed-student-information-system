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

// Assignment interfaces
export interface AssignmentCreateData {
  title: string;
  moduleId: string;
  dueDate: Date;
  totalMarks: string;
  weight: string;
  description: string;
  instructions: string;
}

export interface AssignmentUpdateData {
  title: string;
  dueDate: Date;
  totalMarks: string;
  weight: string;
  description: string;
  instructions: string;
}

// Get assignments for academic staff
export const getAssignments = async () => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.get('/api/staff/assignments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
};

// Get submissions for a specific assignment
export const getAssignmentSubmissions = async (assignmentId: string) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.get(`/api/staff/assignments/${assignmentId}/submissions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    throw error;
  }
};

// Create a new assignment
export const createAssignment = async (assignmentData: AssignmentCreateData) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.post('/api/staff/assignments', 
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
    console.error('Error creating assignment:', error);
    throw error;
  }
};

// Update an existing assignment
export const updateAssignment = async (assignmentId: string, assignmentData: AssignmentUpdateData) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.put(`/api/staff/assignments/${assignmentId}`, 
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
    console.error('Error updating assignment:', error);
    throw error;
  }
};

// Delete an assignment
export const deleteAssignment = async (assignmentId: string) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.delete(`/api/staff/assignments/${assignmentId}`, 
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error deleting assignment:', error);
    throw error;
  }
};

// Update submission grade
export const updateSubmissionGrade = async (assignmentId: string, studentId: string, grade: string, feedback?: string) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.put(
      `/api/staff/assignments/${assignmentId}/students/${studentId}/grade`,
      { grade, feedback },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating submission grade:', error);
    throw error;
  }
};

// Exam interfaces
export interface ExamCreateData {
  moduleId: string;
  title: string;
  examType: string;
  date: Date;
  startTime: string;
  duration: string;
  location: string;
  room: string;
  description?: string;
  allowedMaterials?: string;
}

export interface ExamUpdateData {
  title?: string;
  examType?: string;
  date?: Date;
  startTime?: string;
  duration?: string;
  location?: string;
  room?: string;
  description?: string;
  allowedMaterials?: string;
}

// Get all exams for staff
export const getExams = async () => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.get('/api/staff/exams', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching exams:', error);
    throw error;
  }
};

// Get a specific exam by ID
export const getExamById = async (examId: string) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.get(`/api/staff/exams/${examId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching exam ${examId}:`, error);
    throw error;
  }
};

// Create a new exam
export const createExam = async (examData: ExamCreateData) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.post('/api/staff/exams', 
      examData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating exam:', error);
    throw error;
  }
};

// Update an existing exam
export const updateExam = async (examId: string, examData: ExamUpdateData) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.put(`/api/staff/exams/${examId}`, 
      examData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating exam:', error);
    throw error;
  }
};

// Delete an exam
export const deleteExam = async (examId: string) => {
  try {
    const authJson = localStorage.getItem('auth');
    const token = authJson ? JSON.parse(authJson).token : null;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.delete(`/api/staff/exams/${examId}`, 
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error deleting exam:', error);
    throw error;
  }
};
