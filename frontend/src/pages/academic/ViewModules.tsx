import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableList from '@/components/dashboard/TableList';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { FileText, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getAcademicModules } from '@/services/api/staff';

// Define module type
interface Module {
  module_id: string;
  code: string;
  title: string;
  description: string;
  credits: number;
  semester: string;
  academic_year: string;
  status: string;
  instructor: string;
  enrolled_students: number;
  capacity: number;
  is_active: boolean;
  prerequisites?: string;
}

// Define column type
interface Column {
  header: string;
  key: string;
  accessor: (row: Module) => any;
  cell?: (row: Module) => React.ReactNode;
}

const ViewModules: React.FC = () => {
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [department, setDepartment] = useState<string>('');
  
  // Fetch modules from the API
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching academic modules from API...');
        
        const response = await getAcademicModules();
        console.log('Academic modules API response:', response);
        
        if (response.modules) {
          setModules(response.modules);
          if (response.department) {
            setDepartment(response.department);
            console.log('Department from modules API:', response.department);
          }
        } else {
          setError('Module data not found in response');
        }
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError('Failed to load modules. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModules();
  }, []);
  
  const activeModules = modules.filter(module => module.status === 'active' || module.is_active);
  
  // Filter modules based on search and semester
  const filteredModules = activeModules.filter(module => {
    const matchesSearch = 
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (module.instructor && module.instructor.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSemester = selectedSemester === 'All Semesters' || module.semester === selectedSemester;
    
    return matchesSearch && matchesSemester;
  });

  // Module details dialog content
  const ModuleDetailsContent = ({ module }: { module: Module }) => {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{module.code}: {module.title}</h3>
          <Badge className="mt-1">{module.credits} Credits</Badge>
          <Badge className="ml-2 mt-1">{module.semester}</Badge>
          {module.is_active ? 
            <Badge className="ml-2 mt-1 bg-green-100 text-green-800">Active</Badge> : 
            <Badge className="ml-2 mt-1 bg-red-100 text-red-800">Inactive</Badge>
          }
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-1">Description</h4>
          <p className="text-sm text-gray-600">{module.description}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Academic Year</h4>
            <p className="text-sm text-gray-600">{module.academic_year || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Instructor</h4>
            <p className="text-sm text-gray-600">{module.instructor || 'Not assigned'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Enrolled Students</h4>
            <p className="text-sm text-gray-600">{module.enrolled_students} / {module.capacity}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Prerequisites</h4>
            <p className="text-sm text-gray-600">
              {module.prerequisites ? module.prerequisites : 'None'}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  // Columns for module table
  const moduleColumns: Column[] = [
    {
      header: 'Code',
      key: 'code',
      accessor: (module: Module) => module.code
    },
    {
      header: 'Title',
      key: 'title',
      accessor: (module: Module) => module.title,
      cell: (module: Module) => <span className="text-gray-500">{module.title}</span>
    },
    {
      header: 'Semester',
      key: 'semester',
      accessor: (module: Module) => module.semester
    },
    {
      header: 'Credits',
      key: 'credits',
      accessor: (module: Module) => module.credits
    },
    {
      header: 'Enrollment',
      key: 'enrollment',
      accessor: (module: Module) => `${module.enrolled_students}/${module.capacity}`,
      cell: (module: Module) => (
        <span className={Number(module.enrolled_students) >= Number(module.capacity) ? 'text-amber-600' : 'text-green-600'}>
          {module.enrolled_students}/{module.capacity}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      accessor: (module: Module) => module.is_active ? 'Active' : 'Inactive',
      cell: (module: Module) => (
        <Badge className={module.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {module.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      accessor: () => 'actions',
      cell: (module: Module) => (
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
                <FileText className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Module Details</DialogTitle>
                <DialogDescription>View detailed information about this module.</DialogDescription>
              </DialogHeader>
              <ModuleDetailsContent module={module} />
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="icon" className="text-amber-600 hover:text-amber-700">
            <Users className="h-4 w-4" />
          </Button>
          
          {/* Edit and delete functionality removed - only department admins can modify modules */}
        </div>
      )
    }
  ];
  
  // Generate semester options from available modules
  const semesterOptions = [
    { value: 'All Semesters', label: 'All Semesters' },
    ...Array.from(new Set(modules.map(m => m.semester)))
      .filter(semester => semester)
      .map(semester => ({ 
        value: semester, 
        label: semester
      }))
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">My Modules</h2>
            {department && (
              <Badge className="capitalize bg-blue-100 text-blue-800">
                {department.replace('_schema', '')} Department
              </Badge>
            )}
          </div>
          {/* Create module button removed - only department admins can create modules */}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Calendar className="h-10 w-10 mx-auto text-gray-400 animate-pulse" />
              <p className="mt-4 text-gray-500">Loading modules...</p>
            </div>
          </div>
        )}
        
        {/* Error state */}
        {!loading && error && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        )}
        
        {/* No modules state */}
        {!loading && !error && modules.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">You are not currently teaching any modules.</p>
            <p className="text-sm text-muted-foreground">New modules are created by department administrators.</p>
          </div>
        )}
        
        {/* Modules content */}
        {!loading && !error && modules.length > 0 && (
          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active Modules</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past Modules</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-6">
              <TableList
                columns={moduleColumns}
                data={filteredModules}
                showSearch={true}
                searchPlaceholder="Search modules..."
                showFilter={true}
                filterOptions={semesterOptions}
                filterPlaceholder="All Semesters"
                onSearchChange={setSearchTerm}
                onFilterChange={setSelectedSemester}
              />
            </TabsContent>
            
            <TabsContent value="upcoming" className="mt-6">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">No Upcoming Modules</h3>
                <p className="mt-2 text-gray-500">
                  You don't have any upcoming modules scheduled.
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  New modules are created by department administrators.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="past" className="mt-6">
              <TableList
                columns={moduleColumns.filter(col => col.key !== 'actions')}
                data={modules.filter(module => module.status === 'completed')}
                showSearch={true}
                searchPlaceholder="Search modules..."
                showFilter={false}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewModules;
