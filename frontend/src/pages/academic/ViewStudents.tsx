import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableList from '@/components/dashboard/TableList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Mail, MoreHorizontal, User } from 'lucide-react';

// Mock student data
const students = [
  {
    id: '1',
    name: 'Michael Johnson',
    email: 'mjohnson@university.edu',
    studentId: 'ST12345',
    program: 'Computer Science',
    year: '3rd Year',
    gpa: 3.85,
    status: 'active',
    enrolledModules: [
      { code: 'CS301', name: 'Database Systems' },
      { code: 'CS310', name: 'Web Development' },
      { code: 'CS305', name: 'Software Engineering' }
    ],
    performance: {
      label: 'Excellent',
      color: 'success'
    },
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '2',
    name: 'Emily Davis',
    email: 'edavis@university.edu',
    studentId: 'ST12346',
    program: 'Computer Science',
    year: '3rd Year',
    gpa: 3.92,
    status: 'active',
    enrolledModules: [
      { code: 'CS301', name: 'Database Systems' },
      { code: 'CS310', name: 'Web Development' },
      { code: 'CS315', name: 'Mobile App Development' }
    ],
    performance: {
      label: 'Excellent',
      color: 'success'
    },
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '3',
    name: 'Daniel Wilson',
    email: 'dwilson@university.edu',
    studentId: 'ST12347',
    program: 'Computer Science',
    year: '3rd Year',
    gpa: 3.45,
    status: 'active',
    enrolledModules: [
      { code: 'CS301', name: 'Database Systems' },
      { code: 'CS310', name: 'Web Development' },
      { code: 'CS320', name: 'Artificial Intelligence' }
    ],
    performance: {
      label: 'Good',
      color: 'primary'
    },
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '4',
    name: 'Sophia Martinez',
    email: 'smartinez@university.edu',
    studentId: 'ST12348',
    program: 'Computer Science',
    year: '3rd Year',
    gpa: 3.78,
    status: 'active',
    enrolledModules: [
      { code: 'CS301', name: 'Database Systems' },
      { code: 'CS310', name: 'Web Development' },
      { code: 'CS330', name: 'Computer Networks' }
    ],
    performance: {
      label: 'Very Good',
      color: 'primary'
    },
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '5',
    name: 'Alexander Brown',
    email: 'abrown@university.edu',
    studentId: 'ST12349',
    program: 'Computer Science',
    year: '3rd Year',
    gpa: 2.95,
    status: 'academic-warning',
    enrolledModules: [
      { code: 'CS301', name: 'Database Systems' },
      { code: 'CS310', name: 'Web Development' },
      { code: 'CS305', name: 'Software Engineering' }
    ],
    performance: {
      label: 'Needs Improvement',
      color: 'warning'
    },
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  }
];

const ViewStudents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  
  // Filter students based on search term and tab
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      currentTab === 'all' || 
      (currentTab === 'excellent' && student.performance.label === 'Excellent') ||
      (currentTab === 'concern' && (student.performance.label === 'Needs Improvement' || student.status === 'academic-warning'));
    
    return matchesSearch && matchesTab;
  });
  
  // Student profile dialog content
  const StudentProfile = ({ student }: { student: typeof students[0] }) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={student.avatar} alt={student.name} />
          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{student.name}</h2>
          <p className="text-gray-500">{student.studentId} • {student.program}, {student.year}</p>
          <div className="flex gap-2 mt-1">
            <Badge 
              variant="outline" 
              className={`${
                student.status === 'active' 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
              }`}
            >
              {student.status === 'active' ? 'Active' : 'Academic Warning'}
            </Badge>
            <Badge 
              variant="outline" 
              className={`${
                student.performance.color === 'success' 
                  ? 'bg-green-100 text-green-800 border-green-200' :
                student.performance.color === 'primary'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
              }`}
            >
              {student.performance.label}
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Email</p>
          <p className="font-medium">{student.email}</p>
        </div>
        <div>
          <p className="text-gray-500">GPA</p>
          <p className="font-medium">{student.gpa.toFixed(2)}/4.00</p>
        </div>
      </div>
      
      <div>
        <p className="text-gray-500 mb-2">Enrolled Modules</p>
        <div className="space-y-2">
          {student.enrolledModules.map(module => (
            <div key={module.code} className="bg-gray-50 p-2 rounded">
              <p className="font-medium">{module.code}: {module.name}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="pt-4 flex gap-2">
        <Button className="flex-1" asChild>
          <a href={`mailto:${student.email}`}>
            <Mail className="h-4 w-4 mr-2" />
            Contact Student
          </a>
        </Button>
        <Button variant="outline" className="flex-1">
          <FileText className="h-4 w-4 mr-2" />
          View Records
        </Button>
      </div>
    </div>
  );
  
  // Columns for student table
  const studentColumns = [
    {
      key: 'name',
      header: 'Student',
      cell: (student: typeof students[0]) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={student.avatar} alt={student.name} />
            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{student.name}</div>
            <div className="text-gray-500 text-sm">{student.studentId}</div>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      cell: (student: typeof students[0]) => (
        <div className="text-gray-700">{student.email}</div>
      )
    },
    {
      key: 'program',
      header: 'Program',
      cell: (student: typeof students[0]) => (
        <div className="text-gray-700">{student.program}, {student.year}</div>
      )
    },
    {
      key: 'gpa',
      header: 'GPA',
      cell: (student: typeof students[0]) => (
        <div className="font-medium text-gray-900">{student.gpa.toFixed(2)}</div>
      )
    },
    {
      key: 'performance',
      header: 'Performance',
      cell: (student: typeof students[0]) => {
        let badgeClass = '';
        
        switch (student.performance.color) {
          case 'success':
            badgeClass = 'bg-green-100 text-green-800 border-green-200';
            break;
          case 'primary':
            badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
            break;
          case 'warning':
            badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
            break;
        }
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {student.performance.label}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      header: '',
      cell: (student: typeof students[0]) => (
        <div className="flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <User className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Student Profile</DialogTitle>
                <DialogDescription>
                  View detailed information about this student.
                </DialogDescription>
              </DialogHeader>
              <StudentProfile student={student} />
            </DialogContent>
          </Dialog>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                View Grades
              </DropdownMenuItem>
              <DropdownMenuItem>
                View Submissions
              </DropdownMenuItem>
              <DropdownMenuItem>
                Contact Student
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Students</h2>
        </div>
        
        {/* Student Performance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-sm text-gray-500">Enrolled in your modules</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Excellent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {students.filter(s => s.performance.label === 'Excellent').length}
              </div>
              <p className="text-sm text-gray-500">Students with GPA &gt; 3.8</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Needs Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {students.filter(s => 
                  s.performance.label === 'Needs Improvement' || s.status === 'academic-warning'
                ).length}
              </div>
              <p className="text-sm text-gray-500">Students with GPA &lt; 3.0</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Students Table */}
        <div>
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All Students</TabsTrigger>
                <TabsTrigger value="excellent">Excellent</TabsTrigger>
                <TabsTrigger value="concern">Needs Attention</TabsTrigger>
              </TabsList>
              
              <div className="relative w-64">
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <TabsContent value="all" className="m-0">
              <TableList 
                columns={studentColumns}
                data={filteredStudents}
              />
            </TabsContent>
            
            <TabsContent value="excellent" className="m-0">
              <TableList 
                columns={studentColumns}
                data={filteredStudents}
              />
            </TabsContent>
            
            <TabsContent value="concern" className="m-0">
              <TableList 
                columns={studentColumns}
                data={filteredStudents}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewStudents;