import React, { useState } from 'react';
import { Link } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableList from '@/components/dashboard/TableList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Clock, Trash2 } from 'lucide-react';
import { modules } from '@/data/mockData';

const Modules: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const activeModules = modules.filter(module => module.status === 'active');
  const pastModules = modules.filter(module => module.status === 'completed');

  // Filter active modules based on search and semester
  const filteredActiveModules = activeModules.filter(module => {
    const matchesSearch = 
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSemester = selectedSemester === 'All Semesters' || module.semester === selectedSemester;
    
    return matchesSearch && matchesSemester;
  });

  // Pagination for active modules
  const totalActivePages = Math.ceil(filteredActiveModules.length / itemsPerPage);
  const paginatedActiveModules = filteredActiveModules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Columns for active modules table
  const activeModulesColumns = [
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
      key: 'credits',
      header: 'Credits',
      cell: (module) => <span className="text-gray-500">{module.credits}</span>
    },
    {
      key: 'status',
      header: 'Status',
      cell: (module) => (
        <Badge 
          variant="outline" 
          className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 px-2 font-semibold rounded-full"
        >
          Active
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (module) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-yellow-500 hover:text-yellow-600">
            <Clock className="h-4 w-4" />
          </Button>
          <Link href="/request-drop">
            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )
    }
  ];

  // Columns for past modules table
  const pastModulesColumns = [
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
      key: 'grade',
      header: 'Grade',
      cell: (module) => <span className="font-medium text-gray-900">{module.grade}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (module) => (
        <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

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
          <h2 className="text-2xl font-bold text-gray-800">My Modules</h2>
          <Link href="/request-enrollment">
            <Button className="flex items-center gap-2">
              <span className="text-lg">+</span> Request Enrollment
            </Button>
          </Link>
        </div>
        
        {/* Current Modules */}
        <TableList
          columns={activeModulesColumns}
          data={paginatedActiveModules}
          showSearch={true}
          searchPlaceholder="Search modules..."
          showFilter={true}
          filterOptions={semesterOptions}
          filterPlaceholder="All Semesters"
          onSearchChange={setSearchTerm}
          onFilterChange={setSelectedSemester}
          pagination={{
            currentPage,
            totalPages: totalActivePages,
            totalItems: filteredActiveModules.length,
            itemsPerPage,
            onPageChange: setCurrentPage
          }}
        />
        
        {/* Past Modules */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Past Modules</h3>
          <TableList
            columns={pastModulesColumns}
            data={pastModules}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Modules;
