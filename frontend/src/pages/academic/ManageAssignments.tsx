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
import { format } from 'date-fns';
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  FileText, 
  Upload,
  CheckSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { assignments, modules } from '@/data/mockData';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const assignmentFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  moduleCode: z.string().min(1, { message: "Module is required" }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  totalMarks: z.string().min(1, { message: "Total marks are required" }).refine(
    (val) => !isNaN(parseInt(val)), { message: "Total marks must be a number" }
  ),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  instructions: z.string().min(10, { message: "Instructions must be at least 10 characters" }),
});

type FormValues = z.infer<typeof assignmentFormSchema>;

const ManageAssignments: React.FC = () => {
  const { toast } = useToast();
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  
  const pendingAssignments = assignments.filter(assignment => assignment.status === 'pending');
  const submittedAssignments = assignments.filter(assignment => assignment.status === 'submitted');
  const gradedAssignments = assignments.filter(assignment => assignment.status === 'graded');
  
  // Filter assignments based on search and module
  const filterAssignments = (assignmentList: typeof assignments) => {
    if (!searchTerm && selectedModule === 'all') return assignmentList;
    
    return assignmentList.filter(assignment => {
      const matchesSearch = !searchTerm || 
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.moduleCode.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesModule = selectedModule === 'all' || assignment.moduleCode === selectedModule;
      
      return matchesSearch && matchesModule;
    });
  };
  
  // New assignment form
  const form = useForm<FormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: '',
      moduleCode: '',
      dueDate: new Date(),
      totalMarks: '',
      description: '',
      instructions: '',
    },
  });
  
  // Edit assignment form
  const editForm = useForm<FormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: '',
      moduleCode: '',
      dueDate: new Date(),
      totalMarks: '',
      description: '',
      instructions: '',
    },
  });
  
  // Handle form submission for new assignment
  const onSubmit = (data: FormValues) => {
    console.log(data);
    toast({
      title: "Assignment Created",
      description: `Assignment "${data.title}" has been created successfully.`,
    });
    setIsCreateDialogOpen(false);
    form.reset();
  };
  
  // Handle form submission for edit assignment
  const onEditSubmit = (data: FormValues) => {
    console.log(data);
    toast({
      title: "Assignment Updated",
      description: `Assignment "${data.title}" has been updated successfully.`,
    });
    setIsEditDialogOpen(false);
    editForm.reset();
  };
  
  // Open the edit dialog and populate form with assignment data
  const handleEditAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    editForm.setValue('title', assignment.title);
    editForm.setValue('moduleCode', assignment.moduleCode);
    editForm.setValue('dueDate', new Date(assignment.dueDate));
    editForm.setValue('totalMarks', '100');
    editForm.setValue('description', 'Complete the assigned tasks and submit your work following the provided instructions.');
    editForm.setValue('instructions', 'Submit your work as a PDF document. Include your name and student ID in the filename.');
    setIsEditDialogOpen(true);
  };
  
  // Assignment details dialog content
  const AssignmentDetailsContent = ({ assignment }: { assignment: any }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{assignment.title}</h2>
          <p className="text-gray-500">{assignment.module} ({assignment.moduleCode})</p>
        </div>
        <Badge 
          className={
            assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
            assignment.status === 'submitted' ? 'bg-blue-100 text-blue-800 border-blue-200' :
            'bg-green-100 text-green-800 border-green-200'
          }
        >
          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
        <div>
          <p className="text-gray-500">Due Date</p>
          <p className="font-medium">{format(new Date(assignment.dueDate), 'PPP')}</p>
        </div>
        <div>
          <p className="text-gray-500">Due Time</p>
          <p className="font-medium">{format(new Date(assignment.dueDate), 'p')}</p>
        </div>
        <div>
          <p className="text-gray-500">Total Marks</p>
          <p className="font-medium">100</p>
        </div>
        <div>
          <p className="text-gray-500">Submissions</p>
          <p className="font-medium">{assignment.submissionCount || 0}</p>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <p className="text-gray-500">Description</p>
        <p className="mt-1">
          Complete the assigned tasks and submit your work following the provided instructions.
        </p>
      </div>
      
      <div className="border-t pt-4">
        <p className="text-gray-500">Instructions</p>
        <p className="mt-1">Submit your work as a PDF document. Include your name and student ID in the filename.</p>
      </div>
      
      <div className="border-t pt-4 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => handleEditAssignment(assignment)}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit Assignment
        </Button>
        <Button variant="destructive" className="flex-1">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Assignment
        </Button>
      </div>
    </div>
  );
  
  // Columns for assignment table
  const assignmentColumns = [
    {
      key: 'title',
      header: 'Assignment',
      cell: (assignment: any) => (
        <div>
          <span className="font-medium text-gray-900">{assignment.title}</span>
          <p className="text-sm text-gray-500">{assignment.module} ({assignment.moduleCode})</p>
        </div>
      )
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      cell: (assignment: any) => (
        <span className="text-gray-500">
          {format(new Date(assignment.dueDate), 'PP')}
          <p className="text-xs">{format(new Date(assignment.dueDate), 'p')}</p>
        </span>
      )
    },
    {
      key: 'submissions',
      header: 'Submissions',
      cell: (assignment: any) => (
        <span className="text-gray-700 font-medium">
          {assignment.submissionCount || 0}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (assignment: any) => {
        let badgeClass = '';
        let badgeText = '';
        
        switch (assignment.status) {
          case 'pending':
            badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
            badgeText = 'Pending';
            break;
          case 'submitted':
            badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
            badgeText = 'Submitted';
            break;
          case 'graded':
            badgeClass = 'bg-green-100 text-green-800 border-green-200';
            badgeText = 'Graded';
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
      key: 'actions',
      header: 'Actions',
      cell: (assignment: any) => (
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
                <FileText className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Assignment Details</DialogTitle>
                <DialogDescription>View detailed information about this assignment.</DialogDescription>
              </DialogHeader>
              <AssignmentDetailsContent assignment={assignment} />
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-green-600 hover:text-green-700"
            onClick={() => window.location.href = '/grade-assignments'}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-blue-600 hover:text-blue-700"
            onClick={() => handleEditAssignment(assignment)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];
  
  // Module options for filter
  const moduleOptions = [
    { value: 'all', label: 'All Modules' },
    ...modules
      .filter(module => module.status === 'active')
      .map(module => ({
        value: module.code,
        label: `${module.code} - ${module.name}`
      }))
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Manage Assignments</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Add a new assignment for your students. Fill in all the required information below.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignment Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Database Design Project" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="moduleCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select module" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {modules
                              .filter(module => module.status === 'active')
                              .map(module => (
                                <SelectItem key={module.id} value={module.code}>
                                  {module.code} - {module.name}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="totalMarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Marks</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g. 100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide a detailed description of the assignment..."
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
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Submission Instructions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide clear instructions for submission..."
                            className="resize-none h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="border rounded-md p-4">
                    <FormLabel className="mb-2 block">Attachment (Optional)</FormLabel>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-2">Drag and drop files here, or click to select files</p>
                      <p className="text-xs text-gray-400">
                        Supported formats: PDF, DOC, DOCX, ZIP (Max: 10MB)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                      >
                        Select Files
                      </Button>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Assignment</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending ({pendingAssignments.length})</TabsTrigger>
            <TabsTrigger value="submitted">Submitted ({submittedAssignments.length})</TabsTrigger>
            <TabsTrigger value="graded">Graded ({gradedAssignments.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-6">
            <TableList
              columns={assignmentColumns}
              data={filterAssignments(pendingAssignments)}
              showSearch={true}
              searchPlaceholder="Search assignments..."
              showFilter={true}
              filterOptions={moduleOptions}
              filterPlaceholder="All Modules"
              onSearchChange={setSearchTerm}
              onFilterChange={setSelectedModule}
            />
          </TabsContent>
          
          <TabsContent value="submitted" className="mt-6">
            <TableList
              columns={assignmentColumns}
              data={filterAssignments(submittedAssignments)}
              showSearch={true}
              searchPlaceholder="Search assignments..."
              showFilter={true}
              filterOptions={moduleOptions}
              filterPlaceholder="All Modules"
              onSearchChange={setSearchTerm}
              onFilterChange={setSelectedModule}
            />
          </TabsContent>
          
          <TabsContent value="graded" className="mt-6">
            <TableList
              columns={assignmentColumns}
              data={filterAssignments(gradedAssignments)}
              showSearch={true}
              searchPlaceholder="Search assignments..."
              showFilter={true}
              filterOptions={moduleOptions}
              filterPlaceholder="All Modules"
              onSearchChange={setSearchTerm}
              onFilterChange={setSelectedModule}
            />
          </TabsContent>
        </Tabs>
        
        {/* Edit Assignment Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Assignment</DialogTitle>
              <DialogDescription>
                Update the assignment information. Changes will be reflected immediately.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="moduleCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select module" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {modules
                            .filter(module => module.status === 'active')
                            .map(module => (
                              <SelectItem key={module.id} value={module.code}>
                                {module.code} - {module.name}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="totalMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Marks</FormLabel>
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
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submission Instructions</FormLabel>
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

export default ManageAssignments;
