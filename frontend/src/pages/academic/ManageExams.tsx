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
import { format, addHours } from 'date-fns';
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  FileText, 
  Calendar,
  Clock,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { modules, timetable } from '@/data/mockData';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Extract exam entries from timetable
const examEntries = timetable.filter(entry => entry.type === 'exam');

// Create mock upcoming exams
const upcomingExams = [
  ...examEntries,
  {
    id: 'exam-1',
    moduleName: 'Algorithms & Data Structures (Final Exam)',
    moduleCode: 'CS202',
    startTime: '14:00',
    endTime: '16:00',
    room: 'EX-HALL-B',
    building: 'Examination Center',
    day: 'May 22',
    type: 'exam'
  },
  {
    id: 'exam-2',
    moduleName: 'Web Development (Final Exam)',
    moduleCode: 'CS310',
    startTime: '10:00',
    endTime: '12:00',
    room: 'EX-HALL-C',
    building: 'Examination Center',
    day: 'May 26',
    type: 'exam'
  }
];

// Create mock past exams
const pastExams = [
  {
    id: 'past-exam-1',
    moduleName: 'Introduction to Computer Science (Final Exam)',
    moduleCode: 'CS101',
    startTime: '09:00',
    endTime: '11:00',
    room: 'EX-HALL-A',
    building: 'Examination Center',
    day: 'Dec 15',
    type: 'exam',
    completed: true
  },
  {
    id: 'past-exam-2',
    moduleName: 'Programming Fundamentals (Final Exam)',
    moduleCode: 'CS201',
    startTime: '14:00',
    endTime: '16:00',
    room: 'EX-HALL-B',
    building: 'Examination Center',
    day: 'Dec 18',
    type: 'exam',
    completed: true
  }
];

const examFormSchema = z.object({
  moduleCode: z.string().min(1, { message: "Module is required" }),
  examType: z.string().min(1, { message: "Exam type is required" }),
  date: z.date({
    required_error: "Date is required",
  }),
  startTime: z.string().min(1, { message: "Start time is required" }),
  duration: z.string().min(1, { message: "Duration is required" }),
  location: z.string().min(1, { message: "Location is required" }),
  room: z.string().min(1, { message: "Room is required" }),
  description: z.string().optional(),
  allowedMaterials: z.string().optional(),
});

type FormValues = z.infer<typeof examFormSchema>;

const ManageExams: React.FC = () => {
  const { toast } = useToast();
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [notifyStudents, setNotifyStudents] = useState(true);
  
  // Filter exams based on search and module
  const filterExams = (examList: any[]) => {
    if (!searchTerm && selectedModule === 'all') return examList;
    
    return examList.filter(exam => {
      const matchesSearch = !searchTerm || 
        exam.moduleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.moduleCode.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesModule = selectedModule === 'all' || exam.moduleCode === selectedModule;
      
      return matchesSearch && matchesModule;
    });
  };
  
  // New exam form
  const form = useForm<FormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      moduleCode: '',
      examType: '',
      date: new Date(),
      startTime: '',
      duration: '',
      location: '',
      room: '',
      description: '',
      allowedMaterials: '',
    },
  });
  
  // Edit exam form
  const editForm = useForm<FormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      moduleCode: '',
      examType: '',
      date: new Date(),
      startTime: '',
      duration: '',
      location: '',
      room: '',
      description: '',
      allowedMaterials: '',
    },
  });
  
  // Handle form submission for new exam
  const onSubmit = (data: FormValues) => {
    console.log(data);
    toast({
      title: "Exam Created",
      description: `${data.examType} for ${data.moduleCode} has been scheduled successfully.`,
    });
    setIsCreateDialogOpen(false);
    form.reset();
  };
  
  // Handle form submission for edit exam
  const onEditSubmit = (data: FormValues) => {
    console.log(data);
    toast({
      title: "Exam Updated",
      description: `${data.examType} for ${data.moduleCode} has been updated successfully.`,
    });
    setIsEditDialogOpen(false);
    editForm.reset();
  };
  
  // Open the edit dialog and populate form with exam data
  const handleEditExam = (exam: any) => {
    setSelectedExam(exam);
    
    // Parse module code from the exam title
    const moduleCode = exam.moduleCode;
    
    // Parse exam type from the exam title
    const examType = exam.moduleName.includes('Final') ? 'final' : 'midterm';
    
    // Create a date object from the day string
    // In a real app, this would be a proper date format
    const examDate = new Date();
    
    editForm.setValue('moduleCode', moduleCode);
    editForm.setValue('examType', examType);
    editForm.setValue('date', examDate);
    editForm.setValue('startTime', exam.startTime);
    editForm.setValue('duration', '2'); // assuming 2 hours
    editForm.setValue('location', exam.building);
    editForm.setValue('room', exam.room);
    editForm.setValue('description', 'Comprehensive exam covering all topics from the course.');
    editForm.setValue('allowedMaterials', 'Calculator, pen, pencil, eraser. No electronic devices allowed.');
    
    setIsEditDialogOpen(true);
  };
  
  // Exam details dialog content
  const ExamDetailsContent = ({ exam }: { exam: any }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{exam.moduleName}</h2>
          <p className="text-gray-500">{exam.moduleCode}</p>
        </div>
        <Badge 
          className={exam.completed ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}
        >
          {exam.completed ? 'Completed' : 'Scheduled'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-500 mr-2" />
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-medium">{exam.day}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-gray-500 mr-2" />
          <div>
            <p className="text-gray-500">Time</p>
            <p className="font-medium">{exam.startTime} - {exam.endTime}</p>
          </div>
        </div>
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-gray-500 mr-2" />
          <div>
            <p className="text-gray-500">Location</p>
            <p className="font-medium">{exam.room}, {exam.building}</p>
          </div>
        </div>
        <div>
          <p className="text-gray-500">Duration</p>
          <p className="font-medium">2 hours</p>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <p className="text-gray-500">Description</p>
        <p className="mt-1">
          Comprehensive exam covering all topics from the course.
        </p>
      </div>
      
      <div className="border-t pt-4">
        <p className="text-gray-500">Allowed Materials</p>
        <p className="mt-1">Calculator, pen, pencil, eraser. No electronic devices allowed.</p>
      </div>
      
      {!exam.completed && (
        <div className="border-t pt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => handleEditExam(exam)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Exam
          </Button>
          <Button variant="destructive" className="flex-1">
            <Trash2 className="h-4 w-4 mr-2" />
            Cancel Exam
          </Button>
        </div>
      )}
    </div>
  );
  
  // Columns for exam table
  const examColumns = [
    {
      key: 'moduleName',
      header: 'Exam',
      cell: (exam: any) => (
        <div>
          <span className="font-medium text-gray-900">{exam.moduleName}</span>
          <p className="text-sm text-gray-500">{exam.moduleCode}</p>
        </div>
      )
    },
    {
      key: 'day',
      header: 'Date',
      cell: (exam: any) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-500 mr-2" />
          <span className="text-gray-700">{exam.day}</span>
        </div>
      )
    },
    {
      key: 'time',
      header: 'Time',
      cell: (exam: any) => (
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-gray-500 mr-2" />
          <span className="text-gray-700">{exam.startTime} - {exam.endTime}</span>
        </div>
      )
    },
    {
      key: 'location',
      header: 'Location',
      cell: (exam: any) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-gray-500 mr-2" />
          <span className="text-gray-700">{exam.room}, {exam.building}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (exam: any) => (
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
                <FileText className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Exam Details</DialogTitle>
                <DialogDescription>View detailed information about this exam.</DialogDescription>
              </DialogHeader>
              <ExamDetailsContent exam={exam} />
            </DialogContent>
          </Dialog>
          
          {!exam.completed && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-blue-600 hover:text-blue-700"
              onClick={() => handleEditExam(exam)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
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
          <h2 className="text-2xl font-bold text-gray-800">Manage Exams</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Schedule Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Schedule New Exam</DialogTitle>
                <DialogDescription>
                  Create a new exam for your module. Fill in all the required information below.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  
                  <FormField
                    control={form.control}
                    name="examType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select exam type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="midterm">Midterm Exam</SelectItem>
                            <SelectItem value="final">Final Exam</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="practical">Practical Exam</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
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
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="09:00">09:00 AM</SelectItem>
                              <SelectItem value="10:00">10:00 AM</SelectItem>
                              <SelectItem value="11:00">11:00 AM</SelectItem>
                              <SelectItem value="12:00">12:00 PM</SelectItem>
                              <SelectItem value="13:00">01:00 PM</SelectItem>
                              <SelectItem value="14:00">02:00 PM</SelectItem>
                              <SelectItem value="15:00">03:00 PM</SelectItem>
                              <SelectItem value="16:00">04:00 PM</SelectItem>
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
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (hours)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 hour</SelectItem>
                              <SelectItem value="1.5">1.5 hours</SelectItem>
                              <SelectItem value="2">2 hours</SelectItem>
                              <SelectItem value="2.5">2.5 hours</SelectItem>
                              <SelectItem value="3">3 hours</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Examination Center">Examination Center</SelectItem>
                              <SelectItem value="Computer Science Building">Computer Science Building</SelectItem>
                              <SelectItem value="Main Hall">Main Hall</SelectItem>
                              <SelectItem value="Science Building">Science Building</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="room"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. EX-HALL-A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide details about the exam content and format..."
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
                    name="allowedMaterials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allowed Materials (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List materials students are allowed to bring..."
                            className="resize-none h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notify-students" 
                      checked={notifyStudents}
                      onCheckedChange={(checked) => setNotifyStudents(checked as boolean)} 
                    />
                    <label
                      htmlFor="notify-students"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Notify enrolled students about this exam
                    </label>
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Schedule Exam</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming Exams</TabsTrigger>
            <TabsTrigger value="past">Past Exams</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-6">
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Upcoming Exams</p>
                        <p className="text-2xl font-bold text-gray-800">{upcomingExams.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Next Exam</p>
                        <p className="text-lg font-bold text-gray-800">May 15</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Venues Booked</p>
                        <p className="text-2xl font-bold text-gray-800">3</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          
            <TableList
              columns={examColumns}
              data={filterExams(upcomingExams)}
              showSearch={true}
              searchPlaceholder="Search exams..."
              showFilter={true}
              filterOptions={moduleOptions}
              filterPlaceholder="All Modules"
              onSearchChange={setSearchTerm}
              onFilterChange={setSelectedModule}
            />
          </TabsContent>
          
          <TabsContent value="past" className="mt-6">
            <TableList
              columns={examColumns}
              data={filterExams(pastExams)}
              showSearch={true}
              searchPlaceholder="Search exams..."
              showFilter={true}
              filterOptions={moduleOptions}
              filterPlaceholder="All Modules"
              onSearchChange={setSearchTerm}
              onFilterChange={setSelectedModule}
            />
          </TabsContent>
        </Tabs>
        
        {/* Edit Exam Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Exam</DialogTitle>
              <DialogDescription>
                Update the exam details. Changes will be reflected immediately.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
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
                
                <FormField
                  control={editForm.control}
                  name="examType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select exam type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="midterm">Midterm Exam</SelectItem>
                          <SelectItem value="final">Final Exam</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="practical">Practical Exam</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
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
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="09:00">09:00 AM</SelectItem>
                            <SelectItem value="10:00">10:00 AM</SelectItem>
                            <SelectItem value="11:00">11:00 AM</SelectItem>
                            <SelectItem value="12:00">12:00 PM</SelectItem>
                            <SelectItem value="13:00">01:00 PM</SelectItem>
                            <SelectItem value="14:00">02:00 PM</SelectItem>
                            <SelectItem value="15:00">03:00 PM</SelectItem>
                            <SelectItem value="16:00">04:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (hours)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 hour</SelectItem>
                            <SelectItem value="1.5">1.5 hours</SelectItem>
                            <SelectItem value="2">2 hours</SelectItem>
                            <SelectItem value="2.5">2.5 hours</SelectItem>
                            <SelectItem value="3">3 hours</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Examination Center">Examination Center</SelectItem>
                            <SelectItem value="Computer Science Building">Computer Science Building</SelectItem>
                            <SelectItem value="Main Hall">Main Hall</SelectItem>
                            <SelectItem value="Science Building">Science Building</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editForm.control}
                  name="room"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
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
                  name="allowedMaterials"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allowed Materials (Optional)</FormLabel>
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
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="notify-students-edit" 
                    checked={notifyStudents}
                    onCheckedChange={(checked) => setNotifyStudents(checked as boolean)} 
                  />
                  <label
                    htmlFor="notify-students-edit"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Notify enrolled students about these changes
                  </label>
                </div>
                
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

export default ManageExams;
