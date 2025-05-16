import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableList from '@/components/dashboard/TableList';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// --- Zod schema for create/edit program
const programSchema = z.object({
  name: z.string().min(1, 'Required'),
  level: z.enum(['Undergraduate', 'Postgraduate', 'Doctorate']),
  duration: z.number().min(1, 'Must be at least 1 year'),
  status: z.enum(['active', 'inactive']),
});

type ProgramForm = z.infer<typeof programSchema>;

interface Program {
  id: number;
  name: string;
  level: 'Undergraduate' | 'Postgraduate' | 'Doctorate';
  duration: number;
  status: 'active' | 'inactive';
  created_at: string; // Match backend field name
}

// API service functions
const API_URL = '/api/department';

const fetchPrograms = async () => {
  // Get JWT token from auth data in localStorage
  const authData = localStorage.getItem('auth');
  const token = authData ? JSON.parse(authData).token : null;
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const response = await axios.get(`${API_URL}/programs`, config);
  return response.data.programs;
};

const createProgram = async (program: ProgramForm) => {
  const authData = localStorage.getItem('auth');
  const token = authData ? JSON.parse(authData).token : null;
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const response = await axios.post(`${API_URL}/programs`, program, config);
  return response.data.program;
};

const updateProgram = async (id: number, program: ProgramForm) => {
  const authData = localStorage.getItem('auth');
  const token = authData ? JSON.parse(authData).token : null;
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const response = await axios.put(`${API_URL}/programs/${id}`, program, config);
  return response.data.program;
};

const deleteProgram = async (id: number) => {
  const authData = localStorage.getItem('auth');
  const token = authData ? JSON.parse(authData).token : null;
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const response = await axios.delete(`${API_URL}/programs/${id}`, config);
  return response.data;
};

const ManagePrograms: React.FC = () => {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ProgramForm>({
    resolver: zodResolver(programSchema),
    defaultValues: { name: '', level: 'Undergraduate', duration: 1, status: 'active' },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset();
    setIsDialogOpen(true);
  };
  const openEdit = (prog: Program) => {
    setEditing(prog);
    form.reset({
      name: prog.name,
      level: prog.level,
      duration: prog.duration,
      status: prog.status,
    });
    setIsDialogOpen(true);
  };

  // Fetch programs on component mount
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setLoading(true);
        const data = await fetchPrograms();
        setPrograms(data);
        // Check if department name is in the response
        if (data.department) {
          setDepartmentName(data.department);
        }
      } catch (err) {
        console.error('Error fetching programs:', err);
        setError('Failed to load programs. Please try again.');
        toast({ 
          title: 'Error', 
          description: 'Failed to load programs', 
          variant: 'destructive' 
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadPrograms();
  }, [toast]);
  
  const onSubmit = async (data: ProgramForm) => {
    try {
      setSubmitting(true);
      
      if (editing) {
        // Update existing program
        const updatedProgram = await updateProgram(editing.id, data);
        setPrograms(prev => 
          prev.map(p => p.id === editing.id ? updatedProgram : p)
        );
        toast({ 
          title: 'Program Updated', 
          description: `${data.name} updated successfully.`
        });
      } else {
        // Create new program
        const newProgram = await createProgram(data);
        setPrograms(prev => [...prev, newProgram]);
        toast({ 
          title: 'Program Added', 
          description: `${data.name} has been created.` 
        });
      }
      
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error saving program:', err);
      toast({ 
        title: 'Error', 
        description: 'Failed to save program', 
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this program? This action cannot be undone.')) {
      try {
        console.log(`Attempting to delete program with ID: ${id}`);
        const response = await deleteProgram(id);
        console.log('Delete response:', response);
        
        setPrograms((prev) => prev.filter((p) => p.id !== id));
        toast({ 
          title: 'Program Deleted', 
          description: 'Program deleted successfully' 
        });
      } catch (err: any) {
        console.error('Delete program error:', err);
        console.error('Response data:', err.response?.data);
        
        // Check if error is about students enrolled
        if (err.response?.data?.message?.includes('enrolled')) {
          toast({ 
            title: 'Cannot Delete Program', 
            description: 'This program has enrolled students and cannot be deleted.', 
            variant: 'destructive' 
          });
        } else {
          // Show more detailed error information
          const errorDetail = err.response?.data?.detail || '';
          toast({ 
            title: 'Error', 
            description: `${err.response?.data?.message || 'Failed to delete program'}${errorDetail ? `: ${errorDetail}` : ''}`, 
            variant: 'destructive' 
          });
        }
      }
    }
  };

  const columns = [
    { key: 'name', header: 'Program Name', accessor: 'name' },
    { key: 'level', header: 'Level', accessor: 'level' },
    { key: 'duration', header: 'Duration (yrs)', accessor: 'duration' },
    { 
      key: 'status', 
      header: 'Status',
      cell: (p: Program) => (
        <span className={`px-2 py-1 rounded ${p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {p.status}
        </span>
      )
    },
    { key: 'created_at', header: 'Created', accessor: 'created_at' },
    {
      key: 'actions',
      header: '',
      cell: (p: Program) => (
        <div className="flex space-x-2 justify-end">
          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Manage Programs</h2>
          {departmentName && <p className="text-sm text-muted-foreground">Department: {departmentName}</p>}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              {editing ? 'Edit Program' : 'Add Program'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Program' : 'New Program'}</DialogTitle>
              <DialogDescription>
                {editing ? 'Update program details' : 'Enter details for a new program'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    name="level"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Level</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                              <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                              <SelectItem value="Doctorate">Doctorate</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="duration"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (years)</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editing ? 'Saving...' : 'Creating...'}
                      </>
                    ) : (
                      editing ? 'Save Changes' : 'Create Program'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading programs...</span>
        </div>
      ) : error ? (
        <div className="p-4 text-center">
          <p className="text-red-500">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      ) : programs.length === 0 ? (
        <div className="p-8 text-center border rounded-lg">
          <p className="text-muted-foreground mb-4">No programs found</p>
          <Button onClick={openCreate}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add Your First Program
          </Button>
        </div>
      ) : (
        <TableList columns={columns} data={programs} />
      )}
    </DashboardLayout>
  );
};

export default ManagePrograms;
