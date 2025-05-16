import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import TableList from '@/components/dashboard/TableList';
import { Badge } from '@/components/ui/badge';
import { Eye, Upload, FileText, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useUser } from '@/contexts/UserContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define Assignment interface based on our real data model
interface Assignment {
  // Core assignment fields
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  
  // Module info
  module: string;
  modulecode: string;
  
  // Assignment metadata
  duedate: string;
  totalmarks?: number;
  weight?: number;
  createdat?: string;
  
  // Status information
  status: 'upcoming' | 'due_soon' | 'due_today' | 'overdue' | 'submitted' | 'partially_graded' | 'fully_graded';
  
  // Submission data
  submission_id?: string;
  submittedat?: string;
  filepath?: string;
  
  // Grade data
  grade_id?: string;
  grade?: string;
  feedback?: string;
  staff_id?: string;
  revision_number?: string;
  gradedat?: string;
}

const ViewAssignments: React.FC = () => {
  const { isAuthenticated } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch assignments data from API
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if authenticated first
        if (!isAuthenticated) {
          setError('Please log in to view your assignments');
          setLoading(false);
          return;
        }

        console.log('Fetching assignments from API...');
        
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
        const response = await axios.get('/api/assignments/student-assignments', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('API response:', response.data);
        
        // Map the response data to our Assignment interface
        const assignmentData = response.data.map((item: any) => ({
          ...item,
          // Ensure we have proper status handling
          status: item.status || 'upcoming',
        }));
        
        // Set the assignments from the API response
        setAssignments(assignmentData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setError('Failed to load assignments. Please try again.');
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [isAuthenticated]);
  
  // Filter assignments based on status
  const pendingAssignments = assignments.filter(assignment => 
    ['upcoming', 'due_soon', 'due_today', 'overdue'].includes(assignment.status)
  );
  const submittedAssignments = assignments.filter(assignment => 
    assignment.status === 'submitted'
  );
  const gradedAssignments = assignments.filter(assignment => 
    ['partially_graded', 'fully_graded'].includes(assignment.status)
  );

  // Filter by search term and module code
  const filterAssignments = (assignmentList: Assignment[]) => {
    // First, filter by module code if a specific one is selected
    let filtered = assignmentList;
    if (filter !== 'all') {
      filtered = filtered.filter(assignment => assignment.modulecode === filter);
    }
    
    // Then apply search term if present
    if (!searchTerm) return filtered;
    
    return filtered.filter(assignment => 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  };

  // Common assignment table columns
  const commonColumns: { key: string; header: string; cell: (assignment: Assignment) => React.ReactNode }[] = [
    {
      key: 'title',
      header: 'Assignment',
      cell: (assignment: Assignment) => (
        <div>
          <span className="font-medium text-gray-900">{assignment.title}</span>
          <p className="text-sm text-gray-500">{assignment.module} ({assignment.modulecode})</p>
        </div>
      )
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      cell: (assignment: Assignment) => {
        // Format the date properly using date-fns
        // Handle both camelCase and lowercase API response formats
        if (!assignment.duedate) {
          return <span className="text-gray-500">No due date</span>;
        }
        
        try {
          // Make sure the date is valid before formatting
          const dateObj = new Date(assignment.duedate);
          
          // Check if date is valid (will be Invalid Date if parsing fails)
          if (isNaN(dateObj.getTime())) {
            return <span className="text-gray-500">Invalid date</span>;
          }
          
          const formattedDate = format(dateObj, 'dd MMM yyyy');
          return (
            <span className="text-gray-700">
              {formattedDate}
            </span>
          );
        } catch (e) {
          // Avoid logging the full error object to console
          console.error('Error formatting date for assignment:', assignment.id);
          return <span className="text-gray-500">Date unavailable</span>;
        }
      }
    },
    {
      key: 'status',
      header: 'Status',
      cell: (assignment: Assignment) => {
        let badgeClass = '';
        let badgeText = '';
        
        switch (assignment.status) {
          case 'upcoming':
            badgeClass = 'bg-slate-100 text-slate-800 border-slate-200';
            badgeText = 'Upcoming';
            break;
          case 'due_soon':
            badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
            badgeText = 'Due Soon';
            break;
          case 'due_today':
            badgeClass = 'bg-orange-100 text-orange-800 border-orange-200';
            badgeText = 'Due Today';
            break;
          case 'overdue':
            badgeClass = 'bg-red-100 text-red-800 border-red-200';
            badgeText = 'Overdue';
            break;
          case 'submitted':
            badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
            badgeText = 'Submitted';
            break;
          case 'partially_graded':
            badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
            badgeText = 'Partially Graded';
            break;
          case 'fully_graded':
            badgeClass = 'bg-green-100 text-green-800 border-green-200';
            badgeText = 'Fully Graded';
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
      cell: (assignment: Assignment) => (
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
      cell: (assignment: Assignment) => {
        // Show submit button for all assignments that aren't submitted or graded yet
        if (['upcoming', 'due_soon', 'due_today', 'overdue'].includes(assignment.status)) {
          return (
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
                <Eye className="h-4 w-4" />
              </Button>
              <Link href={`/submit-assignment?id=${assignment.id}`}>
                <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" title="Submit Assignment">
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
  
  // Get unique module codes for filter options
  const uniqueModuleCodes = useMemo(() => {
    return [...new Set(assignments.map(a => a.modulecode))];
  }, [assignments]);
  
  // Filter options for the table
  const filterOptions = useMemo(() => [
    { value: 'all', label: 'All Modules' },
    ...uniqueModuleCodes.map(code => {
      // Find the first assignment with this code to get the module name
      const moduleAssignment = assignments.find(a => a.modulecode === code);
      return { 
        value: code, 
        label: `${code} - ${moduleAssignment?.module || ''}` 
      };
    })
  ], [assignments, uniqueModuleCodes]);

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-lg text-gray-600">Loading assignments...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg text-gray-800 mb-2">Error</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </DashboardLayout>
    );
  }
  
  // Define columns for each tab type
  const pendingColumns = [...commonColumns.slice(0, 3), {
    key: 'details',
    header: 'Details',
    cell: (assignment: Assignment) => {
      // Calculate time remaining
      const dueDate = new Date(assignment.duedate);
      const now = new Date();
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let timeText = '';
      let timeClass = '';
      
      if (diffDays < 0) {
        timeText = 'Overdue';
        timeClass = 'text-red-600 font-medium';
      } else if (diffDays === 0) {
        timeText = 'Due today';
        timeClass = 'text-orange-600 font-medium';
      } else if (diffDays === 1) {
        timeText = 'Due tomorrow';
        timeClass = 'text-orange-600 font-medium';
      } else if (diffDays <= 7) {
        timeText = `Due in ${diffDays} days`;
        timeClass = 'text-yellow-600';
      } else {
        timeText = `Due in ${diffDays} days`;
        timeClass = 'text-gray-600';
      }
      
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={timeClass}>{timeText}</span>
          </div>
          {assignment.totalmarks && (
            <p className="text-xs text-gray-500">Total Marks: {assignment.totalmarks}</p>
          )}
          {assignment.weight && (
            <p className="text-xs text-gray-500">Weight: {assignment.weight}%</p>
          )}
        </div>
      );
    }
  }];
  
  // Submitted tab shows submission date and file
  const submittedColumns = [...commonColumns, {
    key: 'submission',
    header: 'Submission Info',
    cell: (assignment: Assignment) => (
      <div>
        {assignment.submittedat ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">Submitted: {format(new Date(assignment.submittedat), 'dd MMM yyyy HH:mm')}</p>
            {assignment.filepath && (
              <p className="text-xs text-gray-500 truncate">{assignment.filepath}</p>
            )}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </div>
    )
  }];
  
  // Graded tab shows grade, feedback, and revision info
  const gradedColumns = [...commonColumns, {
    key: 'grade',
    header: 'Grade',
    cell: (assignment: Assignment) => (
      <div>
        {assignment.grade ? (
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{assignment.grade}</p>
            {assignment.revision_number && (
              <p className="text-xs text-gray-500">Revision: {assignment.revision_number}</p>
            )}
            {assignment.gradedat && (
              <p className="text-xs text-gray-500">Graded: {format(new Date(assignment.gradedat), 'dd MMM yyyy')}</p>
            )}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </div>
    )
  }, {
    key: 'feedback',
    header: 'Feedback',
    cell: (assignment: Assignment) => (
      <div>
        {assignment.feedback ? (
          <p className="text-sm text-gray-700">{assignment.feedback}</p>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </div>
    )
  }];
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Assignments</h2>
        </div>
        
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">To Do ({pendingAssignments.length})</TabsTrigger>
            <TabsTrigger value="submitted">Submitted ({submittedAssignments.length})</TabsTrigger>
            <TabsTrigger value="graded">Graded ({gradedAssignments.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-6">
            <TableList
              columns={pendingColumns}
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
              columns={submittedColumns}
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
              columns={gradedColumns}
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
