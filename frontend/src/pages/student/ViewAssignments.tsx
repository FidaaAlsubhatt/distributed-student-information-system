import React, { useState } from 'react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import TableList from '@/components/dashboard/TableList';
import { Badge } from '@/components/ui/badge';
import { Eye, Upload, FileText } from 'lucide-react';
import { assignments } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ViewAssignments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // Filter assignments based on status
  const pendingAssignments = assignments.filter(assignment => assignment.status === 'pending');
  const submittedAssignments = assignments.filter(assignment => assignment.status === 'submitted');
  const gradedAssignments = assignments.filter(assignment => assignment.status === 'graded');

  // Search functionality
  const filterAssignments = (assignmentList: typeof assignments) => {
    if (!searchTerm) return assignmentList;
    
    return assignmentList.filter(assignment => 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.moduleCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Assignment table columns
  const assignmentColumns = [
    {
      key: 'title',
      header: 'Assignment',
      cell: (assignment) => (
        <div>
          <span className="font-medium text-gray-900">{assignment.title}</span>
          <p className="text-sm text-gray-500">{assignment.module} ({assignment.moduleCode})</p>
        </div>
      )
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      cell: (assignment) => (
        <span className="text-gray-500">
          {format(new Date(assignment.dueDate), 'PPp')}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (assignment) => {
        let badgeClass = '';
        let badgeText = '';
        
        switch (assignment.status) {
          case 'pending':
            badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
            badgeText = 'Pending';
            break;
          case 'submitted':
            badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
            badgeText = 'Submitted';
            break;
          case 'graded':
            badgeClass = 'bg-green-100 text-green-800 border-green-200';
            badgeText = 'Graded';
            break;
        }
        
        return (
          <Badge 
            variant="outline" 
            className={`${badgeClass} px-2 font-semibold rounded-full`}
          >
            {badgeText}
          </Badge>
        );
      }
    },
    {
      key: 'grade',
      header: 'Grade',
      cell: (assignment) => (
        assignment.grade ? (
          <span className="font-medium text-gray-900">{assignment.grade}</span>
        ) : (
          <span className="text-gray-400">-</span>
        )
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (assignment) => {
        if (assignment.status === 'pending') {
          return (
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
                <Eye className="h-4 w-4" />
              </Button>
              <Link href={`/submit-assignment?id=${assignment.id}`}>
                <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700">
                  <Upload className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          );
        } else if (assignment.status === 'submitted') {
          return (
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          );
        } else { // graded
          return (
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-amber-600 hover:text-amber-700">
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          );
        }
      }
    }
  ];

  // Filter options for the table
  const filterOptions = [
    { value: 'all', label: 'All Modules' },
    { value: 'CS301', label: 'CS301 - Database Systems' },
    { value: 'CS202', label: 'CS202 - Algorithms & Data Structures' },
    { value: 'CS405', label: 'CS405 - Human-Computer Interaction' },
    { value: 'MATH302', label: 'MATH302 - Applied Statistics' },
    { value: 'CS310', label: 'CS310 - Web Development' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Assignments</h2>
        </div>
        
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending ({pendingAssignments.length})</TabsTrigger>
            <TabsTrigger value="submitted">Submitted ({submittedAssignments.length})</TabsTrigger>
            <TabsTrigger value="graded">Graded ({gradedAssignments.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-6">
            <TableList
              columns={assignmentColumns}
              data={filterAssignments(pendingAssignments)}
              showSearch={true}
              searchPlaceholder="Search assignments..."
              showFilter={true}
              filterOptions={filterOptions}
              filterPlaceholder="All Modules"
              onSearchChange={setSearchTerm}
              onFilterChange={setFilter}
            />
          </TabsContent>
          
          <TabsContent value="submitted" className="mt-6">
            <TableList
              columns={assignmentColumns}
              data={filterAssignments(submittedAssignments)}
              showSearch={true}
              searchPlaceholder="Search assignments..."
              showFilter={true}
              filterOptions={filterOptions}
              filterPlaceholder="All Modules"
              onSearchChange={setSearchTerm}
              onFilterChange={setFilter}
            />
          </TabsContent>
          
          <TabsContent value="graded" className="mt-6">
            <TableList
              columns={assignmentColumns}
              data={filterAssignments(gradedAssignments)}
              showSearch={true}
              searchPlaceholder="Search assignments..."
              showFilter={true}
              filterOptions={filterOptions}
              filterPlaceholder="All Modules"
              onSearchChange={setSearchTerm}
              onFilterChange={setFilter}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ViewAssignments;
