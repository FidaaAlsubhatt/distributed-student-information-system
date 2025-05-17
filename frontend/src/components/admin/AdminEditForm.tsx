import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useDepartments, useUpdateAdmin } from '@/hooks/use-users';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Form validation schema
const formSchema = z.object({
  firstName: z.string().min(2, { message: 'First name is required' }),
  lastName: z.string().min(2, { message: 'Last name is required' }),
  departmentId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']),
});

// Form values type
type FormValues = z.infer<typeof formSchema>;

interface AdminUser {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
  departmentId?: string;
  status: string;
}

interface AdminEditFormProps {
  admin: AdminUser;
  isOpen: boolean;
  onClose: () => void;
}

const AdminEditForm: React.FC<AdminEditFormProps> = ({ admin, isOpen, onClose }) => {
  const { toast } = useToast();
  const updateAdminMutation = useUpdateAdmin();
  const { data: departments = [], isLoading: isLoadingDepartments } = useDepartments();
  const showDepartmentField = admin.role === 'department_admin';

  // Initialize form with admin data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: admin.firstName,
      lastName: admin.lastName,
      departmentId: admin.departmentId,
      status: admin.status as 'active' | 'inactive' | 'suspended',
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      // Update the admin
      await updateAdminMutation.mutateAsync({
        adminId: admin.userId,
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          departmentId: showDepartmentField ? data.departmentId : undefined,
          status: data.status,
        } as any, // Type assertion to avoid TypeScript errors
      });
      
      toast({
        title: 'Success',
        description: 'Administrator updated successfully.',
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating admin:', error);
      toast({
        title: 'Error',
        description: 'Failed to update administrator. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Administrator</DialogTitle>
          <DialogDescription>
            Update the administrator details. Email and role cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="p-2 border rounded-md bg-muted mt-1">
                {admin.email}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Role</label>
              <div className="p-2 border rounded-md bg-muted mt-1">
                {admin.role === 'central_admin' ? 'Central Admin' : 'Department Admin'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
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
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showDepartmentField && (
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingDepartments ? (
                          <SelectItem value="loading" disabled>Loading departments...</SelectItem>
                        ) : (
                          departments.map((dept) => (
                            <SelectItem key={dept.dept_id} value={dept.dept_id}>
                              {dept.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateAdminMutation.isLoading}
              >
                {updateAdminMutation.isLoading ? 'Updating...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditForm;
