import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import StatsCard from '@/components/dashboard/StatsCard';
import NotificationItem from '@/components/dashboard/NotificationItem';
import TableList from '@/components/dashboard/TableList';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { departmentStats, notifications, modules, studentCases } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, BookOpen, Calendar, AlertTriangle } from 'lucide-react';


const DepartmentDashboard: React.FC = () => {
  // Top modules columns
  const moduleColumns = [
    {
      key: 'code',
      header: 'Module',
      cell: (module: typeof modules[0]) => (
        <div>
          <div className="font-medium text-gray-900">{module.name}</div>
          <div className="text-sm text-gray-500">{module.code}</div>
        </div>
      )
    },
    {
      key: 'instructor',
      header: 'Instructor',
      cell: (module: typeof modules[0]) => (
        <div className="text-gray-700">{module.instructor}</div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (module: typeof modules[0]) => {
        let badgeClass = '';
        
        switch (module.status) {
          case 'active':
            badgeClass = 'bg-green-100 text-green-800 border-green-200';
            break;
          case 'pending':
            badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
            break;
          case 'completed':
            badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
            break;
        }
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {module.status.charAt(0).toUpperCase() + module.status.slice(1)}
          </Badge>
        );
      }
    },
    {
      key: 'students',
      header: 'Students',
      cell: (module: typeof modules[0]) => (
        <div className="text-gray-700 font-medium">{Math.floor(Math.random() * 100) + 30}</div>
      )
    }
  ];
  
  // Student cases columns
  const studentCaseColumns = [
    {
      key: 'student',
      header: 'Student',
      cell: (studentCase: typeof studentCases[0]) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={studentCase.student.avatar} alt={studentCase.student.name} />
            <AvatarFallback>{studentCase.student.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="font-medium text-gray-900">{studentCase.student.name}</div>
        </div>
      )
    },
    {
      key: 'issue',
      header: 'Issue',
      cell: (studentCase: typeof studentCases[0]) => (
        <div className="text-gray-700">{studentCase.issue}</div>
      )
    },
    {
      key: 'module',
      header: 'Module',
      cell: (studentCase: typeof studentCases[0]) => (
        <div className="text-gray-700">{studentCase.module}</div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (studentCase: typeof studentCases[0]) => {
        let badgeClass = '';
        
        switch (studentCase.status) {
          case 'urgent':
            badgeClass = 'bg-red-100 text-red-800 border-red-200';
            break;
          case 'pending':
            badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
            break;
          case 'resolved':
            badgeClass = 'bg-green-100 text-green-800 border-green-200';
            break;
        }
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {studentCase.status.charAt(0).toUpperCase() + studentCase.status.slice(1)}
          </Badge>
        );
      }
    }
  ];
  
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Department Dashboard</h2>
          <p className="text-gray-500 mt-1">Computer Science Department overview and management</p>
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {departmentStats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>
        
        
        {/* Quick Actions */}
        <DashboardCard title="Quick Actions">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center" asChild>
              <Link href="/manage-students">
                <UserPlus className="h-6 w-6 mb-2 text-blue-600" />
                <span>Manage Students</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center" asChild>
              <Link href="/approve-enrollments">
                <BookOpen className="h-6 w-6 mb-2 text-green-600" />
                <span>Approve Enrollments</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center" asChild>
              <Link href="/classes-exams">
                <Calendar className="h-6 w-6 mb-2 text-purple-600" />
                <span>Schedule Classes</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center" asChild>
              <Link href="/student-cases">
                <AlertTriangle className="h-6 w-6 mb-2 text-amber-600" />
                <span>Student Cases</span>
              </Link>
            </Button>
          </div>
        </DashboardCard>
        
        
        {/* Top Modules */}
        <DashboardCard 
          title="Top Modules" 
          footerLink={{ url: '/dept-performance', text: 'View Module Performance' }}
        >
          <div className="mt-2">
            <TableList 
              columns={moduleColumns}
              data={modules.slice(0, 5)}
            />
          </div>
        </DashboardCard>
        
      </div>
    </DashboardLayout>
  );
};

export default DepartmentDashboard;