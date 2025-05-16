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
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
  getAssignments,
  getAcademicModules,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  AssignmentCreateData,
  AssignmentUpdateData
} from '@/services/api/staff';

// Define interfaces
interface Assignment {
  id: string;
  assignment_id?: string;  // Alternative ID field from database
  title: string;
  description: string;
  instructions: string;
  total_marks: number;
  weight: number;
  created_at: string;
  due_date: string;
  dueDate?: string; // For backward compatibility with existing code
  module: string;
  moduleCode: string;
  module_id: string;
  module_code?: string; // For backward compatibility
  module_title?: string; // For backward compatibility
  submission_count?: number;
  enrolled_students?: number;
  status: 'upcoming' | 'due_soon' | 'due_today' | 'overdue' | 'submitted' | 'partially_graded' | 'fully_graded';
}

interface Module {
  module_id: string;
  code: string;
  title: string;
  status: string;
  name?: string;
}

interface FilterOption {
  value: string;
  label: string;
}

// Form schema
const assignmentFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  moduleId: z.string().min(1, { message: "Module is required" }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  totalMarks: z.string().min(1, { message: "Total marks are required" }).refine(
    (val) => !isNaN(parseInt(val)), { message: "Total marks must be a number" }
  ),
  weight: z.string().min(1, { message: "Weight percentage is required" }).refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0 && parseFloat(val) <= 100, 
    { message: "Weight must be a number between 1 and 100" }
  ),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  instructions: z.string().min(10, { message: "Instructions must be at least 10 characters" }),
});

type FormValues = z.infer<typeof assignmentFormSchema>;

const ManageAssignments: React.FC = () => {
  const { toast } = useToast();

  // State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [modules, setModules]         = useState<Module[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string|null>(null);

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen]     = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected]       = useState<Assignment|null>(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');

  // Fetch both lists once on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [{ assignments }, { modules }] = await Promise.all([
          getAssignments(),
          getAcademicModules()
        ]);
        setAssignments(assignments);
        setModules(modules);
      } catch (e) {
        setError('Unable to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Form hooks (reuse one schema for create & edit)
  const form = useForm<FormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: '',
      moduleId: '',
      dueDate: new Date(),
      totalMarks: '',
      weight: '',
      description: '',
      instructions: ''
    }
  });

  // Create handler
  const handleCreate = async (data: FormValues) => {
    setLoading(true);
    try {
      const createData: AssignmentCreateData = {
        title: data.title,
        moduleId: data.moduleId,
        dueDate: data.dueDate,
        totalMarks: data.totalMarks,
        weight: data.weight,
        description: data.description,
        instructions: data.instructions
      };
      await createAssignment(createData);
      const { assignments } = await getAssignments();
      setAssignments(assignments);
      toast({ title: 'Assignment created successfully' });
      setCreateOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({ title: 'Failed to create assignment', variant:'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Update handler
  const handleUpdate = async (data: FormValues) => {
    if (!selected) return;
    setLoading(true);
    try {
      const updateData: AssignmentUpdateData = {
        title: data.title,
        dueDate: data.dueDate,
        totalMarks: data.totalMarks,
        weight: data.weight,
        description: data.description,
        instructions: data.instructions
      };
      
      // Make sure we're using the correct ID field - could be id or assignment_id
      const assignmentId = selected.id || selected.assignment_id;
      
      if (!assignmentId) {
        throw new Error('Assignment ID is undefined');
      }
      
      await updateAssignment(assignmentId, updateData);
      const { assignments } = await getAssignments();
      setAssignments(assignments);
      toast({ title: 'Assignment updated successfully' });
      setEditOpen(false);
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({ title: 'Failed to update assignment', variant:'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      // Make sure we're using the correct ID field - could be id or assignment_id
      const assignmentId = selected.id || selected.assignment_id;
      
      if (!assignmentId) {
        throw new Error('Assignment ID is undefined');
      }
      
      await deleteAssignment(assignmentId);
      const { assignments } = await getAssignments();
      setAssignments(assignments);
      toast({ title: 'Assignment deleted successfully' });
      setDeleteOpen(false);
      setSelected(null);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({ title: 'Failed to delete assignment', variant:'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Filter assignments based on search term and selected module
  const filteredAssignments = assignments.filter(assignment => {
    const moduleCode = assignment.module_code || assignment.moduleCode || '';
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        moduleCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === 'all' || 
                         assignment.module_id === selectedModule;
    return matchesSearch && matchesModule;
  });

  // Module filter options
  const moduleOptions: FilterOption[] = [
    { value: 'all', label: 'All Modules' },
    ...modules.map(module => ({
      value: module.module_id,
      label: `${module.code}: ${module.title}`
    }))
  ];

  // Columns definition for TableList
  const columns = [
    {
      key: 'title',
      header: 'Title',
      accessor: 'title',
      cell: (assignment: Assignment) => (
        <div>
          <div className="font-medium">{assignment.title}</div>
          <div className="text-sm text-muted-foreground">{assignment.module_code || assignment.moduleCode}</div>
        </div>
      )
    },
    {
      key: 'due_date',
      header: 'Due Date',
      accessor: 'due_date',
      cell: (assignment: Assignment) => {
        const dateString = assignment.due_date || assignment.dueDate || '';
        try {
          return <div>{format(parseISO(dateString), 'dd MMM yyyy')}</div>
        } catch (e) {
          console.error(`Error formatting date: ${dateString}`, e);
          return <div className="text-gray-500">Date unavailable</div>
        }
      }
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'status',
      cell: (assignment: Assignment) => {
        let color = '';
        let displayText = '';
        
        switch(assignment.status) {
          case 'upcoming': 
            color = 'bg-slate-100 text-slate-800'; 
            displayText = 'Upcoming';
            break;
          case 'due_soon': 
            color = 'bg-yellow-100 text-yellow-800'; 
            displayText = 'Due Soon';
            break;
          case 'due_today': 
            color = 'bg-orange-100 text-orange-800'; 
            displayText = 'Due Today';
            break;
          case 'overdue': 
            color = 'bg-red-100 text-red-800'; 
            displayText = 'Overdue';
            break;
          case 'partially_graded': 
            color = 'bg-blue-100 text-blue-800'; 
            displayText = 'Partially Graded';
            break;
          case 'fully_graded': 
            color = 'bg-green-100 text-green-800'; 
            displayText = 'Fully Graded';
            break;
          default:
            color = 'bg-gray-100 text-gray-800';
            // Handle any status value safely with type check
            displayText = typeof assignment.status === 'string' 
              ? assignment.status.replace(/_/g, ' ')
                .replace(/\b\w/g, (c: string) => c.toUpperCase())
              : 'Unknown';
        }
        
        return (
          <Badge className={color}>
            {displayText}
          </Badge>
        );
      }
    },
    {
      key: 'submissions',
      header: 'Submissions',
      accessor: 'submission_count',
      cell: (assignment: Assignment) => (
        <div>{assignment.submission_count} / {assignment.enrolled_students}</div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: 'assignment_id',
      cell: (assignment: Assignment) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setSelected(assignment);
              form.reset({
                title: assignment.title,
                moduleId: assignment.module_id,
                dueDate: parseISO(assignment.due_date),
                totalMarks: assignment.total_marks.toString(),
                weight: assignment.weight ? assignment.weight.toString() : '25',
                description: assignment.description,
                instructions: assignment.instructions
              });
              setEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setSelected(assignment);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Manage Assignments</h2>
        <Button onClick={() => {
          form.reset(); // Reset form when opening create dialog
          setCreateOpen(true);
        }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Assignment
        </Button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Search by title or module code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select 
            value={selectedModule} 
            onValueChange={setSelectedModule}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by module" />
            </SelectTrigger>
            <SelectContent>
              {moduleOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <TableList
          data={filteredAssignments}
          columns={columns}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
            <DialogDescription>
              Add a new assignment for your module. Fill in all the required details below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Assignment title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="moduleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select module" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {modules.map(module => (
                            <SelectItem key={module.module_id} value={module.module_id}>
                              {module.code}: {module.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              variant={"outline"}
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
                        <PopoverContent className="w-auto p-0">
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
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (% of module grade)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="100" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        The percentage this assignment contributes to the final module grade
                      </FormDescription>
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
                        placeholder="Brief description of the assignment" 
                        className="min-h-[80px]" 
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
                    <FormLabel>Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed instructions for students" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Assignment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Update the assignment details below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Assignment title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="moduleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select module" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {modules.map(module => (
                            <SelectItem key={module.module_id} value={module.module_id}>
                              {module.code}: {module.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              variant={"outline"}
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
                        <PopoverContent className="w-auto p-0">
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
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (% of module grade)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="100" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        The percentage this assignment contributes to the final module grade
                      </FormDescription>
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
                        placeholder="Brief description of the assignment" 
                        className="min-h-[80px]" 
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
                    <FormLabel>Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed instructions for students" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Assignment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="py-4">
              <p className="font-medium">{selected.title}</p>
              <p className="text-sm text-muted-foreground">{selected.module_code}: {selected.module_title}</p>
              <div className="mt-2 flex gap-4">
                <span className="text-sm">Due: {format(parseISO(selected.due_date), 'dd MMM yyyy')}</span>
                <span className="text-sm">Marks: {selected.total_marks}</span>
                <span className="text-sm">Weight: {selected.weight || 25}%</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ManageAssignments;
