import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableList from '@/components/dashboard/TableList';
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar, 
  Clock, 
  MapPin, 
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { modules, timetable } from '@/data/mockData';

// Mock enrollment requests
const enrollmentRequests = [
  {
    id: '1',
    student: {
      id: '101',
      name: 'Michael Johnson',
      email: 'mjohnson@university.edu'
    },
    module: {
      id: '201',
      code: 'CS301',
      name: 'Database Systems'
    },
    requestDate: '2023-04-15',
    status: 'pending',
    reason: 'Required for my major specialization'
  },
  {
    id: '2',
    student: {
      id: '102',
      name: 'Emily Davis',
      email: 'edavis@university.edu'
    },
    module: {
      id: '202',
      code: 'CS310',
      name: 'Web Development'
    },
    requestDate: '2023-04-16',
    status: 'pending',
    reason: 'Interested in web technologies for my final project'
  },
  {
    id: '3',
    student: {
      id: '103',
      name: 'Daniel Wilson',
      email: 'dwilson@university.edu'
    },
    module: {
      id: '203',
      code: 'CS305',
      name: 'Software Engineering'
    },
    requestDate: '2023-04-14',
    status: 'approved',
    reason: 'Need to fulfill degree requirements'
  },
  {
    id: '4',
    student: {
      id: '104',
      name: 'Sophia Martinez',
      email: 'smartinez@university.edu'
    },
    module: {
      id: '204',
      code: 'CS320',
      name: 'Artificial Intelligence'
    },
    requestDate: '2023-04-13',
    status: 'rejected',
    reason: 'Interest in AI research and future career prospects',
    rejectionReason: 'Prerequisites not met'
  }
];

// Mock classes and exams from timetable data
const classesAndExams = timetable.map(entry => ({
  ...entry,
  status: Math.random() > 0.3 ? 'scheduled' : 'pending'
}));

const ModuleManagement: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('pending');
  const [classesTab, setClassesTab] = useState('all');
  
  // Filter enrollment requests based on search and tab
  const filteredRequests = enrollmentRequests.filter(request => {
    const matchesSearch = !searchTerm || 
      request.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.module.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.module.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      currentTab === 'all' || 
      (currentTab === 'pending' && request.status === 'pending') ||
      (currentTab === 'approved' && request.status === 'approved') ||
      (currentTab === 'rejected' && request.status === 'rejected');
    
    return matchesSearch && matchesTab;
  });
  
  // Filter classes and exams based on search and tab
  const filteredSchedule = classesAndExams.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.moduleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.moduleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.room.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      classesTab === 'all' || 
      (classesTab === 'classes' && entry.type === 'class') ||
      (classesTab === 'exams' && entry.type === 'exam') ||
      (classesTab === 'office-hours' && entry.type === 'office-hours');
    
    return matchesSearch && matchesTab;
  });
  
  // Handle approve enrollment request
  const handleApprove = (requestId: string) => {
    toast({
      title: "Enrollment Approved",
      description: "The student has been successfully enrolled in the module.",
    });
  };
  
  // Handle reject enrollment request
  const handleReject = (requestId: string) => {
    toast({
      title: "Enrollment Rejected",
      description: "The enrollment request has been rejected.",
    });
  };
  
  // Handle schedule approval
  const handleScheduleApprove = (scheduleId: string) => {
    toast({
      title: "Schedule Approved",
      description: "The class/exam has been confirmed and scheduled.",
    });
  };
  
  // Enrollment requests columns
  const requestColumns = [
    {
      key: 'student',
      header: 'Student',
      cell: (request: typeof enrollmentRequests[0]) => (
        <div>
          <div className="font-medium text-gray-900">{request.student.name}</div>
          <div className="text-sm text-gray-500">{request.student.email}</div>
        </div>
      )
    },
    {
      key: 'module',
      header: 'Module',
      cell: (request: typeof enrollmentRequests[0]) => (
        <div>
          <div className="font-medium text-gray-900">{request.module.name}</div>
          <div className="text-sm text-gray-500">{request.module.code}</div>
        </div>
      )
    },
    {
      key: 'requestDate',
      header: 'Request Date',
      cell: (request: typeof enrollmentRequests[0]) => (
        <div className="text-gray-700">{request.requestDate}</div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (request: typeof enrollmentRequests[0]) => {
        let badgeClass = '';
        
        switch (request.status) {
          case 'pending':
            badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
            break;
          case 'approved':
            badgeClass = 'bg-green-100 text-green-800 border-green-200';
            break;
          case 'rejected':
            badgeClass = 'bg-red-100 text-red-800 border-red-200';
            break;
        }
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (request: typeof enrollmentRequests[0]) => (
        <div className="flex space-x-2 justify-end">
          {request.status === 'pending' ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                onClick={() => handleApprove(request.id)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                onClick={() => handleReject(request.id)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enrollment Request Details</DialogTitle>
                  <DialogDescription>
                    View detailed information about this enrollment request.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Student</h3>
                    <p className="mt-1">{request.student.name} ({request.student.email})</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Module</h3>
                    <p className="mt-1">{request.module.code} - {request.module.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Request Date</h3>
                    <p className="mt-1">{request.requestDate}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Student's Reason</h3>
                    <p className="mt-1">{request.reason}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <Badge variant="outline" className={
                      request.status === 'approved'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                  {request.status === 'rejected' && request.rejectionReason && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Rejection Reason</h3>
                      <p className="mt-1">{request.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )
    }
  ];
  
  // Schedule columns
  const scheduleColumns = [
    {
      key: 'module',
      header: 'Module',
      cell: (entry: typeof classesAndExams[0]) => (
        <div>
          <div className="font-medium text-gray-900">{entry.moduleName}</div>
          <div className="text-sm text-gray-500">{entry.moduleCode}</div>
          <Badge className="mt-1" variant="outline" 
            color={entry.type === 'class' ? 'blue' : entry.type === 'exam' ? 'red' : 'green'}
          >
            {entry.type === 'class' 
              ? 'Class' 
              : entry.type === 'exam' 
                ? 'Exam' 
                : 'Office Hours'
            }
          </Badge>
        </div>
      )
    },
    {
      key: 'time',
      header: 'Time & Day',
      cell: (entry: typeof classesAndExams[0]) => (
        <div className="space-y-1">
          <div className="flex items-center text-gray-700">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            {entry.day}
          </div>
          <div className="flex items-center text-gray-700">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            {entry.startTime} - {entry.endTime}
          </div>
        </div>
      )
    },
    {
      key: 'location',
      header: 'Location',
      cell: (entry: typeof classesAndExams[0]) => (
        <div className="space-y-1">
          <div className="flex items-center text-gray-700">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            {entry.room}, {entry.building}
          </div>
          {entry.students && (
            <div className="flex items-center text-gray-700">
              <Users className="h-4 w-4 mr-2 text-gray-400" />
              {entry.students} students
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (entry: typeof classesAndExams[0]) => (
        <Badge variant="outline" className={
          entry.status === 'scheduled'
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }>
          {entry.status === 'scheduled' ? 'Scheduled' : 'Pending Approval'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (entry: typeof classesAndExams[0]) => (
        <div className="flex space-x-2 justify-end">
          {entry.status === 'pending' ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
              onClick={() => handleScheduleApprove(entry.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="h-8">
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Enrollment Requests Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Enrollment Requests</h2>
          </div>
          
          {/* Enrollment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pending Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {enrollmentRequests.filter(r => r.status === 'pending').length}
                </div>
                <p className="text-sm text-gray-500">Awaiting approval</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Approved Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {enrollmentRequests.filter(r => r.status === 'approved').length}
                </div>
                <p className="text-sm text-gray-500">Approved enrollments</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Rejected Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {enrollmentRequests.filter(r => r.status === 'rejected').length}
                </div>
                <p className="text-sm text-gray-500">Rejected enrollments</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Enrollment Requests Table */}
          <Tabs defaultValue="pending" value={currentTab} onValueChange={setCurrentTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All Requests</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
              
              <div className="relative w-64">
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <TabsContent value="all" className="m-0">
              <TableList 
                columns={requestColumns}
                data={filteredRequests}
              />
            </TabsContent>
            
            <TabsContent value="pending" className="m-0">
              <TableList 
                columns={requestColumns}
                data={filteredRequests}
              />
            </TabsContent>
            
            <TabsContent value="approved" className="m-0">
              <TableList 
                columns={requestColumns}
                data={filteredRequests}
              />
            </TabsContent>
            
            <TabsContent value="rejected" className="m-0">
              <TableList 
                columns={requestColumns}
                data={filteredRequests}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Classes and Exams Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Classes & Exams</h2>
          </div>
          
          {/* Schedule Table */}
          <Tabs defaultValue="all" value={classesTab} onValueChange={setClassesTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All Schedule</TabsTrigger>
                <TabsTrigger value="classes">Classes</TabsTrigger>
                <TabsTrigger value="exams">Exams</TabsTrigger>
                <TabsTrigger value="office-hours">Office Hours</TabsTrigger>
              </TabsList>
              
              <div className="relative w-64">
                <Input
                  placeholder="Search schedule..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <TabsContent value="all" className="m-0">
              <TableList 
                columns={scheduleColumns}
                data={filteredSchedule}
              />
            </TabsContent>
            
            <TabsContent value="classes" className="m-0">
              <TableList 
                columns={scheduleColumns}
                data={filteredSchedule}
              />
            </TabsContent>
            
            <TabsContent value="exams" className="m-0">
              <TableList 
                columns={scheduleColumns}
                data={filteredSchedule}
              />
            </TabsContent>
            
            <TabsContent value="office-hours" className="m-0">
              <TableList 
                columns={scheduleColumns}
                data={filteredSchedule}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ModuleManagement;