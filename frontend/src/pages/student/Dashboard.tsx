import React from 'react';
import { Link } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { useUser } from '@/contexts/UserContext';
import { studentStats, assignments, timetable } from '@/data/mockData';
import { format, isAfter, isBefore, isToday, addDays } from 'date-fns';

const StudentDashboard: React.FC = () => {
  const { currentUser } = useUser();
  const today = new Date();

  // Filter for upcoming assignments (not yet due)
  const upcomingAssignments = assignments
    .filter(assignment => 
      assignment.status === 'pending' && 
      isAfter(new Date(assignment.dueDate), today)
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // Get today's timetable
  const todaysSchedule = timetable
    .filter(entry => entry.day.toLowerCase() === format(today, 'EEEE').toLowerCase() && entry.type === 'class')
    .sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });

  // Recent grades
  const recentGrades = assignments
    .filter(assignment => assignment.status === 'graded')
    .slice(0, 3);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Student Portal</h2>
          <p className="text-sm text-gray-600">Welcome back, <span className="font-medium">Fidaa Alsubhat</span></p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {studentStats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
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
                      <p>{entry.startTime}</p>
                      <p className="mt-0.5">{entry.endTime}</p>
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-gray-800">{entry.moduleName}</h4>
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
