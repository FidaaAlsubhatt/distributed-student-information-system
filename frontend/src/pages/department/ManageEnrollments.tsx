import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableList from '@/components/dashboard/TableList';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCcw } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';

interface EnrollmentRequest {
  id: string;
  studentEmail: string;
  moduleCode: string;
  moduleTitle: string;
  reason: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'internal' | 'external';  // Internal = within department, External = cross-department
  departmentCode?: string;        // Target department code for external requests
  sourceDeptCode?: string;        // Source department code (where the student is from)
  sourceDeptName?: string;        // Source department name (where the student is from)
  compositeStudentId?: string;    // Format: "deptCode:studentId"
  compositeModuleId?: string;     // Format: "deptCode:moduleCode"
}

const ManageEnrollments: React.FC = () => {
  const { toast } = useToast();
  const [internalRequests, setInternalRequests] = useState<EnrollmentRequest[]>([]);
  const [externalRequests, setExternalRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('internal');
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      const token = auth?.token;
      
      const config = { headers: { Authorization: `Bearer ${token}` } };
      console.log('Fetching enrollment requests...');
      
      const res = await axios.get('/api/department/enrollment-requests', config);      
      
      const { internalRequests = [], externalRequests = [], departmentInfo } = res.data;
      
      setInternalRequests(internalRequests);
      setExternalRequests(externalRequests);
      
      // Set department name if available
      if (departmentInfo && departmentInfo.name) {
        setDepartmentName(departmentInfo.name);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
      setError('Could not load enrollment requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data with visual indicator
  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      // Determine if this is an internal or external request
      const isInternal = internalRequests.some(req => req.id === id);
      const type = isInternal ? 'internal' : 'external';
      
      console.log(`Processing ${action} action for request ${id}, type: ${type}`);
      
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      const token = auth?.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const endpoint = `/api/department/enrollment-requests/${id}/review`;
      console.log(`Sending ${action} request to endpoint: ${endpoint}`);
      await axios.post(endpoint, { action, type }, config);

      toast({
        title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `Request has been ${action}d successfully.`,
      });

      fetchRequests();
    } catch (err) {
      console.error('Error processing action:', err);
      toast({
        title: 'Action failed',
        description: 'Could not process request. Try again.',
        variant: 'destructive',
      });
    }
  };

  const internalColumns = [
    { key: 'studentEmail', header: 'Student Email', accessor: 'studentEmail' },
    { key: 'moduleCode', header: 'Module Code', accessor: 'moduleCode' },
    { key: 'moduleTitle', header: 'Module Title', accessor: 'moduleTitle' },
    { key: 'reason', header: 'Reason', accessor: 'reason' },
    { 
      key: 'requestDate', 
      header: 'Requested At', 
      cell: (req: EnrollmentRequest) => new Date(req.requestDate).toLocaleString()
    },
    {
      key: 'status',
      header: 'Status',
      cell: (req: EnrollmentRequest) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          req.status === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : req.status === 'approved'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {req.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (req: EnrollmentRequest) =>
        req.status === 'pending' && (
          <div className="flex space-x-2 justify-end">
            <Button size="sm" variant="outline" className="bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 border-green-200" 
              onClick={() => handleAction(req.id, 'approve')}>
              Approve
            </Button>
            <Button size="sm" variant="outline" className="bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border-red-200" 
              onClick={() => handleAction(req.id, 'reject')}>
              Reject
            </Button>
          </div>
        ),
    },
  ];

  const externalColumns = [
    { key: 'studentEmail', header: 'Student Email', accessor: 'studentEmail' },
    { key: 'studentName', header: 'Student Name', accessor: 'studentName' },
    { key: 'sourceDeptCode', header: 'Source Dept', accessor: 'sourceDeptCode' },
    { key: 'moduleCode', header: 'Module Code', accessor: 'moduleCode' },
    { key: 'moduleTitle', header: 'Module Title', accessor: 'moduleTitle' },
    { key: 'reason', header: 'Reason', accessor: 'reason' },
    { 
      key: 'requestDate', 
      header: 'Requested At', 
      cell: (req: EnrollmentRequest) => new Date(req.requestDate).toLocaleString() 
    },
    {
      key: 'status',
      header: 'Status',
      cell: (req: EnrollmentRequest) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          req.status === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : req.status === 'approved'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {req.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (req: EnrollmentRequest) =>
        req.status === 'pending' && (
          <div className="flex space-x-2 justify-end">
            <Button size="sm" variant="outline" className="bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 border-green-200" 
              onClick={() => handleAction(req.id, 'approve')}>
              Approve
            </Button>
            <Button size="sm" variant="outline" className="bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border-red-200" 
              onClick={() => handleAction(req.id, 'reject')}>
              Reject
            </Button>
          </div>
        ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Manage Enrollment Requests</h2>
          {departmentName && <p className="text-sm text-muted-foreground">Department: {departmentName}</p>}
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loading || refreshing}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading enrollment requests...</span>
        </div>
      ) : error ? (
        <div className="p-4 text-center">
          <p className="text-red-500">{error}</p>
          <Button 
            onClick={fetchRequests} 
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      ) : internalRequests.length === 0 && externalRequests.length === 0 ? (
        <div className="p-8 text-center border rounded-lg">
          <p className="text-muted-foreground">No enrollment requests found</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="internal" className="flex-1">
              Internal Requests
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                {internalRequests.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="external" className="flex-1">
              External Requests
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                {externalRequests.length}
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="internal" className="border-none p-0">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                These are requests from students within your department to enroll in your modules.
              </p>
            </div>
            
            {internalRequests.length === 0 ? (
              <div className="p-8 text-center border rounded-lg">
                <p className="text-muted-foreground">No internal enrollment requests found</p>
              </div>
            ) : (
              <TableList columns={internalColumns} data={internalRequests} />
            )}
          </TabsContent>
          
          <TabsContent value="external" className="border-none p-0">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                These are requests from students in other departments to enroll in your department's global modules.
              </p>
            </div>
            
            {externalRequests.length === 0 ? (
              <div className="p-8 text-center border rounded-lg">
                <p className="text-muted-foreground">No cross-department enrollment requests found</p>
              </div>
            ) : (
              <TableList columns={externalColumns} data={externalRequests} />
            )}
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
};

export default ManageEnrollments;