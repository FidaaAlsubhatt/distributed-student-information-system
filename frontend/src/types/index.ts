export type UserRole = 'student' | 'academic' | 'department' | 'central';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export interface Module {
  id: string;
  code: string;
  name: string;
  instructor: string;
  credits: number;
  status: 'active' | 'pending' | 'completed';
  semester: string;
  grade?: string;
}

export interface Assignment {
  id: string;
  title: string;
  module: string;
  moduleCode: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: string;
  feedback?: string;
  submissionCount?: number;
}

export interface TimetableEntry {
  id: string;
  moduleName: string;
  moduleCode: string;
  startTime: string;
  endTime: string;
  room: string;
  building: string;
  day: string;
  type: 'class' | 'exam' | 'office-hours';
  students?: number;
}

export interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
  bgColor: string;
  textColor: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  time: string;
  read: boolean;
}

export interface Department {
  id: string;
  name: string;
  students: number;
  staff: number;
  modules: number;
  avgGpa: number;
  trend: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

export interface StudentCase {
  id: string;
  student: {
    id: string;
    name: string;
    avatar: string;
  };
  issue: string;
  module: string;
  status: 'urgent' | 'pending' | 'resolved';
}

export interface SystemHealth {
  id: string;
  name: string;
  description: string;
  status: 'healthy' | 'warning' | 'alert';
}
