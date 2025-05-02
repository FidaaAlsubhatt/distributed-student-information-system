import { User, Module, Assignment, TimetableEntry, StatsCardProps, Notification, Department, StudentCase, SystemHealth } from '../types';

export const currentUser: User = {
  id: '1',
  name: 'Jane Smith',
  email: 'jane.smith@university.edu',
  role: 'student',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
};

export const modules: Module[] = [
  {
    id: '1',
    code: 'CS301',
    name: 'Database Systems',
    instructor: 'Dr. Robert Chen',
    credits: 4,
    status: 'active',
    semester: 'Spring 2023'
  },
  {
    id: '2',
    code: 'CS202',
    name: 'Algorithms & Data Structures',
    instructor: 'Prof. Sarah Johnson',
    credits: 4,
    status: 'active',
    semester: 'Spring 2023'
  },
  {
    id: '3',
    code: 'CS405',
    name: 'Human-Computer Interaction',
    instructor: 'Dr. Michelle Wong',
    credits: 3,
    status: 'active',
    semester: 'Spring 2023'
  },
  {
    id: '4',
    code: 'MATH302',
    name: 'Applied Statistics',
    instructor: 'Prof. David Lewis',
    credits: 3,
    status: 'active',
    semester: 'Spring 2023'
  },
  {
    id: '5',
    code: 'CS310',
    name: 'Web Development',
    instructor: 'Dr. James Wilson',
    credits: 3,
    status: 'active',
    semester: 'Spring 2023'
  },
  {
    id: '6',
    code: 'CS101',
    name: 'Introduction to Computer Science',
    instructor: 'Prof. Michael Brown',
    credits: 3,
    status: 'completed',
    semester: 'Fall 2022',
    grade: 'A'
  },
  {
    id: '7',
    code: 'CS201',
    name: 'Programming Fundamentals',
    instructor: 'Dr. Lisa Garcia',
    credits: 4,
    status: 'completed',
    semester: 'Fall 2022',
    grade: 'B+'
  },
  {
    id: '8',
    code: 'MATH201',
    name: 'Calculus I',
    instructor: 'Prof. Thomas Parker',
    credits: 4,
    status: 'completed',
    semester: 'Spring 2022',
    grade: 'A-'
  }
];

export const assignments: Assignment[] = [
  {
    id: '1',
    title: 'Database Design Project',
    module: 'Database Systems',
    moduleCode: 'CS301',
    dueDate: '2023-04-22T23:59:00',
    status: 'pending',
    submissionCount: 15
  },
  {
    id: '2',
    title: 'Algorithm Analysis Essay',
    module: 'Algorithms & Data Structures',
    moduleCode: 'CS202',
    dueDate: '2023-04-25T23:59:00',
    status: 'pending',
    submissionCount: 28
  },
  {
    id: '3',
    title: 'UI/UX Design Prototype',
    module: 'Human-Computer Interaction',
    moduleCode: 'CS405',
    dueDate: '2023-04-30T23:59:00',
    status: 'pending',
    submissionCount: 22
  },
  {
    id: '4',
    title: 'Midterm Exam',
    module: 'Database Systems',
    moduleCode: 'CS301',
    dueDate: '2023-03-15T11:59:00',
    status: 'graded',
    grade: '85%',
    feedback: 'Good understanding of database normalization principles'
  },
  {
    id: '5',
    title: 'Programming Assignment 2',
    module: 'Algorithms & Data Structures',
    moduleCode: 'CS202',
    dueDate: '2023-03-10T23:59:00',
    status: 'graded',
    grade: '92%',
    feedback: 'Excellent implementation of sorting algorithms'
  },
  {
    id: '6',
    title: 'Research Paper',
    module: 'Human-Computer Interaction',
    moduleCode: 'CS405',
    dueDate: '2023-03-05T23:59:00',
    status: 'graded',
    grade: '78%',
    feedback: 'Good research, but could improve on methodology section'
  }
];

export const timetable: TimetableEntry[] = [
  {
    id: '1',
    moduleName: 'Database Systems',
    moduleCode: 'CS301',
    startTime: '09:00',
    endTime: '10:30',
    room: 'CS-201',
    building: 'Computer Science',
    day: 'Monday',
    type: 'class',
    students: 32
  },
  {
    id: '2',
    moduleName: 'Algorithms & Data Structures',
    moduleCode: 'CS202',
    startTime: '12:30',
    endTime: '14:00',
    room: 'CS-105',
    building: 'Computer Science',
    day: 'Monday',
    type: 'class',
    students: 28
  },
  {
    id: '3',
    moduleName: 'Human-Computer Interaction',
    moduleCode: 'CS405',
    startTime: '15:15',
    endTime: '16:45',
    room: 'CS-302',
    building: 'Computer Science',
    day: 'Monday',
    type: 'class',
    students: 24
  },
  {
    id: '4',
    moduleName: 'Applied Statistics',
    moduleCode: 'MATH302',
    startTime: '09:00',
    endTime: '10:30',
    room: 'MATH-101',
    building: 'Mathematics',
    day: 'Tuesday',
    type: 'class'
  },
  {
    id: '5',
    moduleName: 'Web Development',
    moduleCode: 'CS310',
    startTime: '11:00',
    endTime: '12:30',
    room: 'CS-103',
    building: 'Computer Science',
    day: 'Tuesday',
    type: 'class'
  },
  {
    id: '6',
    moduleName: 'Database Systems',
    moduleCode: 'CS301',
    startTime: '14:00',
    endTime: '15:30',
    room: 'CS-201',
    building: 'Computer Science',
    day: 'Wednesday',
    type: 'class'
  },
  {
    id: '7',
    moduleName: 'Database Systems (Final Exam)',
    moduleCode: 'CS301',
    startTime: '10:00',
    endTime: '12:00',
    room: 'EX-HALL-A',
    building: 'Examination Center',
    day: 'May 15',
    type: 'exam'
  },
  {
    id: '8',
    moduleName: 'Algorithms & Data Structures (Final Exam)',
    moduleCode: 'CS202',
    startTime: '14:00',
    endTime: '16:00',
    room: 'EX-HALL-B',
    building: 'Examination Center',
    day: 'May 18',
    type: 'exam'
  },
  {
    id: '9',
    moduleName: 'Office Hours',
    moduleCode: '',
    startTime: '15:15',
    endTime: '16:45',
    room: 'CS-302',
    building: 'Computer Science',
    day: 'Thursday',
    type: 'office-hours'
  }
];

export const studentStats: StatsCardProps[] = [
  {
    icon: 'book',
    label: 'Enrolled Modules',
    value: '5',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-500'
  },
  {
    icon: 'check-circle',
    label: 'Completed Assignments',
    value: '12/15',
    bgColor: 'bg-green-100',
    textColor: 'text-green-500'
  },
  {
    icon: 'exclamation-circle',
    label: 'Upcoming Deadlines',
    value: '3',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-500'
  }
];

export const academicStats: StatsCardProps[] = [
  {
    icon: 'book',
    label: 'Active Modules',
    value: '4',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-500'
  },
  {
    icon: 'users',
    label: 'Total Students',
    value: '128',
    bgColor: 'bg-green-100',
    textColor: 'text-green-500'
  },
  {
    icon: 'file-alt',
    label: 'Assignments to Grade',
    value: '23',
    bgColor: 'bg-red-100',
    textColor: 'text-red-500'
  },
  {
    icon: 'calendar-alt',
    label: 'Upcoming Exams',
    value: '2',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-500'
  }
];

export const departmentStats: StatsCardProps[] = [
  {
    icon: 'user-graduate',
    label: 'Students',
    value: '1,254',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-500',
    trend: {
      value: '+5% from last semester',
      direction: 'up'
    }
  },
  {
    icon: 'chalkboard-teacher',
    label: 'Academic Staff',
    value: '42',
    bgColor: 'bg-green-100',
    textColor: 'text-green-500',
    trend: {
      value: '+2 new hires',
      direction: 'up'
    }
  },
  {
    icon: 'book',
    label: 'Active Modules',
    value: '68',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-500',
    trend: {
      value: 'This semester',
      direction: 'neutral'
    }
  },
  {
    icon: 'exclamation-circle',
    label: 'Pending Requests',
    value: '23',
    bgColor: 'bg-red-100',
    textColor: 'text-red-500',
    trend: {
      value: '7 urgent',
      direction: 'neutral'
    }
  }
];

export const centralStats: StatsCardProps[] = [
  {
    icon: 'university',
    label: 'Departments',
    value: '12',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-500'
  },
  {
    icon: 'user-graduate',
    label: 'Total Students',
    value: '8,452',
    bgColor: 'bg-green-100',
    textColor: 'text-green-500',
    trend: {
      value: '+3.2% from last year',
      direction: 'up'
    }
  },
  {
    icon: 'chalkboard-teacher',
    label: 'Total Staff',
    value: '412',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-500',
    trend: {
      value: 'Academic & Admin',
      direction: 'neutral'
    }
  },
  {
    icon: 'shield-alt',
    label: 'Security Alerts',
    value: '3',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-500',
    trend: {
      value: '1 critical',
      direction: 'down'
    }
  }
];

export const notifications: Notification[] = [
  {
    id: '1',
    title: 'New assignment posted',
    message: 'Database Systems - Due in 7 days',
    type: 'info',
    time: '30 minutes ago',
    read: false
  },
  {
    id: '2',
    title: 'Module enrollment approved',
    message: 'Your request for Web Development has been approved',
    type: 'success',
    time: '2 hours ago',
    read: false
  },
  {
    id: '3',
    title: 'Exam schedule updated',
    message: 'Check your exam timetable for changes',
    type: 'warning',
    time: '1 day ago',
    read: false
  },
  {
    id: '4',
    title: 'Assignment deadline approaching',
    message: 'Algorithm Analysis Essay due in 2 days',
    type: 'warning',
    time: '4 hours ago',
    read: true
  },
  {
    id: '5',
    title: 'Grade published',
    message: 'Your Database Systems midterm grade is now available',
    type: 'info',
    time: '2 days ago',
    read: true
  }
];

export const departments: Department[] = [
  {
    id: '1',
    name: 'Computer Science',
    students: 1254,
    staff: 42,
    modules: 68,
    avgGpa: 3.42,
    trend: {
      value: '+0.12',
      direction: 'up'
    }
  },
  {
    id: '2',
    name: 'Business',
    students: 1568,
    staff: 52,
    modules: 74,
    avgGpa: 3.28,
    trend: {
      value: '+0.05',
      direction: 'up'
    }
  },
  {
    id: '3',
    name: 'Engineering',
    students: 1362,
    staff: 48,
    modules: 82,
    avgGpa: 3.35,
    trend: {
      value: '-0.03',
      direction: 'down'
    }
  },
  {
    id: '4',
    name: 'Arts & Humanities',
    students: 950,
    staff: 36,
    modules: 62,
    avgGpa: 3.51,
    trend: {
      value: '+0.08',
      direction: 'up'
    }
  },
  {
    id: '5',
    name: 'Medicine',
    students: 842,
    staff: 64,
    modules: 56,
    avgGpa: 3.62,
    trend: {
      value: '+0.04',
      direction: 'up'
    }
  }
];

export const studentCases: StudentCase[] = [
  {
    id: '1',
    student: {
      id: '101',
      name: 'Michael Johnson',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    issue: 'Academic misconduct allegation • Database Systems',
    module: 'CS301',
    status: 'urgent'
  },
  {
    id: '2',
    student: {
      id: '102',
      name: 'Emily Davis',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    issue: 'Extenuating circumstances request • Multiple modules',
    module: 'Multiple',
    status: 'pending'
  },
  {
    id: '3',
    student: {
      id: '103',
      name: 'Daniel Wilson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    issue: 'Grade appeal • Algorithms & Data Structures',
    module: 'CS202',
    status: 'resolved'
  }
];

export const systemHealth: SystemHealth[] = [
  {
    id: '1',
    name: 'Database Performance',
    description: 'Average query response time: 45ms',
    status: 'healthy'
  },
  {
    id: '2',
    name: 'Authentication Service',
    description: 'Failed login attempts: 23 (last 24h)',
    status: 'warning'
  },
  {
    id: '3',
    name: 'Storage Capacity',
    description: 'Current usage: 68% (4.2TB/6TB)',
    status: 'healthy'
  },
  {
    id: '4',
    name: 'API Gateway',
    description: 'Unusual traffic pattern detected',
    status: 'alert'
  }
];
