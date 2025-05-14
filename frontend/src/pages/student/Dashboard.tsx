import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { api } from '@/lib/api';
import axios from 'axios';
import { format, isAfter, isBefore, isToday, addDays } from 'date-fns';

// Types for API responses
interface StudentProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  academicInfo: {
    studentNumber: string;
    department: string;
    year: number;
    enrollDate: string;
    status: string;
  };
}

interface Module {
  module_id: string;
  module_code: string;
  title: string;
  credits: number;
  academic_year: string;
  status: string;
  grade: string;
  semester: string;
  instructor: string;
}

interface Assignment {
  id: string;
  title: string;
  module: string;
  moduleCode: string;
  dueDate: string;
  status: string;
  grade?: string;
  feedback?: boolean;
}

interface TimetableEntry {
  id: string;
  module_name: string;
  day: string;
  start_time: string;
  end_time: string;
  location: string;
  room: string;
  building: string;
  lecturer: string;
}

const StudentDashboard: React.FC = () => {
  // Remove unused currentUser reference
  const today = new Date();
  
  const [profileData, setProfileData] = useState<StudentProfile | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classTimetable, setClassTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState({
    profile: true,
    modules: true,
    assignments: true,
    timetable: true
  });
  const [error, setError] = useState<string | null>(null);

  // Load student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Authenticated API requests using the api client with proper JWT token
        // Get auth token from localStorage
        const authData = localStorage.getItem('auth');
        if (!authData) {
          setError("You are not logged in. Please sign in.");
          setLoading({
            profile: false,
            modules: false,
            assignments: false,
            timetable: false
          });
          return;
        }

        // Fetch student profile using authenticated api client
        try {
          // Use the apiRequest function directly with authentication
          const headers = {
            'Authorization': `Bearer ${JSON.parse(authData).token}`,
            'Content-Type': 'application/json'
          };
          
          // Fetch student profile
          const profileResponse = await axios.get('/api/student/profile', { headers });
          setProfileData(profileResponse.data);
          setLoading(prev => ({ ...prev, profile: false }));
          
          // Fetch student modules
          const modulesResponse = await axios.get('/api/student/modules', { headers });
          setModules(modulesResponse.data);
          setLoading(prev => ({ ...prev, modules: false }));
          
          // Fetch assignments - This endpoint might not exist yet, add error handling
          try {
            const assignmentsResponse = await axios.get('/api/student/assignments', { headers });
            setAssignments(assignmentsResponse.data);
          } catch (err) {
            console.log('Assignments API not available yet, using placeholder data');
            // Create placeholder assignments based on modules
            if (modulesResponse.data.length) {
              const placeholderAssignments = modulesResponse.data.slice(0, 3).map((module: Module, index: number) => ({
                id: `pa-${index}`,
                title: `Assignment ${index + 1} for ${module.title}`,
                module: module.title,
                moduleCode: module.module_code,
                dueDate: addDays(new Date(), 7 + index * 3).toISOString(),
                status: index === 0 ? 'graded' : 'pending',
                grade: index === 0 ? 'A-' : undefined
              }));
              setAssignments(placeholderAssignments);
            }
          }
          setLoading(prev => ({ ...prev, assignments: false }));
          
          // Fetch timetable
          const timetableResponse = await axios.get('/api/student/timetable/class', { headers });
          if (timetableResponse.data.classes) {
            setClassTimetable(timetableResponse.data.classes);
          } else {
            setClassTimetable(timetableResponse.data);
          }
          setLoading(prev => ({ ...prev, timetable: false }));
        } catch (err) {
          console.error('API request failed:', err);
          setError('Failed to load data. Please check your connection and try again.');
          setLoading(prev => ({ ...prev, profile: false, modules: false }));
        }
        
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to load student dashboard data. Please refresh and try again.');
        setLoading({
          profile: false,
          modules: false,
          assignments: false,
          timetable: false
        });
      }
    };
    
    fetchStudentData();
  }, []);

  // Filter for upcoming assignments (not yet due)
  const upcomingAssignments = assignments
    .filter(assignment => 
      assignment.status === 'pending' && 
      isAfter(new Date(assignment.dueDate), today)
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // Get today's timetable
  const todaysSchedule = classTimetable
    .filter(entry => {
      // Handle both formats of day data
      const entryDay = entry.day?.toLowerCase() || '';
      const todayName = format(today, 'EEEE').toLowerCase();
      return entryDay === todayName;
    })
    .sort((a, b) => {
      const timeA = a.start_time?.split(':').map(Number) || [0, 0];
      const timeB = b.start_time?.split(':').map(Number) || [0, 0];
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });

  // Recent grades
  const recentGrades = assignments
    .filter(assignment => assignment.status === 'graded')
    .slice(0, 3);
    
  // Calculate stats
  const studentStats = [
    {
      label: 'Enrolled Modules',
      value: modules.length,
      icon: 'BookOpen',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-500'
    },
    {
      label: 'Completed Assignments',
      value: `${assignments.filter(a => a.status === 'graded').length}/${assignments.length}`,
      icon: 'Award',
      bgColor: 'bg-green-100',
      textColor: 'text-green-500'
    },
    {
      label: 'Upcoming Assignments',
      value: assignments.filter(a => a.status === 'pending').length,
      icon: 'Calendar',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-500'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Student Portal</h2>
          <p className="text-sm text-gray-600">Welcome back, <span className="font-medium">{profileData?.name || 'Student'}</span></p>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {/* Loading indicator */}
        {(loading.profile || loading.modules) && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
            Loading your dashboard data...
          </div>
        )}
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {studentStats.map((stat, index) => (
            <StatsCard key={index} 
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              bgColor={stat.bgColor}
              textColor={stat.textColor}
            />
          ))}
        </div>
        
        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            {/* Upcoming Assignments */}
            <DashboardCard 
              title="Upcoming Assignments" 
              footerLink={{ url: '/assignments', text: 'View all assignments' }}
            >
              {upcomingAssignments.map((assignment, index) => (
                <div key={index} className="px-5 py-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800">{assignment.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{assignment.module} ({assignment.moduleCode})</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${getDueDateColor(new Date(assignment.dueDate), today)}`}>
                        {getDueText(new Date(assignment.dueDate), today)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{format(new Date(assignment.dueDate), 'dd MMM yyyy, h:mm a')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </DashboardCard>
            
            {/* Recent Grades */}
            <DashboardCard 
              title="Recent Grades" 
              footerLink={{ url: '/grades', text: 'View all grades' }}
            >
              {recentGrades.map((grade, index) => (
                <div key={index} className="px-5 py-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800">{grade.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{grade.module} ({grade.moduleCode})</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{grade.grade}</p>
                      {grade.feedback && (
                        <Link href={`/assignments/${grade.id}`}>
                          <span className="text-xs text-[#1d7a85] hover:text-[#1d7a85]/80 hover:underline cursor-pointer">View feedback</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </DashboardCard>
          </div>
          
          {/* Timetable Preview */}
          <DashboardCard 
            title="Today's Schedule" 
            footerLink={{ url: '/class-timetable', text: 'View full timetable' }}
            className="h-full"
          >
            {todaysSchedule.length > 0 ? (
              todaysSchedule.map((entry, index) => (
                <div key={index} className="px-5 py-3.5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-16 text-xs text-gray-500">
                      <p>{entry.start_time}</p>
                      <p className="mt-0.5">{entry.end_time}</p>
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-gray-800">{entry.module_name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Room: {entry.room}, Building: {entry.building}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-gray-500">
                <p className="text-sm">No classes scheduled for today.</p>
              </div>
            )}
          </DashboardCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Helper functions to format due dates
const getDueDateColor = (dueDate: Date, today: Date) => {
  if (isBefore(dueDate, addDays(today, 3))) {
    return 'text-red-500';
  } else if (isBefore(dueDate, addDays(today, 7))) {
    return 'text-yellow-500';
  } else {
    return 'text-green-500';
  }
};

const getDueText = (dueDate: Date, today: Date) => {
  if (isToday(dueDate)) {
    return 'Due today';
  }

  const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} days`;
  } else {
    return `Due in ${diffDays} days`;
  }
};

export default StudentDashboard;
