import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '../../components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../../components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../components/ui/dropdown-menu';
import { useToast } from '../../hooks/use-toast';
import TableList from '../../components/dashboard/TableList';
import AdminUserForm from '../../components/admin/AdminUserForm';
import { useUsers, useDepartments, User, Department } from '../../hooks/use-users';
import { 
  Building, 
  UserPlus, 
  Check, 
  Settings, 
  Users, 
  Pencil, 
  BarChart,
  Book
} from 'lucide-react';

// Form schema for new department
const departmentFormSchema = z.object({
  name: z.string().min(3, { message: "Department name must be at least 3 characters" }),
  code: z.string().min(2, { message: "Department code is required" }),
  head: z.string().min(3, { message: "Department head name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  campus: z.string().min(1, { message: "Campus is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
});

type FormValues = z.infer<typeof departmentFormSchema>;

// Helper function to get initials from a name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
};

// Helper function to format department data
const formatDepartment = (dept: Department) => {
  const avgGpa = (Math.random() * 1 + 3).toFixed(1);
  return {
    id: dept.dept_id,
    name: dept.name,
    code: dept.name.split(' ')[0].substring(0, 3).toUpperCase(),
    head: 'Department Head',
    email: dept.contact_email || `${dept.name.toLowerCase().replace(/\s+/g, '.')}@university.edu`,
    students: Math.floor(Math.random() * 1000) + 500, // Placeholder for now
    staff: Math.floor(Math.random() * 100) + 20, // Placeholder for now
    avgGpa: avgGpa, // Placeholder for now
    campus: dept.host?.includes('cs') ? 'Computer Science Campus' : 'Mathematics Campus',
    established: 1950 + Math.floor(Math.random() * 50), // Placeholder for now
    status: dept.status || 'active',
    modules: [] // Add empty modules array to prevent errors
  };
};

const DepartmentManagement: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('departments');
  const [selectedDepartment, setSelectedDepartment] = useState<typeof extendedDepartments[0] | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAdminFormOpen, setIsAdminFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch users and departments from the API
  const { data: users = [], isLoading: isLoadingUsers, isError: isErrorUsers } = useUsers();
  const { data: dbDepartments = [], isLoading: isLoadingDepartments, isError: isErrorDepartments } = useDepartments();
  
  // Type assertion for users and departments
  const typedUsers = users as User[];
  const typedDepartments = dbDepartments as Department[];
  
  // Format departments for display
  const extendedDepartments = typedDepartments.map(formatDepartment);

  // Filter admin users (central_admin and department_admin roles)
  const adminUsers = typedUsers.filter(user => 
    user.role === 'central_admin' || user.role === 'department_admin'
  );

  // Format admin users for the UI
  const formattedAdminUsers = adminUsers.map(user => {
    const fullName = user.fullName || `${user.firstName} ${user.lastName}`;
    return {
      id: user.id,
      name: fullName,
      email: user.email,
      department: user.roleScope === 'department' ? 
        typedDepartments.find(dept => dept.dept_id === user.departmentId)?.name || 'Not Assigned' : 
        'All Departments',
      role: user.role === 'central_admin' ? 'Central Admin' : 'Department Admin',
      initials: getInitials(fullName)
    };
  });

  // Filter departments based on search
  const filteredDepartments = extendedDepartments.filter(department => 
    !searchQuery || 
    department.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    department.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    department.head.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter admins based on search
  const filteredAdmins = formattedAdminUsers.filter(admin => 
    !searchQuery || 
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.department.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // New department form
  const form = useForm<FormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: '',
      code: '',
      head: '',
      email: '',
      campus: '',
      description: '',
    },
  });
  
  // Handle form submission for new department
  const onSubmit = (data: FormValues) => {
    toast({
      title: "Department Created",
      description: `${data.name} department has been created successfully.`,
    });
    setIsDetailsOpen(false);
    form.reset();
  };
  
  // Department details dialog content
  const DepartmentDetailsContent = ({ department }: { department: typeof extendedDepartments[0] }) => (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{department.name}</h2>
          <p className="text-gray-500">Code: {department.code} • Est. {department.established}</p>
          <Badge 
            className="mt-2"
            variant="outline"
            color="green"
          >
            Active
          </Badge>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="h-4 w-4" />
            <span className="text-sm">{department.students} Students</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="h-4 w-4" />
            <span className="text-sm">{department.staff} Staff</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Book className="h-4 w-4" />
            <span className="text-sm">{department.modules} Modules</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
        <div>
          <p className="text-gray-500">Department Head</p>
          <p className="font-medium">{department.head}</p>
        </div>
        <div>
          <p className="text-gray-500">Contact Email</p>
          <p className="font-medium">{department.email}</p>
        </div>
        <div>
          <p className="text-gray-500">Campus</p>
          <p className="font-medium">{department.campus}</p>
        </div>
        <div>
          <p className="text-gray-500">Average GPA</p>
          <p className="font-medium">{department.avgGpa}/4.0</p>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <p className="text-gray-500">Description</p>
        <p className="mt-1">
          The {department.name} department offers a comprehensive curriculum designed to prepare students for successful careers in the field. 
          With a focus on both theoretical foundations and practical applications, our programs provide students with the knowledge and skills needed to excel.
        </p>
      </div>
      
      <div className="border-t pt-4 flex gap-2">
        <Button variant="outline" className="flex-1">
          <Pencil className="h-4 w-4 mr-2" />
          Edit Department
        </Button>
        <Button variant="outline" className="flex-1">
          <BarChart className="h-4 w-4 mr-2" />
          View Statistics
        </Button>
      </div>
    </div>
  );
  
  // Department columns
  const departmentColumns = [
    {
      key: 'name',
      header: 'Department',
      cell: (department: typeof extendedDepartments[0]) => (
        <div>
          <div className="font-medium text-gray-900">{department.name}</div>
          <div className="text-sm text-gray-500">Code: {department.code}</div>
        </div>
      )
    },
    {
      key: 'head',
      header: 'Department Head',
      cell: (department: typeof extendedDepartments[0]) => (
        <div className="text-gray-700">{department.head}</div>
      )
    },
    {
      key: 'campus',
      header: 'Campus',
      cell: (department: typeof extendedDepartments[0]) => (
        <div className="text-gray-700">{department.campus}</div>
      )
    },
    {
      key: 'stats',
      header: 'Statistics',
      cell: (department: typeof extendedDepartments[0]) => (
        <div className="flex space-x-3 text-sm">
          <span className="text-gray-700">{department.students} Students</span>
          <span className="text-gray-700">•</span>
          <span className="text-gray-700">{department.staff} Staff</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: '',
      cell: (department: typeof extendedDepartments[0]) => (
        <div className="flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Building className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Department Details</DialogTitle>
                <DialogDescription>
                  View detailed information about this department.
                </DialogDescription>
              </DialogHeader>
              <DepartmentDetailsContent department={department} />
            </DialogContent>
          </Dialog>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit Department</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Assign Admin</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BarChart className="mr-2 h-4 w-4" />
                <span>View Statistics</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];
  
  // Admin columns
  const adminColumns = [
    {
      key: 'name',
      header: 'Name',
      cell: (admin: typeof formattedAdminUsers[0]) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{admin.initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{admin.name}</div>
            <div className="text-sm text-muted-foreground">{admin.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'department',
      header: 'Department',
      cell: (admin: typeof formattedAdminUsers[0]) => (
        <div>{admin.department}</div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      cell: (admin: typeof formattedAdminUsers[0]) => (
        <Badge 
          className="bg-purple-100 text-purple-800 border-purple-200"
          variant="outline"
        >
          {admin.role}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      cell: (admin: typeof formattedAdminUsers[0]) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Department Management</h2>
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDetailsOpen(true)} className="inline-flex items-center gap-2">
                <Building className="h-4 w-4" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Department</DialogTitle>
                <DialogDescription>
                  Add a new academic department to the university.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Computer Science" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. CS" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="head"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department Head</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Dr. John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. department@university.edu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="campus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campus</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select campus" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Main Campus">Main Campus</SelectItem>
                            <SelectItem value="North Campus">North Campus</SelectItem>
                            <SelectItem value="South Campus">South Campus</SelectItem>
                            <SelectItem value="Medical Campus">Medical Campus</SelectItem>
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
                          <Input placeholder="Brief description of the department" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit">Create Department</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Department Management Tabs */}
        <Tabs defaultValue="departments" className="w-full" onValueChange={value => setActiveTab(value)}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="admins">Department Admins</TabsTrigger>
            </TabsList>
            
            <div className="relative w-64">
              <Input
                placeholder={`Search ${activeTab === 'departments' ? 'departments' : 'admins'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          <TabsContent value="departments" className="m-0">
            {/* Department Stats */}
            {isLoadingDepartments ? (
              <div className="flex justify-center items-center py-8">
                <p>Loading department data...</p>
              </div>
            ) : isErrorDepartments ? (
              <div className="flex justify-center items-center py-8 text-red-500">
                <p>Error loading department data</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Total Departments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{extendedDepartments.length}</div>
                      <p className="text-sm text-gray-500">Academic departments</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Total Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {extendedDepartments.reduce((sum, dept) => sum + dept.students, 0)}
                      </div>
                      <p className="text-sm text-gray-500">Across all departments</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Total Staff</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {extendedDepartments.reduce((sum, dept) => sum + dept.staff, 0)}
                      </div>
                      <p className="text-sm text-gray-500">Faculty and administration</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Average GPA</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {extendedDepartments.length > 0 ? 
                          (extendedDepartments.reduce((sum, dept) => sum + Number(dept.avgGpa), 0) / extendedDepartments.length).toFixed(1) : 
                          'N/A'}
                      </div>
                      <p className="text-sm text-gray-500">University-wide</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Departments Table */}
                {extendedDepartments.length === 0 ? (
                  <div className="flex justify-center items-center py-8 text-gray-500">
                    <p>No departments found</p>
                  </div>
                ) : (
                  <TableList 
                    columns={departmentColumns}
                    data={filteredDepartments}
                  />
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="admins" className="m-0">
            {isLoadingUsers ? (
              <div className="flex justify-center items-center py-8">
                <p>Loading admin data...</p>
              </div>
            ) : isErrorUsers ? (
              <div className="flex justify-center items-center py-8 text-red-500">
                <p>Error loading admin data</p>
              </div>
            ) : (
              <>
                {/* Admin Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Department Admins</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formattedAdminUsers.length}</div>
                      <p className="text-sm text-gray-500">Active administrators</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Departments Covered</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {new Set(formattedAdminUsers.map(admin => admin.department)).size}
                      </div>
                      <p className="text-sm text-gray-500">With assigned admins</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Admin Roles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {new Set(formattedAdminUsers.map(admin => admin.role)).size}
                      </div>
                      <p className="text-sm text-gray-500">Different role types</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Admins Table */}
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setIsAdminFormOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign New Admin
                  </Button>
                </div>
                
                {/* Admin User Form Dialog */}
                {isAdminFormOpen && (
                  <AdminUserForm 
                    isOpen={isAdminFormOpen} 
                    onClose={() => setIsAdminFormOpen(false)} 
                  />
                )}
                
                {formattedAdminUsers.length === 0 ? (
                  <div className="flex justify-center items-center py-8 text-gray-500">
                    <p>No admin users found</p>
                  </div>
                ) : (
                  <TableList 
                    columns={adminColumns}
                    data={filteredAdmins}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DepartmentManagement;