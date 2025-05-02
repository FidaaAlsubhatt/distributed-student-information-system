import React from 'react';
import { Link } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { useUser } from '@/contexts/UserContext';
import { academicStats, assignments, timetable } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Reply, Eye } from 'lucide-react';

const AcademicDashboard: React.FC = () => {
  const { currentUser } = useUser();
  const today = new Date();

  // Pending assignments to grade
  const pendingAssignments = assignments
    .filter(assignment => assignment.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // Get today's timetable
  const todaysSchedule = timetable
    .filter(entry => entry.day.toLowerCase() === today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase())
    .sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });

  // Mock student interactions
  const studentInteractions = [
    {
      id: '1',
      student: {
        name: 'Michael Johnson',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
      },
      action: 'Requested assignment extension',
      module: 'Database Systems',
      time: '30 minutes ago'
    },
    {
      id: '2',
      student: {
        name: 'Emily Davis',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
      },
      action: 'Submitted assignment',
      module: 'Algorithms & Data Structures',
      time: '2 hours ago'
    },
    {
      id: '3',
      student: {
        name: 'Daniel Wilson',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
      },
      action: 'Asked a question',
      module: 'Web Development',
      time: '5 hours ago'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Academic Staff Dashboard</h2>
          <p className="text-sm text-gray-600">Welcome back, <span className="font-medium">{currentUser.name}</span></p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {academicStats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>
        
        {/* Assignments to Grade */}
        <DashboardCard 
          title="Assignments Pending Review" 
          footerLink={{ url: '/manage-assignments', text: 'View all assignments' }}
        >
          {pendingAssignments.map((assignment, index) => (
            <div key={index} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-medium text-gray-800">{assignment.title}</h4>
                  <p className="text-sm text-gray-600">
                    {assignment.module} ({assignment.moduleCode}) • {assignment.submissionCount} submissions pending
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-500">
                    Due {new Date(assignment.dueDate) < today ? 'ago' : 'in'} {
                      Math.abs(Math.ceil((new Date(assignment.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
                    } days
                  </p>
                  <Link href="/grade-assignments">
                    <Button size="sm" className="mt-2">
                      Grade Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </DashboardCard>
        
        {/* Recent Student Interactions */}
        <DashboardCard 
          title="Recent Student Interactions" 
          footerLink={{ url: '/view-students', text: 'View all student interactions' }}
        >
          {studentInteractions.map((interaction, index) => (
            <div key={index} className="px-6 py-4">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-4">
                  <AvatarImage src={interaction.student.avatar} alt={interaction.student.name} />
                  <AvatarFallback>{interaction.student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="text-base font-medium text-gray-800">{interaction.student.name}</h4>
                  <p className="text-sm text-gray-600">{interaction.action} • {interaction.module}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{interaction.time}</p>
                  <div className="mt-1 flex space-x-2">
                    {index === 0 && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:text-green-600 hover:bg-green-50">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary/80 hover:bg-primary/10">
                      {index === 1 ? <Eye className="h-4 w-4" /> : <Reply className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </DashboardCard>
        
        {/* Today's Schedule */}
        <DashboardCard title="Today's Schedule">
          {todaysSchedule.length > 0 ? (
            todaysSchedule.map((entry, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-20 text-sm text-gray-600">
                    <p>{entry.startTime}</p>
                    <p>{entry.endTime}</p>
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-base font-medium text-gray-800">{entry.moduleName}</h4>
                    <p className="text-sm text-gray-600">
                      Room: {entry.room}, Building: {entry.building}
                      {entry.students && ` • ${entry.students} students`}
                    </p>
                  </div>
                  <div>
                    <Button variant="outline" size="sm" className="text-primary border-primary/20 bg-primary/10 hover:bg-primary/20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Materials
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No classes scheduled for today.
            </div>
          )}
        </DashboardCard>
        
        {/* Module Performance Overview */}
        <DashboardCard title="Module Performance Overview">
          <div className="px-6 py-4">
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-4 text-gray-500">Module performance visualization</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Database Systems (CS301)</p>
                <p className="text-2xl font-bold text-gray-800">83%</p>
                <p className="text-xs text-green-600">+2.5% from last term</p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Algorithms & Data Structures (CS202)</p>
                <p className="text-2xl font-bold text-gray-800">76%</p>
                <p className="text-xs text-red-600">-1.2% from last term</p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Web Development (CS310)</p>
                <p className="text-2xl font-bold text-gray-800">88%</p>
                <p className="text-xs text-green-600">+4.8% from last term</p>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
};

export default AcademicDashboard;
