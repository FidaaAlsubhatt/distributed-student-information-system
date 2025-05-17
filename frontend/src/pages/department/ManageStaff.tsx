import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableList from '@/components/dashboard/TableList';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Loader2, UserPlus, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// --- Zod schema for staff form
const staffFormSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  staffId: z.string().min(1, "Required"),
  position: z.string().min(1, "Required"),
  universityEmail: z.string().email("Invalid email"),
  gender: z.enum(['male','female','other','prefer_not_to_say']),
  dateOfBirth: z.string().refine(d => !!Date.parse(d), "Invalid date"),
});

const createStaffSchema = staffFormSchema.extend({
  role: z.literal('academic_staff'),
  email: z.string().email("Invalid email"),
});

type CreateStaffData = z.infer<typeof createStaffSchema>;

// --- Staff type
interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  staffId: string;
  position: string;
  universityEmail: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  status: string;
}

const ManageStaff: React.FC = () => {
  const { toast } = useToast();
  const { activeDepartment } = useUser();
  const deptCode = activeDepartment?.departmentCode!;
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  useEffect(() => {
    if (!deptCode) return;
    setIsLoading(true);
    
    // Get staff data using the departmentAdmin endpoint
    api.getDepartmentStaff(deptCode)
      .then((response: any) => {
        // Backend controller returns data in { users: [...], department: '...' } format
        if (response && response.users && Array.isArray(response.users)) {
          setStaff(response.users);
          // Update document title with department name if available
          if (response.department) {
            document.title = `Staff Management - ${response.department}`;
          }
        } else if (Array.isArray(response)) {
          // Handle direct array response for backward compatibility
          setStaff(response);
        } else {
          console.error('Unexpected staff data format:', response);
          toast({ 
            title: "Error", 
            description: "Received invalid staff data format", 
            variant: "destructive" 
          });
          
          // Fallback to empty array
          setStaff([]);
        }
      })
      .catch((error) => {
        console.error('Error loading staff:', error);
        toast({ 
          title: "Error", 
          description: "Cannot load staff: " + (error.message || 'Unknown error'), 
          variant: "destructive" 
        });
        
        // Fallback to empty array
        setStaff([]);
      })
      .finally(() => setIsLoading(false));
  }, [deptCode, toast]);

  const form = useForm<CreateStaffData>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { 
      firstName:'', 
      lastName:'', 
      staffId:'', 
      position:'', 
      universityEmail:'', 
      email: '', 
      gender:'prefer_not_to_say', 
      dateOfBirth:'', 
      role: 'academic_staff' 
    }
  });

  const onSubmit = async (data: CreateStaffData) => {
    setIsSubmitting(true);
    try {
      // Ensure date format is YYYY-MM-DD for backend compatibility
      // but don't try to convert if it's already in that format
      let dateOfBirth = data.dateOfBirth;
      if (data.dateOfBirth && !data.dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(data.dateOfBirth);
        dateOfBirth = date.toISOString().split('T')[0];
      }
      
      // Create a new staff data object with all required fields
      const staffData = {
        firstName: data.firstName,
        lastName: data.lastName,
        staffId: data.staffId,
        position: data.position,
        universityEmail: data.universityEmail,
        email: data.email,
        gender: data.gender || 'prefer_not_to_say',
        dateOfBirth: dateOfBirth || new Date().toISOString().split('T')[0],
        role: 'academic_staff' as const
      };
      
      console.log('Submitting staff data:', staffData);
      
      // Send staff data to the backend
      const response = await api.addAcademicStaff(staffData, deptCode);
      
      // Handle the response structure returned by our backend
      const added = response.user || response;
      
      // Update the staff list with the new member
      setStaff(prev => [...prev, added]);
      toast({ 
        title: "Staff Added", 
        description: `${data.firstName} ${data.lastName} was successfully added.` 
      });
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      form.reset();
    } catch (e: any) {
      console.error('Error adding staff:', e);
      toast({ 
        title: "Error", 
        description: e.message || 'Failed to add staff member', 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle updating staff member
  const handleUpdate = async (data: CreateStaffData) => {
    if (!selectedStaff) return;
    
    setIsSubmitting(true);
    try {
      // Format date to YYYY-MM-DD for backend compatibility
      if (data.dateOfBirth) {
        const date = new Date(data.dateOfBirth);
        data.dateOfBirth = date.toISOString().split('T')[0];
      }
      
      // Send update to backend with role explicitly set
      await api.updateStaff(selectedStaff.id, {
        ...data,
        role: 'academic_staff' // Ensure role is included
      }, deptCode);
      
      // Update the staff list
      setStaff(prev => prev.map(s => s.id === selectedStaff.id ? {
        ...s,
        ...data,
        email: data.email,
        universityEmail: data.universityEmail || data.email
      } : s));
      
      toast({ 
        title: "Staff Updated", 
        description: `${data.firstName} ${data.lastName}'s information has been updated.` 
      });
      
      // Close dialog and reset
      setIsEditDialogOpen(false);
      setSelectedStaff(null);
      form.reset();
    } catch (e: any) {
      console.error('Error updating staff:', e);
      toast({ 
        title: "Error", 
        description: e.message || 'Failed to update staff member', 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) {
      return; // User canceled the operation
    }
    
    setIsLoading(true);
    try {
      await api.deleteStaff(id, deptCode);
      
      // Refresh the staff listI 
      setStaff(prev => prev.filter(s => s.id !== id));
      
      toast({ 
        title: "Staff Deleted", 
        description: "The staff member has been removed from your department." 
      });
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      toast({ 
        title: "Error", 
        description: error.message || 'Failed to delete staff member', 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key:'name', header:'Name', cell:(s:Staff)=><>{s.firstName} {s.lastName}</> },
    { key:'staffId', header:'Staff ID', cell:(s:Staff)=><>{s.staffId}</> },
    { key:'position', header:'Position', cell:(s:Staff)=><>{s.position}</> },
    { key:'email', header:'Email', cell:(s:Staff)=><>{s.universityEmail}</> },
    { key:'actions', header:'Actions', cell:(s:Staff)=>
      <div className="flex space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setSelectedStaff(s);
            // Format date for HTML date input (expects YYYY-MM-DD)
            let formattedDate = s.dateOfBirth;
            try {
              // Parse UK format (DD/MM/YYYY) to ISO format (YYYY-MM-DD)
              if (s.dateOfBirth && s.dateOfBirth.includes('/')) {
                const [day, month, year] = s.dateOfBirth.split('/');
                formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
            } catch (e) {
              console.error('Error parsing date:', e);
              // Keep original if parsing fails
            }

            // Initialize form with staff data
            form.reset({
              firstName: s.firstName,
              lastName: s.lastName,
              staffId: s.staffId,
              position: s.position,
              universityEmail: s.universityEmail,
              email: s.email, 
              gender: s.gender as any,
              dateOfBirth: formattedDate,
              role: 'academic_staff'
            });
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
        <h2 className="text-2xl font-bold">Manage Staff</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="mr-2"/>Add Staff</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Staff Member</DialogTitle></DialogHeader>
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
                <FormField name="staffId" control={form.control} render={({field})=>(
                  <FormItem>
                    <FormLabel>Staff ID</FormLabel>
                    <FormControl><Input {...field}/></FormControl>
                    <FormMessage/>
                  </FormItem>
                )}/>
                <FormField name="position" control={form.control} render={({field})=>(
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl><Input {...field}/></FormControl>
                    <FormMessage/>
                  </FormItem>
                )}/>
                <FormField name="universityEmail" control={form.control} render={({field})=>(
                  <FormItem>
                    <FormLabel>University Email</FormLabel>
                    <FormControl><Input type="email" {...field}/></FormControl>
                    <FormMessage/>
                  </FormItem>
                )}/>
                <FormField name="email" control={form.control} render={({field})=>(
                  <FormItem>
                    <FormLabel>Personal Email</FormLabel>
                    <FormControl><Input type="email" {...field}/></FormControl>
                    <FormMessage/>
                  </FormItem>
                )}/>
                <FormField name="gender" control={form.control} render={({field})=>(
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value || 'prefer_not_to_say'}>
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
        
        {/* Edit Staff Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>
                Update staff member information
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
                    name="universityEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>University Email</FormLabel>
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
                    name="staffId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Staff ID</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
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
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
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
                      'Update Staff Member'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading 
        ? <div className="py-10 text-center"><Loader2 className="animate-spin text-primary h-8 w-8"/></div>
        : <TableList columns={columns} data={staff}/>
      }
    </DashboardLayout>
  );
};

export default ManageStaff;
