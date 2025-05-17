import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableList from '@/components/dashboard/TableList';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Loader2, UserPlus, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// --- Zod schema for student form
const studentFormSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  gender: z.enum(['male','female','other','prefer_not_to_say']),
  dateOfBirth: z.string().refine(d => !!Date.parse(d), "Invalid date"),
  studentNumber: z.string().min(1, "Required"),
  yearOfStudy: z.number().int().min(1).max(6),
  personalEmail: z.string().email("Invalid email").optional(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

// --- Student type
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  yearOfStudy: number;
  personalEmail?: string;
  email?: string; // Add email property
  gender: string;
  dateOfBirth: string;
  status: string;
}

const ManageStudents: React.FC = () => {
  const { toast } = useToast();
  const { activeDepartment } = useUser();
  const deptCode = activeDepartment?.departmentCode!;
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // fetch students
  useEffect(() => {
    if (!deptCode) return;
    setIsLoading(true);
    
    // Use the revised endpoint for student data
    api.getDepartmentStudents(deptCode)
      .then((response: any) => {
        // Backend returns data in { users: [...] } format
        if (response && response.users && Array.isArray(response.users)) {
          setStudents(response.users);
        } else if (Array.isArray(response)) {
          setStudents(response);
        } else {
          console.error('Unexpected student data format:', response);
          toast({ 
            title: "Error", 
            description: "Received invalid student data format", 
            variant: "destructive" 
          });
          
          // Fallback to empty array
          setStudents([]);
        }
      })
      .catch((error) => {
        console.error('Error loading students:', error);
        toast({ 
          title: "Error", 
          description: "Cannot load students: " + (error.message || 'Unknown error'), 
          variant: "destructive" 
        });
        
        // Fallback to empty array
        setStudents([]);
      })
      .finally(() => setIsLoading(false));
  }, [deptCode, toast]);

  // react-hook-form
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: { 
      firstName:'', 
      lastName:'', 
      email:'', 
      gender:'prefer_not_to_say' as const, 
      dateOfBirth:'',
      studentNumber: '',
      yearOfStudy: 1,
      personalEmail: ''
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit: SubmitHandler<StudentFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      // Add required fields for the API
      const studentData = {
        ...data,
        role: 'student' as const
      };
      
      // Send student data to the backend
      const response = await api.addStudent(studentData, deptCode);
      
      // Handle the response structure returned by our backend
      const added = response.user || response;
      
      // Update the students list with the new student
      setStudents(prev => [...prev, added]);
      toast({ 
        title: "Student Added", 
        description: `${data.firstName} ${data.lastName} was successfully added.` 
      });
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      form.reset();
    } catch (e: any) {
      console.error('Error adding student:', e);
      toast({ 
        title: "Error", 
        description: e.message || 'Failed to add student', 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle updating student
  const handleUpdate = async (data: StudentFormValues) => {
    if (!selectedStudent) return;
    
    setIsSubmitting(true);
    try {
      // Send updated data to the backend
      await api.updateStudent(selectedStudent.id, {
        ...data,
        role: 'student' 
      }, deptCode);
      
      // Update the students list
      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? {
        ...s,
        ...data,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        studentNumber: data.studentNumber,
        yearOfStudy: data.yearOfStudy,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        personalEmail: data.personalEmail
      } : s));
      
      toast({ 
        title: "Student Updated", 
        description: `${data.firstName} ${data.lastName}'s information has been updated.` 
      });
      
      // Close dialog and reset
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      form.reset();
    } catch (e: any) {
      console.error('Error updating student:', e);
      toast({ 
        title: "Error", 
        description: e.message || 'Failed to update student', 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return; // User canceled the operation
    }
    
    setIsLoading(true);
    try {
      await api.deleteStudent(id, deptCode);
      
      // Refresh the student list
      setStudents(prev => prev.filter(s => s.id !== id));
      
      toast({ 
        title: "Student Deleted", 
        description: "The student has been removed from your department." 
      });
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast({ 
        title: "Error", 
        description: error.message || 'Failed to delete student', 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // table columns
  const columns = [
    { key:'name', header:'Name', cell:(s:Student)=><>{s.firstName} {s.lastName}</> },
    { key:'number', header:'Student#', cell:(s:Student)=><>{s.studentNumber}</> },
    { key:'year', header:'Year', cell:(s:Student)=><>{s.yearOfStudy}</> },
    { key:'email', header:'Email', cell:(s:Student)=><>{s.personalEmail||'-'}</> },
    { key:'actions', header:'Actions', cell:(s:Student)=>
      <div className="flex space-x-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            // Pre-populate form with student data
            form.reset({
              firstName: s.firstName,
              lastName: s.lastName,
              email: s.email || '',
              gender: (s.gender as "male" | "female" | "other" | "prefer_not_to_say"),
              dateOfBirth: s.dateOfBirth,
              studentNumber: s.studentNumber,
              yearOfStudy: s.yearOfStudy,
              personalEmail: s.personalEmail || ''
            });
            setSelectedStudent(s);
            setIsEditDialogOpen(true);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={()=>handleDelete(s.id)}>
          <Trash2 className="h-4 w-4 text-red-600"/>
        </Button>
      </div>
    }
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Manage Students</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="mr-2"/>Add Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Student</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="firstName" control={form.control} render={({field})=>(
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field}/></FormControl>
                    <FormMessage/>
                  </FormItem>
                )}/>
                <FormField name="lastName" control={form.control} render={({field})=>(
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field}/></FormControl>
                    <FormMessage/>
                  </FormItem>
                )}/>
                <FormField name="email" control={form.control} render={({field})=>(
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field}/></FormControl>
                    <FormMessage/>
                  </FormItem>
                )}/>
                <FormField name="studentNumber" control={form.control} render={({field})=>(
                  <FormItem>
                    <FormLabel>Student Number</FormLabel>
                    <FormControl><Input {...field}/></FormControl>
                    <FormMessage/>
                  </FormItem>
                )}/>
                <FormField name="yearOfStudy" control={form.control} render={({field})=>(
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Select onValueChange={v=>field.onChange(Number(v))} defaultValue={String(field.value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="add-year-1" value="1">Year 1</SelectItem>
                          <SelectItem key="add-year-2" value="2">Year 2</SelectItem>
                          <SelectItem key="add-year-3" value="3">Year 3</SelectItem>
                          <SelectItem key="add-year-4" value="4">Year 4</SelectItem>
                          <SelectItem key="add-year-5" value="5">Year 5</SelectItem>
                          <SelectItem key="add-year-6" value="6">Year 6</SelectItem>
                          <SelectItem key="add-year-7" value="7">Year 7</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}/>
                <FormField name="gender" control={form.control} render={({field})=>(
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="add-gender-male" value="male">Male</SelectItem>
                          <SelectItem key="add-gender-female" value="female">Female</SelectItem>
                          <SelectItem key="add-gender-other" value="other">Other</SelectItem>
                          <SelectItem key="add-gender-prefer" value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}/>
                <FormField name="dateOfBirth" control={form.control} render={({field})=>(
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl><Input type="date" {...field}/></FormControl>
                    <FormMessage/>
                  </FormItem>
                )}/>
                <FormField name="personalEmail" control={form.control} render={({field})=>(
                  <FormItem>
                    <FormLabel>Email (optional)</FormLabel>
                    <FormControl><Input type="email" {...field}/></FormControl>
                    <FormMessage/>
                  </FormItem>
                )}/>
                <DialogFooter>
                  <Button variant="outline" onClick={()=>setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <UserPlus className="mr-2"/>}
                    Add
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="personalEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Email (optional)</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="studentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="yearOfStudy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year of Study</FormLabel>
                      <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key="edit-year-1" value="1">Year 1</SelectItem>
                          <SelectItem key="edit-year-2" value="2">Year 2</SelectItem>
                          <SelectItem key="edit-year-3" value="3">Year 3</SelectItem>
                          <SelectItem key="edit-year-4" value="4">Year 4</SelectItem>
                          <SelectItem key="edit-year-5" value="5">Year 5</SelectItem>
                          <SelectItem key="edit-year-6" value="6">Year 6</SelectItem>
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
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key="edit-gender-male" value="male">Male</SelectItem>
                          <SelectItem key="edit-gender-female" value="female">Female</SelectItem>
                          <SelectItem key="edit-gender-other" value="other">Other</SelectItem>
                          <SelectItem key="edit-gender-prefer" value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Student'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {isLoading 
        ? <div className="py-10 text-center"><Loader2 className="animate-spin text-primary h-8 w-8"/></div>
        : <TableList columns={columns} data={students}/>
      }
    </DashboardLayout>
  );
};

export default ManageStudents;
