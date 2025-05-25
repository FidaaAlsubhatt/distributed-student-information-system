import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableList from '@/components/dashboard/TableList';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Pencil, Trash2, Loader2, AlertTriangle, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  getDepartmentModules, 
  getDepartmentStaff, 
  createModule, 
  updateModule, 
  deleteModule, 
  assignStaffToModule, 
  ModuleCreateData, 
  ModuleUpdateData, 
  StaffAssignmentData
} from '@/services/api/departmentAdmin';

// Define interfaces for our component
interface Column {
  header: string;
  key: string;
  accessor: (row: Module) => any;
  cell?: (row: Module) => React.ReactNode;
}

// Define staff type
interface Staff {
  id: string; // changed from user_id
  firstName: string; // changed from first_name
  lastName: string; // changed from last_name
  position: string; // changed from title
  staffId: string; // changed from staff_number
  universityEmail: string; // changed from university_email
}

// Define module schema and form values
const moduleFormSchema = z.object({
  code: z.string().min(2, { message: "Module code is required" }),
  name: z.string().min(3, { message: "Module name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Please provide a more detailed description" }),
  credits: z.coerce.number().min(1, { message: "Credits must be at least 1" }),
  semester: z.string().min(1, { message: "Please select a semester" }),
  prerequisites: z.union([z.string(), z.array(z.string())]).optional(),
  capacity: z.coerce.number().min(1, { message: "Capacity must be at least 1" }),
});

type FormValues = z.infer<typeof moduleFormSchema>;

// Define module type
interface Module {
  module_id: string;
  code: string;
  title: string;
  description: string;
  credits: number | string; // Allow both number and string
  semester: string;
  semester_id?: string;
  academic_year?: string;
  status: string;
  enrolled_students: number | string; // Allow both number and string
  capacity: number | string; // Allow both number and string
  is_active: boolean;
  prerequisites?: string | string[];
  instructors: string[];
  staff_ids: string[];
  staff_roles: string[];
}

const ManageModules: React.FC = () => {
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignStaffDialogOpen, setIsAssignStaffDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('All Semesters');
  const [modules, setModules] = useState<Module[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [department, setDepartment] = useState<{id: string, name: string, schema: string} | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedStaffRole, setSelectedStaffRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch modules and staff from the API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch modules
      const modulesResponse = await getDepartmentModules();
      
      // Backend returns { modules: [...], department: {...} }
      if (modulesResponse && modulesResponse.modules) {
        setModules(modulesResponse.modules || []);
        if (modulesResponse.department) {
          setDepartment({
            id: modulesResponse.department.id || '',
            name: modulesResponse.department.name || '',
            schema: modulesResponse.department.schema || ''
          });
        }
      } else {
        setError('Failed to fetch modules');
      }
      
      // Fetch staff
      const staffResponse = await getDepartmentStaff();
      
      // Backend returns { users: [...], department: string }
      if (staffResponse && staffResponse.users) {
        setStaff(staffResponse.users || []);
      } else {
        toast({
          title: "Failed to fetch staff",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      setError('An error occurred while fetching data');
      console.error('Error fetching data:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to load data',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Filter modules based on search and semester
  const filteredModules = modules.filter(module => {
    const matchesSearch = 
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSemester = selectedSemester === 'All Semesters' || module.semester === selectedSemester;
    
    return matchesSearch && matchesSemester;
  });

  // Create new module form
  const form = useForm<FormValues>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      credits: 0,
      semester: '',
      prerequisites: '',
      capacity: 0,
    },
  });

  // Edit module form
  const editForm = useForm<FormValues>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      credits: 0,
      semester: '',
      prerequisites: '',
      capacity: 0,
    },
  });

  // Handle form submission for new module
  const onSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true);
      
      // Prepare module data for API
      const moduleData: ModuleCreateData = {
        code: data.code,
        name: data.name,
        description: data.description,
        credits: String(data.credits),
        semester: data.semester,
        prerequisites: typeof data.prerequisites === 'object' ? data.prerequisites.join(', ') : (data.prerequisites || ''),
        capacity: data.capacity,
      };
      
      // Call the API to create the module
      const createResponse = await createModule(moduleData);
      console.log('Module creation response:', createResponse);
      
      // Show success toast
      toast({
        title: "Module Created",
        description: createResponse.message || `Module ${data.code} - ${data.name} has been created successfully.`,
      });
      
      // Refresh the modules list
      const response = await getDepartmentModules();
      if (response.success) {
        setModules(response.data.modules || []);
      }
      
      setIsCreateDialogOpen(false);
      form.reset();
    } catch (error: any) {
      console.error('Error creating module:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create module. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submission for edit module
  const onEditSubmit = async (data: FormValues) => {
    try {
      if (!selectedModule) return;
      
      setSubmitting(true);
      
      // Prepare module data for API
      const moduleData: ModuleUpdateData = {
        code: data.code,
        name: data.name,
        description: data.description,
        credits: String(data.credits),
        semester: data.semester,
        prerequisites: typeof data.prerequisites === 'object' ? data.prerequisites.join(', ') : (data.prerequisites || ''),
        capacity: data.capacity,
        isActive: selectedModule.is_active,
      };
      
      // Call the API to update the module
      const updateResponse = await updateModule(selectedModule.module_id, moduleData);
      console.log('Module update response:', updateResponse);
      
      // Show success toast
      toast({
        title: "Module Updated",
        description: updateResponse.message || `Module ${data.code} - ${data.name} has been updated successfully.`,
      });
      
      // Refresh the modules list
      const response = await getDepartmentModules();
      if (response.success) {
        setModules(response.data.modules || []);
      }
      
      setIsEditDialogOpen(false);
      setSelectedModule(null);
    } catch (error: any) {
      console.error('Error updating module:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update module. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open the edit dialog and populate form with module data
  const handleEditModule = (module: Module) => {
    setSelectedModule(module);
    setIsEditDialogOpen(true);
    
    editForm.reset({
      code: module.code,
      name: module.title,
      description: module.description,
      credits: Number(module.credits),
      semester: module.semester_id || '',
      prerequisites: typeof module.prerequisites === 'string' ? module.prerequisites : '',
      capacity: Number(module.capacity),
    });
  };

  // Handle module deletion
  const handleDeleteModule = (module: Module) => {
    setSelectedModule(module);
    setIsDeleteDialogOpen(true);
  };

  // Confirm module deletion
  const confirmDeleteModule = async () => {
    try {
      if (!selectedModule) return;
      
      setLoading(true);
      
      // Call the API to delete the module
      const deleteResponse = await deleteModule(selectedModule.module_id);
      console.log('Module deletion response:', deleteResponse);
      
      // Show success toast
      toast({
        title: "Module Deleted",
        description: deleteResponse.message || `Module ${selectedModule.code} - ${selectedModule.title} has been deleted successfully.`,
      });
      
      // Refresh the modules list
      const response = await getDepartmentModules();
      if (response.success) {
        setModules(response.data.modules || []);
      }
      
      setIsDeleteDialogOpen(false);
      setSelectedModule(null);
    } catch (error: any) {
      console.error('Error deleting module:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete module. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle assigning staff to a module
  const handleAssignStaff = (module: Module) => {
    setSelectedModule(module);
    setIsAssignStaffDialogOpen(true);
  };

  // Submit staff assignment
  const submitStaffAssignment = async () => {
    try {
      if (!selectedModule || !selectedStaffId || !selectedStaffRole) {
        toast({
          title: "Error",
          description: "Please select a staff member and role.",
          variant: "destructive"
        });
        return;
      }
      
      setLoading(true);
      
      // Prepare assignment data
      const assignmentData: StaffAssignmentData = {
        staffId: selectedStaffId,
        role: selectedStaffRole
      };
      
      // Call the API to assign staff to the module
      const assignResponse = await assignStaffToModule(selectedModule.module_id, assignmentData);
      console.log('Staff assignment response:', assignResponse);
      
      // Show success toast
      toast({
        title: "Staff Assigned",
        description: assignResponse.message || `Staff has been assigned to module ${selectedModule.code} - ${selectedModule.title} successfully.`,
      });
      
      // Refresh the modules list
      const response = await getDepartmentModules();
      if (response.success) {
        setModules(response.data.modules || []);
      }
      
      setIsAssignStaffDialogOpen(false);
      setSelectedModule(null);
      setSelectedStaffId('');
      setSelectedStaffRole('');
    } catch (error: any) {
      console.error('Error assigning staff:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to assign staff. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Department Module Management</h1>
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              {department ? `${department.name} Department - ` : ''}Module Management
            </h1>
            <p className="text-gray-500">
              {department ? `${department.name} Department` : 'Loading department information...'}
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Module
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-8">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <p className="mt-2 text-red-500">{error}</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="flex flex-col items-center py-8">
            <p className="text-gray-500">No modules found.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Search modules..."
                  className="w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select
                  value={selectedSemester}
                  onValueChange={setSelectedSemester}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Semesters">All Semesters</SelectItem>
                    <SelectItem value="Autumn 2024">Autumn 2024</SelectItem>
                    <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                    <SelectItem value="Summer 2025">Summer 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TableList
              data={filteredModules}
              columns={[
                { header: 'Code', key: 'code', accessor: (row: Module) => row.code },
                { header: 'Title', key: 'title', accessor: (row: Module) => row.title },
                { header: 'Credits', key: 'credits', accessor: (row: Module) => row.credits },
                { header: 'Semester', key: 'semester', accessor: (row: Module) => row.semester },
                { header: 'Status', key: 'status', accessor: (row: Module) => row.status, cell: (row: Module) => (
                  <Badge variant={row.is_active ? 'default' : 'destructive'}>
                    {row.status}
                  </Badge>
                )},
                { header: 'Enrolled', key: 'enrolled_students', accessor: (row: Module) => row.enrolled_students },
                { header: 'Instructors', key: 'instructors', accessor: (row: Module) => row.instructors, cell: (row: Module) => (
                  <div className="max-w-[200px] overflow-hidden">
                    {row.instructors && row.instructors[0] !== 'null' ? (
                      row.instructors.filter((i: string) => i !== 'null').join(', ')
                    ) : (
                      <span className="text-gray-400 italic">No instructors assigned</span>
                    )}
                  </div>
                )},
                { header: 'Actions', key: 'actions', accessor: () => null, cell: (row: Module) => (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAssignStaff(row)}
                      title="Assign Staff"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditModule(row)}
                      title="Edit Module"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteModule(row)}
                      title="Delete Module"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              ] as Column[]}
              pagination={{
                currentPage: 1,
                totalPages: Math.ceil(filteredModules.length / 10),
                totalItems: filteredModules.length,
                itemsPerPage: 10,
                onPageChange: () => {}
              }}
            />
          </>
        )}

        {/* Create Module Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Module</DialogTitle>
              <DialogDescription>
                Add a new module to the {department?.name} department.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module Code</FormLabel>
                        <FormControl>
                          <Input placeholder="CS101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="credits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credits</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduction to Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Autumn 2024">Autumn 2024</SelectItem>
                            <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                            <SelectItem value="Summer 2025">Summer 2025</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Module description"
                          className="resize-none h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="prerequisites"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prerequisites (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="CS100, MATH101" {...field} />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of prerequisite module codes.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Module</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Module Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Module</DialogTitle>
              <DialogDescription>
                Update module information.
              </DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit as any)} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="credits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credits</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Autumn 2024">Autumn 2024</SelectItem>
                            <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                            <SelectItem value="Summer 2025">Summer 2025</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          className="resize-none h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="prerequisites"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prerequisites (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of prerequisite module codes.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this module? This action cannot be undone.
                {selectedModule && Number(selectedModule.enrolled_students) > 0 && (
                  <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    This module has {selectedModule.enrolled_students} enrolled students. 
                    It will be marked as inactive instead of being deleted.
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedModule && (
                <div className="space-y-1">
                  <p><strong>Code:</strong> {selectedModule.code}</p>
                  <p><strong>Name:</strong> {selectedModule.title}</p>
                  <p><strong>Semester:</strong> {selectedModule.semester}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={confirmDeleteModule}>
                {selectedModule && Number(selectedModule.enrolled_students) > 0 ? 'Mark as Inactive' : 'Delete Module'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Staff Dialog */}
        <Dialog open={isAssignStaffDialogOpen} onOpenChange={setIsAssignStaffDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Assign Staff to Module</DialogTitle>
              <DialogDescription>
                {selectedModule && `Assign staff to ${selectedModule.code} - ${selectedModule.title}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Staff Member</label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((staffMember) => (
                      <SelectItem key={staffMember.id} value={staffMember.id}>
                        {staffMember.position} {staffMember.firstName} {staffMember.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={selectedStaffRole} onValueChange={setSelectedStaffRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="teaching_assistant">Teaching Assistant</SelectItem>
                    <SelectItem value="lab_supervisor">Lab Supervisor</SelectItem>
                    <SelectItem value="guest_lecturer">Guest Lecturer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedModule && selectedModule.staff_ids && selectedModule.staff_ids.length > 0 && selectedModule.staff_ids[0] !== 'null' && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Currently Assigned Staff</h4>
                  <ul className="space-y-1 text-sm">
                    {selectedModule.instructors.map((name, index) => {
                      if (name === 'null') return null;
                      return (
                        <li key={index} className="flex justify-between">
                          <span>{name}</span>
                          <span className="text-gray-500">{selectedModule.staff_roles[index]}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAssignStaffDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitStaffAssignment} disabled={!selectedStaffId || !selectedStaffRole}>
                Assign Staff
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ManageModules;