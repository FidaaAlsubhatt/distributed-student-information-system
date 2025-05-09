import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, UserPlus, Mail, Shield, GraduationCap, BookOpen, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define a type alias for the API UserData to avoid conflicts
type DepartmentUserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
  studentNumber?: string;
  yearOfStudy?: number;
  staffId?: string;
  position?: string;
  universityEmail?: string;
  departmentName?: string;
  departmentId?: string;
  createdAt: string;
  roleScope: string;
  fullName: string;
}

const userFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  role: z.enum(['academic_staff', 'student']),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  
  // Common fields
  personalEmail: z.string().email({ message: "Please enter a valid email address" }).optional().or(z.literal('')),
  personalPhone: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  dateOfBirth: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: 'Please enter a valid date',
  }),
  
  // Address fields
  address: z.object({
    line1: z.string().min(1, { message: "Address line 1 is required" }),
    line2: z.string().optional().or(z.literal('')),
    city: z.string().min(1, { message: "City is required" }),
    state: z.string().min(1, { message: "State/Province is required" }),
    postalCode: z.string().min(1, { message: "Postal code is required" }),
    country: z.string().min(1, { message: "Country is required" }),
  }),
  
  // Academic staff specific fields
  staffId: z.string().optional(),
  position: z.string().optional(),
  officeLocation: z.string().optional(),
  officeHours: z.string().optional(),
  researchInterests: z.string().optional(),
  universityEmail: z.string().email({ message: "Please enter a valid university email" }).optional(),
  
  // Student specific fields
  studentNumber: z.string().optional(),
  yearOfStudy: z.number().int().min(1).max(7).optional(),
  enrollmentDate: z.string().optional(),
  phoneNumber: z.string().optional().or(z.literal('')),
}).refine(data => {
  // Require student fields when role is student
  if (data.role === 'student') {
    return !!data.studentNumber && data.yearOfStudy !== undefined;
  }
  // Require academic staff fields when role is academic_staff
  if (data.role === 'academic_staff') {
    return !!data.staffId && !!data.position && !!data.universityEmail;
  }
  return true;
}, {
  message: "Please fill in all required fields for the selected role",
  path: ["role"],
});

type FormValues = z.infer<typeof userFormSchema>;

const ManageUsers: React.FC = () => {
  const { toast } = useToast();
  const { activeDepartment } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // State for API data
  const [users, setUsers] = useState<DepartmentUserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch users when component mounts or activeDepartment changes
  useEffect(() => {
    if (activeDepartment?.departmentCode) {
      setIsLoading(true);
      api.getDepartmentUsers(activeDepartment.departmentCode)
        .then(data => {
          console.log('Fetched department users:', data);
          // Convert API data to our DepartmentUserData type
          const departmentUsers: DepartmentUserData[] = (data || []).map((apiUser: any) => ({
            id: apiUser.id,
            firstName: apiUser.firstName || '',
            lastName: apiUser.lastName || '',
            email: apiUser.email || '',
            role: apiUser.role || '',
            status: apiUser.status || 'inactive',
            avatar: apiUser.avatar,
            studentNumber: apiUser.studentNumber,
            yearOfStudy: apiUser.yearOfStudy,
            staffId: apiUser.staffId,
            position: apiUser.position,
            universityEmail: apiUser.universityEmail,
            departmentName: apiUser.departmentName,
            departmentId: apiUser.departmentId,
            createdAt: apiUser.createdAt || new Date().toISOString(),
            roleScope: apiUser.roleScope || '',
            fullName: `${apiUser.firstName || ''} ${apiUser.lastName || ''}`
          }));
          setUsers(departmentUsers);
        })
        .catch(err => {
          console.error('Error fetching users:', err);
          toast({
            title: "Error",
            description: "Failed to load users. Please try again.",
            variant: "destructive"
          });
        })
        .finally(() => setIsLoading(false));
    } else {
      setUsers([]);
      setIsLoading(false);
    }
  }, [activeDepartment, toast]);
  
  // Filter users based on search term and selected tab
  const filteredUsers = users.filter(user => {
    const matchesSearch = (
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (currentTab === 'all') {
      return matchesSearch;
    } else if (currentTab === 'academics') {
      return matchesSearch && user.role === 'academic_staff';
    } else if (currentTab === 'students') {
      return matchesSearch && user.role === 'student';
    } else if (currentTab === 'admins') {
      return matchesSearch && user.role === 'department_admin';
    }

    return matchesSearch;
  });
  
  // Create filtered lists for each tab
  const academicStaff = users.filter(user => user.role === 'academic_staff');
  const students = users.filter(user => user.role === 'student');
  const departmentAdmins = users.filter(user => user.role === 'department_admin');

  // New user form
  const form = useForm<FormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      role: 'student',
      password: '',
      personalEmail: '',
      personalPhone: '',
      gender: 'prefer_not_to_say',
      dateOfBirth: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      staffId: '',
      position: '',
      officeLocation: '',
      officeHours: '',
      researchInterests: '',
      universityEmail: '',
      studentNumber: '',
      yearOfStudy: 1,
      enrollmentDate: '',
      phoneNumber: '',
    },
    mode: 'onChange',
  });

  const [showStudentFields, setShowStudentFields] = useState(true);
  const [showAcademicFields, setShowAcademicFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission for new user
  const onSubmit = async (data: FormValues) => {
    try {
      if (!activeDepartment) {
        toast({
          title: "Error",
          description: "No active department found. Please contact an administrator.",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      console.log('Form data:', data);

      if (data.role === 'student') {
        // Add student
        const studentData = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.personalEmail || '',  // Required by StudentFormData
          role: 'student' as const,        // Required by StudentFormData
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          personalEmail: data.personalEmail || undefined,
          personalPhone: data.personalPhone || undefined,
          address: data.address,
          studentNumber: data.studentNumber!,
          yearOfStudy: data.yearOfStudy!,
          enrollmentDate: data.enrollmentDate || undefined,
          departmentId: activeDepartment.departmentId,
          departmentCode: activeDepartment.departmentCode,
        };

        const result = await api.addStudent(studentData, activeDepartment.departmentCode);

        toast({
          title: "Student Added",
          description: `${data.firstName} ${data.lastName} has been added as a student. ID: ${result.userId}`,
        });
      } else {
        // Add academic staff
        const academicData = {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          personalEmail: data.personalEmail || undefined,
          personalPhone: data.personalPhone || undefined,
          address: data.address,
          staffId: data.staffId!,
          position: data.position!,
          officeLocation: data.officeLocation || undefined,
          officeHours: data.officeHours || undefined,
          researchInterests: data.researchInterests || undefined,
          universityEmail: data.universityEmail!,
          password: data.password,
          departmentId: activeDepartment.departmentId,
          departmentCode: activeDepartment.departmentCode,
        };

        // This would call the API to add academic staff
        // const result = await api.addAcademicStaff(academicData);

        // For now, just log it since we haven't implemented the API
        console.log('Academic staff data:', academicData);

        toast({
          title: "Academic Staff Added",
          description: `${data.firstName} ${data.lastName} has been added as academic staff.`,
        });
      }

      setIsCreateDialogOpen(false);
      form.reset();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: `Failed to add user: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      toast({
        title: "User Removed",
        description: `${user.firstName} ${user.lastName} has been removed successfully.`,
      });
    }
  };

  // Send password reset
  const handlePasswordReset = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      toast({
        title: "Password Reset Sent",
        description: `Password reset instructions have been sent to ${user.email}.`,
      });
    }
  };

  // Columns for users table
  const userColumns = [
    {
      id: 'user',
      header: 'User',
      cell: (user: DepartmentUserData) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
            ) : (
              <AvatarFallback>{`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{`${user.firstName} ${user.lastName}`}</div>
            <div className="text-gray-500 text-sm">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      id: 'role',
      header: 'Role',
      cell: (user: DepartmentUserData) => {
        let badgeClass = '';
        let roleDisplay = '';

        switch (user.role) {
          case 'academic_staff':
            badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
            roleDisplay = 'Academic Staff';
            break;
          case 'student':
            badgeClass = 'bg-green-100 text-green-800 border-green-200';
            roleDisplay = 'Student';
            break;
          case 'department_admin':
            badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
            roleDisplay = 'Department Admin';
            break;
          default:
            badgeClass = 'bg-gray-100 text-gray-800 border-gray-200';
            roleDisplay = user.role || 'Unknown';
        }

        return (
          <Badge 
            variant="outline" 
            className={badgeClass}
          >
            {roleDisplay}
          </Badge>
        );
      }
    },
    {
      id: 'position',
      header: 'Position',
      cell: (user: DepartmentUserData) => {
        let details = '';

        if (user.role === 'academic_staff') {
          details = user.position || 'N/A';
        } else if (user.role === 'student') {
          details = user.yearOfStudy ? `Year ${user.yearOfStudy} Student` : 'Student';
        } else if (user.role === 'department_admin') {
          details = 'Department Administrator';
        }

        return <div className="text-gray-700">{details}</div>;
      }
    },
    {
      id: 'department',
      header: 'Department',
      cell: (_user: DepartmentUserData) => (
        <div className="text-gray-700">{activeDepartment?.departmentName || 'N/A'}</div>
      )
    },
    {
      id: 'status',
      header: 'Status',
      cell: (user: DepartmentUserData) => (
        <Badge 
          variant="outline" 
          className={user.status === 'active' 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-gray-100 text-gray-800 border-gray-200'}
        >
          {user.status || 'Unknown'}
        </Badge>
      )
    },
    {
      id: 'actions',
      header: '',
      cell: (user: DepartmentUserData) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Pencil className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <UserPlus className="mr-2 h-4 w-4" />
                <span>View Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                <span>Send Email</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePasswordReset(user.id)}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Reset Password</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => handleDeleteUser(user.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Remove User</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Manage Users</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Add a new student or academic staff member to the department.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Role Selection */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Type</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setShowStudentFields(value === 'student');
                            setShowAcademicFields(value === 'academic_staff');
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select user type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="student">
                              <div className="flex items-center">
                                <GraduationCap className="mr-2 h-4 w-4" />
                                <span>Student</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="academic_staff">
                              <div className="flex items-center">
                                <BookOpen className="mr-2 h-4 w-4" />
                                <span>Academic Staff</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Personal Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Personal Information</h3>
                    
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

                    <div className="grid grid-cols-2 gap-4">
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

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="personalEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personal Email (Optional)</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personalPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personal Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Address Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Address</h3>
                    
                    <FormField
                      control={form.control}
                      name="address.line1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address.line2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2 (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Apt 4B" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="New York" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input placeholder="NY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address.postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="10001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address.country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="United States" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Student-specific fields */}
                  {showStudentFields && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Student Information</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="studentNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Student Number</FormLabel>
                              <FormControl>
                                <Input placeholder="S12345678" {...field} />
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
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select year" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5, 6, 7].map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                      Year {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 987-6543" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* Academic Staff-specific fields */}
                  {showAcademicFields && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Academic Staff Information</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="staffId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Staff ID</FormLabel>
                              <FormControl>
                                <Input placeholder="A12345" {...field} />
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
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select position" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Professor">Professor</SelectItem>
                                  <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                                  <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                                  <SelectItem value="Lecturer">Lecturer</SelectItem>
                                  <SelectItem value="Teaching Assistant">Teaching Assistant</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="universityEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>University Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="professor@university.edu" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="officeLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Office Location</FormLabel>
                              <FormControl>
                                <Input placeholder="Building A, Room 123" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="officeHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Office Hours</FormLabel>
                              <FormControl>
                                <Input placeholder="Mon, Wed 2-4pm" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="researchInterests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Research Interests</FormLabel>
                            <FormControl>
                              <Input placeholder="AI, Machine Learning, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* Account Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Account Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !form.formState.isValid}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : 'Add User'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-sm text-gray-500">Active department users</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Academic Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(user => user.role === 'academic_staff').length}
              </div>
              <p className="text-sm text-gray-500">Professors & lecturers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(user => user.role === 'student').length}
              </div>
              <p className="text-sm text-gray-500">Enrolled students</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Administrators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(user => user.role === 'department_admin').length}
              </div>
              <p className="text-sm text-gray-500">Department admins</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Users Table */}
        <div>
          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
            <div className="flex items-center justify-between mb-4">
                <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Users</TabsTrigger>
                <TabsTrigger value="academics">Academic Staff</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
              </TabsList>
              
              <div className="relative w-64">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <TabsContent value="all" className="m-0">
              <div className="rounded-md border overflow-hidden">
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div>
                    {/* Table header */}
                    <div className="grid grid-cols-5 gap-4 bg-muted/50 p-4 font-medium">
                      <div>User</div>
                      <div>Role</div>
                      <div>Position</div>
                      <div>Status</div>
                      <div className="text-right">Actions</div>
                    </div>
                    {/* Table rows */}
                    <div className="divide-y">
                      {filteredUsers.map((user: DepartmentUserData) => (
                        <div key={user.id} className="grid grid-cols-5 gap-4 p-4 items-center hover:bg-muted/50 transition-colors">
                          {userColumns[0].cell(user)}
                          {userColumns[1].cell(user)}
                          {userColumns[2].cell(user)}
                          {userColumns[3].cell(user)}
                          <div className="flex justify-end">
                            {userColumns[4].cell(user)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="academics" className="m-0">
              <div className="rounded-md border overflow-hidden">
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div>
                    {/* Table header */}
                    <div className="grid grid-cols-5 gap-4 bg-muted/50 p-4 font-medium">
                      <div>User</div>
                      <div>Role</div>
                      <div>Position</div>
                      <div>Status</div>
                      <div className="text-right">Actions</div>
                    </div>
                    {/* Table rows */}
                    <div className="divide-y">
                      {academicStaff.map((user: DepartmentUserData) => (
                        <div key={user.id} className="grid grid-cols-5 gap-4 p-4 items-center hover:bg-muted/50 transition-colors">
                          {userColumns[0].cell(user)}
                          {userColumns[1].cell(user)}
                          {userColumns[2].cell(user)}
                          {userColumns[3].cell(user)}
                          <div className="flex justify-end">
                            {userColumns[4].cell(user)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="students" className="m-0">
              <div className="rounded-md border overflow-hidden">
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div>
                    {/* Table header */}
                    <div className="grid grid-cols-5 gap-4 bg-muted/50 p-4 font-medium">
                      <div>User</div>
                      <div>Role</div>
                      <div>Position</div>
                      <div>Status</div>
                      <div className="text-right">Actions</div>
                    </div>
                    {/* Table rows */}
                    <div className="divide-y">
                      {students.map((user: DepartmentUserData) => (
                        <div key={user.id} className="grid grid-cols-5 gap-4 p-4 items-center hover:bg-muted/50 transition-colors">
                          {userColumns[0].cell(user)}
                          {userColumns[1].cell(user)}
                          {userColumns[2].cell(user)}
                          {userColumns[3].cell(user)}
                          <div className="flex justify-end">
                            {userColumns[4].cell(user)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            

          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageUsers;