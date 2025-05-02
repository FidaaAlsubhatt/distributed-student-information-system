import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableList from '@/components/dashboard/TableList';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
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
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  UserPlus,
  User,
  Shield,
  Mail,
  UserX,
  Loader2,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for users
const users = [
  {
    id: '1',
    name: 'Dr. Robert Chen',
    email: 'rchen@university.edu',
    role: 'Academic',
    department: 'Computer Science',
    position: 'Associate Professor',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '2',
    name: 'Prof. Sarah Johnson',
    email: 'sjohnson@university.edu',
    role: 'Academic',
    department: 'Computer Science',
    position: 'Professor',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '3',
    name: 'Dr. Michelle Wong',
    email: 'mwong@university.edu',
    role: 'Academic',
    department: 'Computer Science',
    position: 'Assistant Professor',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '4',
    name: 'Michael Johnson',
    email: 'mjohnson@university.edu',
    role: 'Student',
    department: 'Computer Science',
    position: '3rd Year Student',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '5',
    name: 'Emily Davis',
    email: 'edavis@university.edu',
    role: 'Student',
    department: 'Computer Science',
    position: '3rd Year Student',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '6',
    name: 'David Thompson',
    email: 'dthompson@university.edu',
    role: 'Department Admin',
    department: 'Computer Science',
    position: 'Department Administrator',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  }
];

// Form schema for new user
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

type AddressValues = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const ManageUsers: React.FC = () => {
  const { toast } = useToast();
  const { activeDepartment } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Filter users based on search and tab
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      currentTab === 'all' || 
      (currentTab === 'academics' && user.role === 'Academic') ||
      (currentTab === 'students' && user.role === 'Student') ||
      (currentTab === 'admins' && user.role === 'Department Admin');
    
    return matchesSearch && matchesTab;
  });
  
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
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          personalEmail: data.personalEmail || undefined,
          personalPhone: data.personalPhone || undefined,
          address: data.address,
          studentNumber: data.studentNumber!,
          universityEmail: `${data.studentNumber}@university.edu`,
          phoneNumber: data.phoneNumber || undefined,
          yearOfStudy: data.yearOfStudy!,
          password: data.password,
          departmentId: activeDepartment.departmentId,
          departmentCode: activeDepartment.departmentCode,
        };
        
        const result = await api.addStudent(studentData);
        
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
        description: `${user.name} has been removed successfully.`,
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
      key: 'name',
      header: 'User',
      cell: (user: typeof users[0]) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{user.name}</div>
            <div className="text-gray-500 text-sm">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      cell: (user: typeof users[0]) => {
        let badgeClass = '';
        
        switch (user.role) {
          case 'Academic':
            badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
            break;
          case 'Student':
            badgeClass = 'bg-green-100 text-green-800 border-green-200';
            break;
          case 'Department Admin':
            badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
            break;
        }
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {user.role}
          </Badge>
        );
      }
    },
    {
      key: 'position',
      header: 'Position',
      cell: (user: typeof users[0]) => (
        <div className="text-gray-700">{user.position}</div>
      )
    },
    {
      key: 'department',
      header: 'Department',
      cell: (user: typeof users[0]) => (
        <div className="text-gray-700">{user.department}</div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (user: typeof users[0]) => (
        <Badge 
          variant="outline" 
          className={user.status === 'active' 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-red-100 text-red-800 border-red-200'
          }
        >
          {user.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      cell: (user: typeof users[0]) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Pencil className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
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
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => handleDeleteUser(user.id)}
              >
                <UserX className="mr-2 h-4 w-4" />
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
                {users.filter(user => user.role === 'Academic').length}
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
                {users.filter(user => user.role === 'Student').length}
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
                {users.filter(user => user.role === 'Department Admin').length}
              </div>
              <p className="text-sm text-gray-500">Department admins</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Users Table */}
        <div>
          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All Users</TabsTrigger>
                <TabsTrigger value="academics">Academic Staff</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="admins">Administrators</TabsTrigger>
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
              <TableList 
                columns={userColumns}
                data={filteredUsers}
              />
            </TabsContent>
            
            <TabsContent value="academics" className="m-0">
              <TableList 
                columns={userColumns}
                data={filteredUsers}
              />
            </TabsContent>
            
            <TabsContent value="students" className="m-0">
              <TableList 
                columns={userColumns}
                data={filteredUsers}
              />
            </TabsContent>
            
            <TabsContent value="admins" className="m-0">
              <TableList 
                columns={userColumns}
                data={filteredUsers}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageUsers;