import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableList from '@/components/dashboard/TableList';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

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

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      const token = auth?.token;
      
      // Log authentication information (excluding sensitive parts)
      console.log('Auth token exists:', !!token);
      
      const config = { headers: { Authorization: `Bearer ${token}` } };
      console.log('Fetching enrollment requests...');
      const res = await axios.get('/api/department/enrollment-requests', config);
      
      console.log('API Response:', res.data);
      
      const { internalRequests = [], externalRequests = [] } = res.data;
      console.log('Internal Requests:', internalRequests.length, 'items');
      console.log('External Requests:', externalRequests.length, 'items');
      
      setInternalRequests(internalRequests);
      setExternalRequests(externalRequests);
    } catch (err) {
      console.error('Failed to load requests:', err);
      setError('Could not load enrollment requests');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    console.log('ManageEnrollments component mounted');
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

  const getColumns = (isExternal: boolean) => [
    { key: 'studentEmail', header: 'Student Email' },
    { key: 'moduleCode', header: 'Module Code' },
    ...(isExternal ? [{ key: 'compositeModuleId', header: 'Module ID', accessor: 'compositeModuleId' }] : []),
    { key: 'moduleTitle', header: 'Title' },
    { key: 'reason', header: 'Reason' },
    { key: 'requestDate', header: 'Requested At', 
      cell: (req: EnrollmentRequest) => new Date(req.requestDate).toLocaleString() },
    ...(isExternal ? [
      { key: 'sourceDeptCode', header: 'From Dept', accessor: 'sourceDeptCode' },
      { key: 'targetSchemaPrefix', header: 'To Dept', accessor: 'targetSchemaPrefix' }
    ] : []),
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
      header: '',
      cell: (req: EnrollmentRequest) =>
        req.status === 'pending' && (
          <div className="flex space-x-2 justify-end">
            <Button size="sm" onClick={() => handleAction(req.id, 'approve')}>Approve</Button>
            <Button size="sm" variant="destructive" onClick={() => handleAction(req.id, 'reject')}>Reject</Button>
          </div>
        ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Enrollment Requests</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading enrollment requests...</span>
        </div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">
          {error}
          <Button onClick={fetchRequests} className="mt-4">Retry</Button>
        </div>
      ) : (
        <>
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-2">Internal Enrollment Requests</h3>
            <p className="text-sm text-muted-foreground mb-4">
              These are requests from students within your department to enroll in your modules.
            </p>
            {internalRequests.length === 0 ? (
              <p className="text-muted-foreground p-4 bg-slate-50 rounded-md">No internal enrollment requests</p>
            ) : (
              <TableList columns={getColumns(false)} data={internalRequests} />
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Cross-Department Enrollment Requests</h3>
            <p className="text-sm text-muted-foreground mb-4">
              These are requests from students in other departments to enroll in your department's global modules.
            </p>
            {externalRequests.length === 0 ? (
              <p className="text-muted-foreground p-4 bg-slate-50 rounded-md">No cross-department enrollment requests</p>
            ) : (
              <TableList columns={getColumns(true)} data={externalRequests} />
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default ManageEnrollments;