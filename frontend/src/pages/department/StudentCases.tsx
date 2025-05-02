import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import TableList from '@/components/dashboard/TableList';
import { studentCases } from '@/data/mockData';
import { 
  User, 
  Mail, 
  Flag, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  BookOpen, 
  MessageSquare
} from 'lucide-react';

// Form schema for new case
const caseFormSchema = z.object({
  studentId: z.string().min(1, { message: "Student ID is required" }),
  studentName: z.string().min(1, { message: "Student name is required" }),
  issue: z.string().min(5, { message: "Issue description must be at least 5 characters" }),
  module: z.string().min(1, { message: "Module is required" }),
  priority: z.string().min(1, { message: "Priority is required" }),
  details: z.string().min(10, { message: "Additional details must be at least 10 characters" }),
});

type FormValues = z.infer<typeof caseFormSchema>;

const StudentCases: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Filter student cases based on search and tab
  const filteredCases = studentCases.filter(studentCase => {
    const matchesSearch = !searchTerm || 
      studentCase.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentCase.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentCase.module.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      currentTab === 'all' || 
      (currentTab === 'urgent' && studentCase.status === 'urgent') ||
      (currentTab === 'pending' && studentCase.status === 'pending') ||
      (currentTab === 'resolved' && studentCase.status === 'resolved');
    
    return matchesSearch && matchesTab;
  });
  
  // New case form
  const form = useForm<FormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      studentId: '',
      studentName: '',
      issue: '',
      module: '',
      priority: 'medium',
      details: '',
    },
  });
  
  // Handle form submission for new case
  const onSubmit = (data: FormValues) => {
    console.log(data);
    toast({
      title: "Case Created",
      description: "The student case has been created successfully.",
    });
    setIsCreateDialogOpen(false);
    form.reset();
  };
  
  // Handle case resolution
  const handleResolveCase = (caseId: string) => {
    toast({
      title: "Case Resolved",
      description: "The student case has been marked as resolved.",
    });
  };
  
  // Handle case priority change
  const handlePriorityChange = (caseId: string, priority: string) => {
    toast({
      title: "Priority Updated",
      description: `Case priority has been updated to ${priority}.`,
    });
  };
  
  // Case details dialog content
  const CaseDetailsContent = ({ studentCase }: { studentCase: typeof studentCases[0] }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={studentCase.student.avatar} alt={studentCase.student.name} />
          <AvatarFallback>{studentCase.student.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-bold">{studentCase.student.name}</h2>
          <p className="text-gray-500">Student ID: {studentCase.student.id}</p>
        </div>
        <div className="ml-auto">
          <Badge 
            variant="outline" 
            className={
              studentCase.status === 'urgent' 
                ? 'bg-red-100 text-red-800 border-red-200' 
                : studentCase.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  : 'bg-green-100 text-green-800 border-green-200'
            }
          >
            {studentCase.status.charAt(0).toUpperCase() + studentCase.status.slice(1)}
          </Badge>
        </div>
      </div>
      
      <div className="border-t pt-4 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Issue</h3>
          <p className="mt-1 text-gray-900">{studentCase.issue}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500">Module</h3>
          <p className="mt-1 text-gray-900">{studentCase.module}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500">Additional Details</h3>
          <p className="mt-1 text-gray-900">
            The student has been struggling with the course material and has missed several classes due to personal issues. 
            They are requesting additional support and possibly an extension on upcoming assignments.
          </p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500">Case History</h3>
          <div className="mt-2 space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="min-w-8 text-gray-400"><Clock className="h-4 w-4" /></div>
              <div>
                <p className="text-gray-900">Case opened by Dr. Robert Chen</p>
                <p className="text-gray-500">April 15, 2023 at 10:30 AM</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="min-w-8 text-gray-400"><MessageSquare className="h-4 w-4" /></div>
              <div>
                <p className="text-gray-900">Comment added by Academic Advisor</p>
                <p className="text-gray-500">April 16, 2023 at 2:15 PM</p>
                <p className="text-gray-700 mt-1">Recommend meeting with the student to discuss options for support.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="min-w-8 text-gray-400"><Flag className="h-4 w-4" /></div>
              <div>
                <p className="text-gray-900">Priority changed to Urgent</p>
                <p className="text-gray-500">April 17, 2023 at 9:45 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t pt-4 flex gap-2">
        {studentCase.status !== 'resolved' ? (
          <>
            <Button className="flex-1" onClick={() => handleResolveCase(studentCase.id)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve Case
            </Button>
            <Select 
              defaultValue={studentCase.status === 'urgent' ? 'urgent' : 'normal'} 
              onValueChange={(value) => handlePriorityChange(studentCase.id, value)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Set Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="normal">Normal Priority</SelectItem>
                <SelectItem value="urgent">Urgent Priority</SelectItem>
              </SelectContent>
            </Select>
          </>
        ) : (
          <Button className="flex-1" variant="outline">
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            Resolved
          </Button>
        )}
        <Button variant="outline" className="flex-1" asChild>
          <a href={`mailto:student@university.edu`}>
            <Mail className="h-4 w-4 mr-2" />
            Contact Student
          </a>
        </Button>
      </div>
    </div>
  );
  
  // Student case columns
  const caseColumns = [
    {
      key: 'student',
      header: 'Student',
      cell: (studentCase: typeof studentCases[0]) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={studentCase.student.avatar} alt={studentCase.student.name} />
            <AvatarFallback>{studentCase.student.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="font-medium text-gray-900">{studentCase.student.name}</div>
        </div>
      )
    },
    {
      key: 'issue',
      header: 'Issue',
      cell: (studentCase: typeof studentCases[0]) => (
        <div className="text-gray-700">{studentCase.issue}</div>
      )
    },
    {
      key: 'module',
      header: 'Module',
      cell: (studentCase: typeof studentCases[0]) => (
        <div className="text-gray-700">{studentCase.module}</div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (studentCase: typeof studentCases[0]) => {
        let badgeClass = '';
        
        switch (studentCase.status) {
          case 'urgent':
            badgeClass = 'bg-red-100 text-red-800 border-red-200';
            break;
          case 'pending':
            badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
            break;
          case 'resolved':
            badgeClass = 'bg-green-100 text-green-800 border-green-200';
            break;
        }
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {studentCase.status.charAt(0).toUpperCase() + studentCase.status.slice(1)}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (studentCase: typeof studentCases[0]) => (
        <div className="flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <User className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Student Case Details</DialogTitle>
                <DialogDescription>
                  Review the details of this student case.
                </DialogDescription>
              </DialogHeader>
              <CaseDetailsContent studentCase={studentCase} />
            </DialogContent>
          </Dialog>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Student Cases</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Flag className="h-4 w-4 mr-2" />
                New Case
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Student Case</DialogTitle>
                <DialogDescription>
                  Add a new student case to track and manage student issues.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student ID</FormLabel>
                        <FormControl>
                          <Input placeholder="ST12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="issue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of the issue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="module"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Module</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select module" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CS101">CS101 - Introduction to Computer Science</SelectItem>
                            <SelectItem value="CS201">CS201 - Programming Fundamentals</SelectItem>
                            <SelectItem value="CS301">CS301 - Database Systems</SelectItem>
                            <SelectItem value="CS305">CS305 - Software Engineering</SelectItem>
                            <SelectItem value="CS310">CS310 - Web Development</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide more context about the student's issue"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit">Create Case</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Case Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Active Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studentCases.filter(c => c.status !== 'resolved').length}
              </div>
              <p className="text-sm text-gray-500">Open student cases</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Urgent Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {studentCases.filter(c => c.status === 'urgent').length}
              </div>
              <p className="text-sm text-gray-500">Require immediate attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pending Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {studentCases.filter(c => c.status === 'pending').length}
              </div>
              <p className="text-sm text-gray-500">In progress</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Resolved Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {studentCases.filter(c => c.status === 'resolved').length}
              </div>
              <p className="text-sm text-gray-500">Successfully closed</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Student Cases Table */}
        <div>
          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All Cases</TabsTrigger>
                <TabsTrigger value="urgent" className="text-red-600">Urgent</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>
              
              <div className="relative w-64">
                <Input
                  placeholder="Search cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <TabsContent value="all" className="m-0">
              <TableList 
                columns={caseColumns}
                data={filteredCases}
              />
            </TabsContent>
            
            <TabsContent value="urgent" className="m-0">
              <TableList 
                columns={caseColumns}
                data={filteredCases}
              />
            </TabsContent>
            
            <TabsContent value="pending" className="m-0">
              <TableList 
                columns={caseColumns}
                data={filteredCases}
              />
            </TabsContent>
            
            <TabsContent value="resolved" className="m-0">
              <TableList 
                columns={caseColumns}
                data={filteredCases}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Quick Reference Guides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Case Management Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-red-100 text-red-600 mt-0.5">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Urgent Cases</p>
                    <p className="text-sm text-gray-500">
                      Must be addressed within 24 hours. Immediately notify relevant academic staff and student support services.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 mt-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Pending Cases</p>
                    <p className="text-sm text-gray-500">
                      Should be resolved within 3-5 business days. Regular updates should be provided to all parties involved.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-green-100 text-green-600 mt-0.5">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Case Resolution</p>
                    <p className="text-sm text-gray-500">
                      All case resolutions must be documented with clear outcomes and follow-up actions if needed.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Support Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Student Support Services</p>
                    <p className="text-sm text-gray-500">
                      Contact: support@university.edu | Ext: 5678
                    </p>
                    <p className="text-sm text-gray-500">
                      For counseling, financial aid, and accessibility services.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-purple-100 text-purple-600 mt-0.5">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Academic Affairs</p>
                    <p className="text-sm text-gray-500">
                      Contact: academic@university.edu | Ext: 4567
                    </p>
                    <p className="text-sm text-gray-500">
                      For academic concerns, extensions, and module-specific issues.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-pink-100 text-pink-600 mt-0.5">
                    <Flag className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Case Escalation</p>
                    <p className="text-sm text-gray-500">
                      Contact: dean@university.edu | Ext: 2345
                    </p>
                    <p className="text-sm text-gray-500">
                      For cases requiring higher-level intervention or policy decisions.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentCases;