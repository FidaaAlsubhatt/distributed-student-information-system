import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableList from '@/components/dashboard/TableList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Clock, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useUser } from '@/contexts/UserContext';

// Define module type
interface Module {
  module_id: string;
  module_code: string;
  title: string;
  description: string;
  credits: number;
  academic_year: string;
  status: string;
  grade: string;
  instructor?: string; // This might come from a join or could be added later
  semester?: string; // Derived from academic_year + term
}

const Modules: React.FC = () => {
  const { isAuthenticated } = useUser();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch modules using email-based approach
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if authenticated first
        if (!isAuthenticated) {
          setError('Please log in to view your modules');
          setLoading(false);
          return;
        }

        console.log('Fetching modules from API...');
        
        // Get auth data exactly as API client does
        const authJson = localStorage.getItem('auth');
        const token = authJson ? JSON.parse(authJson).token : null;

        if (!token) {
          console.error('No token found in auth data');
          setError('Authentication token not found');
          setLoading(false);
          return;
        }

        console.log('Using token:', token.substring(0, 15) + '...');
        
        // Make API request with the token
        const response = await axios.get('/api/modules/student-modules', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('API response:', response.data);
        
        // Set the modules from the API response
        setModules(response.data);
        
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError('Failed to load modules. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [isAuthenticated]);
  
  // Split modules into active and completed
  const activeModules = modules.filter(module => module.status.toLowerCase() === 'active');
  const pastModules = modules.filter(module => module.status.toLowerCase() === 'completed' || 
                                            module.status.toLowerCase() === 'passed' ||
                                            module.grade !== 'Not Graded');

  // Filter active modules based on search and semester
  const filteredActiveModules = activeModules.filter(module => {
    const matchesSearch = 
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.module_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (module.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    // Extract semester from academic_year or use directly if available
    const moduleSemester = module.semester || `${module.academic_year}`;
    const matchesSemester = selectedSemester === 'All Semesters' || moduleSemester.includes(selectedSemester);
    
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
      cell: (module: Module) => <span className="font-medium text-gray-900">{module.module_code}</span>
    },
    {
      key: 'name',
      header: 'Module Name',
      cell: (module: Module) => <span className="text-gray-500">{module.title}</span>
    },
    {
      key: 'academic_year',
      header: 'Academic Year',
      cell: (module: Module) => <span className="text-gray-500">{module.academic_year}</span>
    },
    {
      key: 'credits',
      header: 'Credits',
      cell: (module: Module) => <span className="text-gray-500">{module.credits}</span>
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
      cell: (module: Module) => <span className="font-medium text-gray-900">{module.module_code}</span>
    },
    {
      key: 'name',
      header: 'Module Name',
      cell: (module: Module) => <span className="text-gray-500">{module.title}</span>
    },
    {
      key: 'academic_year',
      header: 'Academic Year',
      cell: (module: Module) => <span className="text-gray-500">{module.academic_year}</span>
    },
    {
      key: 'credits',
      header: 'Credits',
      cell: (module: Module) => <span className="text-gray-500">{module.credits}</span>
    },
    {
      key: 'grade',
      header: 'Grade',
      cell: (module: Module) => <span className="font-medium text-gray-900">{module.grade}</span>
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

  // Generate semester options from available modules
  const semesterOptions = [
    { value: 'All Semesters', label: 'All Semesters' },
    ...Array.from(new Set(modules.map(m => m.academic_year)))
      .filter(year => year)
      .map(year => ({ 
        value: year, 
        label: `${year}` 
      }))
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
        
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <span>Loading your modules...</span>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="bg-red-50 p-4 rounded-md border border-red-200">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="ml-2 text-red-700">{error}</span>
            </div>
          </div>
        )}
        
        {/* No modules state */}
        {!loading && !error && modules.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">You are not currently enrolled in any modules.</p>
            <Link href="/request-enrollment">
              <Button>Browse Available Modules</Button>
            </Link>
          </div>
        )}
        
        {/* Current Modules */}
        {!loading && !error && activeModules.length > 0 && (
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
        
        )}
        
        {/* Past Modules */}
        {!loading && !error && pastModules.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Past Modules</h3>
            <TableList
              columns={pastModulesColumns}
              data={pastModules}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Modules;
