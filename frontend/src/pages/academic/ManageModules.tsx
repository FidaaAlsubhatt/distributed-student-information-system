import React, { useState } from 'react';
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
import { PlusCircle, Pencil, Trash2, FileText, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { modules } from '@/data/mockData';

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

const ManageModules: React.FC = () => {
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  
  const activeModules = modules.filter(module => module.status === 'active');
  
  // Filter modules based on search and semester
  const filteredModules = activeModules.filter(module => {
    const matchesSearch = 
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    
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
  const onSubmit = (data: FormValues) => {
    console.log(data);
    toast({
      title: "Module Created",
      description: `Module ${data.code} - ${data.name} has been created successfully.`,
    });
    setIsCreateDialogOpen(false);
    form.reset();
  };
  
  // Handle form submission for edit module
  const onEditSubmit = (data: FormValues) => {
    console.log(data);
    toast({
      title: "Module Updated",
      description: `Module ${data.code} - ${data.name} has been updated successfully.`,
    });
    setIsEditDialogOpen(false);
    editForm.reset();
  };
  
  // Open the edit dialog and populate form with module data
  const handleEditModule = (module: any) => {
    setSelectedModule(module);
    editForm.setValue('code', module.code);
    editForm.setValue('name', module.name);
    editForm.setValue('credits', module.credits.toString());
    editForm.setValue('description', 'This module covers the fundamental concepts of the subject area and provides students with practical experience through assignments and projects.');
    editForm.setValue('semester', module.semester);
    editForm.setValue('prerequisites', 'None');
    setIsEditDialogOpen(true);
  };
  
  // Module details dialog content
  const ModuleDetailsContent = ({ module }: { module: any }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{module.code}</h2>
          <p className="text-gray-500">{module.name}</p>
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
          <p className="font-medium">Active</p>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <p className="text-gray-500">Description</p>
        <p className="mt-1">
          This module covers the fundamental concepts of the subject area and provides students with practical experience through assignments and projects.
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
        <Button variant="destructive" className="flex-1">
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
      cell: (module: any) => <span className="font-medium text-gray-900">{module.code}</span>
    },
    {
      key: 'name',
      header: 'Module Name',
      cell: (module: any) => <span className="text-gray-500">{module.name}</span>
    },
    {
      key: 'instructor',
      header: 'Instructor',
      cell: (module: any) => <span className="text-gray-500">{module.instructor}</span>
    },
    {
      key: 'credits',
      header: 'Credits',
      cell: (module: any) => <span className="text-gray-500">{module.credits}</span>
    },
    {
      key: 'semester',
      header: 'Semester',
      cell: (module: any) => <span className="text-gray-500">{module.semester}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (module: any) => (
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
        </div>
      )
    }
  ];
  
  // Semester options for filter
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
          <h2 className="text-2xl font-bold text-gray-800">Manage Modules</h2>
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
                            <SelectItem value="Spring 2023">Spring 2023</SelectItem>
                            <SelectItem value="Fall 2023">Fall 2023</SelectItem>
                            <SelectItem value="Spring 2024">Spring 2024</SelectItem>
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
                          <SelectItem value="Spring 2023">Spring 2023</SelectItem>
                          <SelectItem value="Fall 2023">Fall 2023</SelectItem>
                          <SelectItem value="Spring 2024">Spring 2024</SelectItem>
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
