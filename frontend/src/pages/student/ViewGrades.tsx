import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableList from '@/components/dashboard/TableList';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { assignments, modules } from '@/data/mockData';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ViewGrades: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');

  // Get all graded assignments
  const gradedAssignments = assignments.filter(assignment => assignment.status === 'graded');

  // Filter assignments based on search and semester
  const filteredAssignments = gradedAssignments.filter(assignment => {
    const matchesSearch = 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.moduleCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    // For semester filtering, we'd need to match with the module's semester
    const relatedModule = modules.find(m => m.code === assignment.moduleCode);
    const matchesSemester = selectedSemester === 'All Semesters' || 
      (relatedModule && relatedModule.semester === selectedSemester);
    
    return matchesSearch && matchesSemester;
  });

  // Calculate GPA for completed modules
  const completedModules = modules.filter(module => module.status === 'completed');
  
  // Simple GPA calculation (A=4.0, A-=3.7, B+=3.3, B=3.0, etc.)
  const getGpaPoints = (grade: string) => {
    switch(grade) {
      case 'A': return 4.0;
      case 'A-': return 3.7;
      case 'B+': return 3.3;
      case 'B': return 3.0;
      case 'B-': return 2.7;
      case 'C+': return 2.3;
      case 'C': return 2.0;
      case 'C-': return 1.7;
      case 'D+': return 1.3;
      case 'D': return 1.0;
      case 'F': return 0.0;
      default: return 0.0;
    }
  };
  
  const calculateGPA = () => {
    if (completedModules.length === 0) return 0;
    
    const totalCredits = completedModules.reduce((sum, module) => sum + module.credits, 0);
    const weightedPoints = completedModules.reduce((sum, module) => {
      return sum + (module.grade ? getGpaPoints(module.grade) * module.credits : 0);
    }, 0);
    
    return (weightedPoints / totalCredits).toFixed(2);
  };

  // For the grade distribution chart
  const gradeDistribution = {
    'A': completedModules.filter(m => m.grade?.startsWith('A')).length,
    'B': completedModules.filter(m => m.grade?.startsWith('B')).length,
    'C': completedModules.filter(m => m.grade?.startsWith('C')).length,
    'D': completedModules.filter(m => m.grade?.startsWith('D')).length,
    'F': completedModules.filter(m => m.grade === 'F').length,
  };

  // Columns for assignment grades table
  const gradeColumns = [
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
      key: 'grade',
      header: 'Grade',
      cell: (assignment) => (
        <Badge className="font-medium px-2.5 py-0.5">
          {assignment.grade}
        </Badge>
      )
    },
    {
      key: 'feedback',
      header: 'Feedback',
      cell: (assignment) => (
        <span className="text-gray-500 line-clamp-2">
          {assignment.feedback || 'No feedback provided'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (assignment) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-amber-600 hover:text-amber-700">
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Filter options for the table
  const semesterOptions = [
    { value: 'All Semesters', label: 'All Semesters' },
    { value: 'Spring 2023', label: 'Spring 2023' },
    { value: 'Fall 2022', label: 'Fall 2022' },
    { value: 'Spring 2022', label: 'Spring 2022' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">My Grades</h2>
        </div>
        
        {/* Overall GPA and Grade Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* GPA Card */}
          <DashboardCard title="Overall GPA" className="col-span-1">
            <div className="px-6 py-8 flex flex-col items-center justify-center">
              <div className="text-5xl font-bold text-primary">{calculateGPA()}</div>
              <p className="text-sm text-gray-500 mt-2">Based on {completedModules.length} completed modules</p>
            </div>
          </DashboardCard>
          
          {/* Grade Distribution */}
          <DashboardCard title="Grade Distribution" className="col-span-2">
            <div className="px-6 py-4">
              <div className="flex items-end h-32 gap-2">
                {Object.entries(gradeDistribution).map(([grade, count]) => (
                  <div key={grade} className="flex-1 flex flex-col items-center">
                    <div className="flex-1 w-full flex items-end">
                      <div 
                        className="bg-primary w-full rounded-t-md" 
                        style={{ 
                          height: `${count > 0 ? (count / Math.max(...Object.values(gradeDistribution))) * 100 : 0}%`,
                          minHeight: count > 0 ? '10%' : '0'
                        }}
                      ></div>
                    </div>
                    <div className="mt-2 text-sm font-medium text-gray-700">{grade}</div>
                    <div className="text-xs text-gray-500">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </DashboardCard>
        </div>
        
        {/* Assignment Grades Table */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Assignment Grades</h3>
          <TableList
            columns={gradeColumns}
            data={filteredAssignments}
            showSearch={true}
            searchPlaceholder="Search assignments..."
            showFilter={true}
            filterOptions={semesterOptions}
            filterPlaceholder="All Semesters"
            onSearchChange={setSearchTerm}
            onFilterChange={setSelectedSemester}
          />
        </div>
        
        {/* Module Grades Table */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Module Grades</h3>
          <TableList
            columns={[
              {
                key: 'code',
                header: 'Code',
                cell: (module) => <span className="font-medium text-gray-900">{module.code}</span>
              },
              {
                key: 'name',
                header: 'Module Name',
                cell: (module) => <span className="text-gray-500">{module.name}</span>
              },
              {
                key: 'instructor',
                header: 'Instructor',
                cell: (module) => <span className="text-gray-500">{module.instructor}</span>
              },
              {
                key: 'semester',
                header: 'Semester',
                cell: (module) => <span className="text-gray-500">{module.semester}</span>
              },
              {
                key: 'credits',
                header: 'Credits',
                cell: (module) => <span className="text-gray-500">{module.credits}</span>
              },
              {
                key: 'grade',
                header: 'Grade',
                cell: (module) => (
                  module.grade ? (
                    <Badge className="font-medium px-2.5 py-0.5">
                      {module.grade}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">In Progress</span>
                  )
                )
              }
            ]}
            data={modules}
            showSearch={true}
            searchPlaceholder="Search modules..."
            showFilter={true}
            filterOptions={semesterOptions}
            filterPlaceholder="All Semesters"
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewGrades;
