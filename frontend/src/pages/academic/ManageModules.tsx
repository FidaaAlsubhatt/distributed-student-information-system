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
  DialogTrigger,
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
import { PlusCircle, Pencil, Trash2, FileText, Users, Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getAcademicModules, deleteModule, updateModule, createModule, ModuleUpdateData, ModuleCreateData } from '@/services/api/staff';

const moduleFormSchema = z.object({
  code: z.string().min(2, { message: "Module code is required" }),
  name: z.string().min(3, { message: "Module name must be at least 3 characters" }),
  credits: z.string().min(1, { message: "Credits are required" }).refine(
    (val) => !isNaN(parseInt(val)), { message: "Credits must be a number" }
  ),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  semester: z.string().min(1, { message: "Semester is required" }),
  prerequisites: z.string().optional(),
});

type FormValues = z.infer<typeof moduleFormSchema>;

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
}

const ManageModules: React.FC = () => {
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
  
  // New module form
  const form = useForm<FormValues>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: {
      code: '',
      name: '',
      credits: '',
      description: '',
      semester: '',
      prerequisites: '',
    },
  });
  
  // Edit module form
  const editForm = useForm<FormValues>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: {
      code: '',
      name: '',
      credits: '',
      description: '',
      semester: '',
      prerequisites: '',
    },
  });
  
  // Handle form submission for new module
  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      
      // Prepare module data for API
      const moduleData: ModuleCreateData = {
        code: data.code,
        name: data.name,
        credits: data.credits,
        description: data.description,
        semester: data.semester,
        prerequisites: data.prerequisites
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
      const response = await getAcademicModules();
      if (response.modules) {
        setModules(response.modules);
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
      setLoading(false);
    }
  };
  
  // Handle form submission for edit module
  const onEditSubmit = async (data: FormValues) => {
    try {
      if (!selectedModule) {
        toast({
          title: "Error",
          description: "No module selected for editing.",
          variant: "destructive"
        });
        return;
      }
      
      setLoading(true);
      
      // Prepare module data for API
      const moduleData: ModuleUpdateData = {
        code: data.code,
        name: data.name,
        credits: data.credits,
        description: data.description,
        semester: data.semester,
        prerequisites: data.prerequisites
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
      const response = await getAcademicModules();
      if (response.modules) {
        setModules(response.modules);
      }
      
      setIsEditDialogOpen(false);
      editForm.reset();
    } catch (error: any) {
      console.error('Error updating module:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update module. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Open the edit dialog and populate form with module data
  const handleEditModule = (module: Module) => {
    setSelectedModule(module);
    editForm.setValue('code', module.code);
    editForm.setValue('name', module.title);
    editForm.setValue('credits', module.credits.toString());
    editForm.setValue('description', module.description);
    editForm.setValue('semester', module.semester);
    setIsEditDialogOpen(true);
  };

  // Handle module deletion
  const handleDeleteModule = (module: Module) => {
    setSelectedModule(module);
    setIsDeleteDialogOpen(true);
  };

  // Confirm module deletion
  const confirmDeleteModule = async () => {
    try {
      if (!selectedModule) {
        toast({
          title: "Error",
          description: "No module selected for deletion.",
          variant: "destructive"
        });
        return;
      }

      setLoading(true);

      // Call the API to delete the module
      const response = await deleteModule(selectedModule.module_id);
      console.log('Module deletion response:', response);

      // Update the local state to remove the deleted module
      setModules(prevModules => prevModules.filter(m => m.module_id !== selectedModule.module_id));

      // Show success toast
      toast({
        title: "Module Deleted",
        description: response.message || `Module ${selectedModule.code} has been deleted successfully.`,
      });

      setIsDeleteDialogOpen(false);
      setSelectedModule(null);
    } catch (error: any) {
      console.error('Error deleting module:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete module. It may have enrolled students or be referenced by other modules.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Module details dialog content
  const ModuleDetailsContent = ({ module }: { module: Module }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{module.code}</h2>
          <p className="text-gray-500">{module.title}</p>
        </div>
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
          Active
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
        <div>
          <p className="text-gray-500">Credits</p>
          <p className="font-medium">{module.credits}</p>
        </div>
        <div>
          <p className="text-gray-500">Instructor</p>
          <p className="font-medium">{module.instructor}</p>
        </div>
        <div>
          <p className="text-gray-500">Semester</p>
          <p className="font-medium">{module.semester}</p>
        </div>
        <div>
          <p className="text-gray-500">Status</p>
          <p className="font-medium">{module.is_active ? 'Active' : 'Inactive'}</p>
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-gray-500">Description</p>
        <p className="mt-1">
          {module.description || 'No description available for this module.'}
        </p>
      </div>

      <div className="border-t pt-4">
        <p className="text-gray-500">Prerequisites</p>
        <p className="mt-1">None</p>
      </div>

      <div className="border-t pt-4 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => handleEditModule(module)}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit Module
        </Button>
        <Button variant="destructive" className="flex-1" onClick={() => handleDeleteModule(module)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Module
        </Button>
      </div>
    </div>
  );
  
  // Columns for module table
  const moduleColumns = [
    {
      key: 'code',
      header: 'Code',
      cell: (module: Module) => <span className="font-medium text-gray-900">{module.code}</span>
    },
    {
      key: 'name',
      header: 'Module Name',
      cell: (module: Module) => <span className="text-gray-500">{module.title}</span>
    },
    {
      key: 'instructor',
      header: 'Instructor',
      cell: (module: Module) => <span className="text-gray-500">{module.instructor}</span>
    },
    {
      key: 'enrollment',
      header: 'Enrollment',
      cell: (module: Module) => <span className="text-gray-500">{module.enrolled_students} / {module.capacity}</span>
    },
    {
      key: 'credits',
      header: 'Credits',
      cell: (module: Module) => <span className="text-gray-500">{module.credits}</span>
    },
    {
      key: 'semester',
      header: 'Semester',
      cell: (module: Module) => <span className="text-gray-500">{module.semester}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
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
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-blue-600 hover:text-blue-700"
            onClick={() => handleEditModule(module)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDeleteModule(module)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Module</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this module? This action cannot be undone.
              {selectedModule?.enrolled_students > 0 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-700 text-sm">
                    This module has {selectedModule?.enrolled_students} enrolled students. Deleting it will mark it as inactive instead.
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteModule}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Delete Module</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">Manage Modules</h2>
            {department && (
              <Badge className="capitalize bg-blue-100 text-blue-800">
                {department.replace('_schema', '')} Department
              </Badge>
            )}
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Module
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Module</DialogTitle>
                <DialogDescription>
                  Add a new module to your teaching portfolio. Fill in all the required information below.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Module Code</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. CS401" {...field} />
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
                            <Input type="number" placeholder="e.g. 4" {...field} />
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
                          <Input placeholder="e.g. Advanced Database Systems" {...field} />
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
                            placeholder="Provide a detailed description of the module content and objectives..."
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
                          <Input placeholder="e.g. CS201, MATH101" {...field} />
                        </FormControl>
                        <FormDescription>
                          Comma-separated list of prerequisite module codes.
                        </FormDescription>
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
            <p className="text-gray-500 mb-4">You are not currently teaching any modules.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>Create New Module</Button>
          </div>
        )}
        
        {/* Modules content */}
        {!loading && !error && modules.length > 0 && (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active Modules</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming Modules</TabsTrigger>
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
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Module
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="past" className="mt-6">
            <TableList
              columns={moduleColumns.filter(col => col.key !== 'actions')}
              data={modules.filter(module => module.status === 'completed')}
              showSearch={true}
              searchPlaceholder="Search modules..."
              showFilter={true}
              filterOptions={semesterOptions}
              filterPlaceholder="All Semesters"
            />
          </TabsContent>
        </Tabs>
        )}
        
        {/* Edit Module Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Module</DialogTitle>
              <DialogDescription>
                Update the module information. Changes will be reflected immediately.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module Code</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly className="bg-gray-50" />
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
      </div>
    </DashboardLayout>
  );
};

export default ManageModules;
