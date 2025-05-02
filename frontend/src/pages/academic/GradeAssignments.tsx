import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  File, 
  Download,
  Eye,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { Link } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Mock student submissions for the selected assignment
const studentSubmissions = [
  {
    id: '1',
    student: {
      id: '101',
      name: 'Michael Johnson',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    submissionDate: '2023-04-20T15:30:00',
    files: [
      { name: 'database_design.pdf', size: '2.3 MB' },
      { name: 'er_diagram.png', size: '540 KB' }
    ],
    status: 'ungraded',
    notes: 'Submitted on time'
  },
  {
    id: '2',
    student: {
      id: '102',
      name: 'Emily Davis',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    submissionDate: '2023-04-21T10:15:00',
    files: [
      { name: 'database_project.pdf', size: '3.1 MB' }
    ],
    status: 'ungraded',
    notes: 'Submitted on time'
  },
  {
    id: '3',
    student: {
      id: '103',
      name: 'Daniel Wilson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    submissionDate: '2023-04-21T23:45:00',
    files: [
      { name: 'db_design_project.pdf', size: '2.7 MB' },
      { name: 'queries.sql', size: '120 KB' }
    ],
    status: 'graded',
    grade: '85%',
    feedback: 'Good work on the database design. Your normalization approach is sound, but there are some issues with the relationships between entities.',
    notes: 'Submitted on time'
  },
  {
    id: '4',
    student: {
      id: '104',
      name: 'Sophia Martinez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    submissionDate: '2023-04-22T08:20:00',
    files: [
      { name: 'database_assignment.pdf', size: '1.9 MB' }
    ],
    status: 'graded',
    grade: '92%',
    feedback: 'Excellent work! Your database design is well-structured and your documentation is clear and comprehensive.',
    notes: 'Submitted on time'
  },
  {
    id: '5',
    student: {
      id: '105',
      name: 'Alexander Brown',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    submissionDate: '2023-04-23T14:10:00',
    files: [
      { name: 'database_submission.pdf', size: '2.5 MB' },
      { name: 'schema.sql', size: '95 KB' }
    ],
    status: 'late',
    lateHours: 14,
    notes: 'Submitted late'
  }
];

// Form schema for grading
const gradingSchema = z.object({
  grade: z.string().min(1, { message: "Grade is required" }),
  feedback: z.string().min(10, { message: "Feedback must be at least 10 characters" }),
});

type GradingFormValues = z.infer<typeof gradingSchema>;

const GradeAssignments: React.FC = () => {
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [markByPoints, setMarkByPoints] = useState(false);
  const [sliderValue, setSliderValue] = useState([85]);
  
  // Filter submissions based on search and tab
  const filteredSubmissions = studentSubmissions.filter(submission => {
    const matchesSearch = !searchTerm || 
      submission.student.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      currentTab === 'all' || 
      (currentTab === 'ungraded' && (submission.status === 'ungraded' || submission.status === 'late')) ||
      (currentTab === 'graded' && submission.status === 'graded');
    
    return matchesSearch && matchesTab;
  });
  
  // Grading form
  const form = useForm<GradingFormValues>({
    resolver: zodResolver(gradingSchema),
    defaultValues: {
      grade: '',
      feedback: '',
    },
  });
  
  // Handle form submission for grading
  const onSubmit = (data: GradingFormValues) => {
    console.log({ ...data, studentId: selectedSubmission?.student.id });
    toast({
      title: "Assignment Graded",
      description: `${selectedSubmission?.student.name}'s assignment has been graded successfully.`,
    });
    
    // Update the submission in the list (in a real app, this would be an API call)
    setSelectedSubmission({
      ...selectedSubmission,
      status: 'graded',
      grade: data.grade,
      feedback: data.feedback,
    });
    
    form.reset();
  };
  
  // Handle selecting a submission to grade
  const handleSelectSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    
    // Pre-fill form if the submission has been graded
    if (submission.status === 'graded') {
      form.setValue('grade', submission.grade.replace('%', ''));
      form.setValue('feedback', submission.feedback);
    } else {
      // For ungraded submissions, set default values
      form.setValue('grade', markByPoints ? '85' : sliderValue[0].toString());
      form.setValue('feedback', '');
    }
  };
  
  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    form.setValue('grade', value[0].toString());
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ungraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'graded':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'late':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Mock assignment details
  const assignmentDetails = {
    title: 'Database Design Project',
    module: 'Database Systems',
    moduleCode: 'CS301',
    dueDate: '2023-04-22T23:59:00',
    totalMarks: 100,
    description: 'Design a relational database for a university management system.',
    instructions: 'Submit your work as a PDF document with an ER diagram and schema design.',
    status: 'active',
    totalSubmissions: studentSubmissions.length,
    gradedSubmissions: studentSubmissions.filter(s => s.status === 'graded').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/manage-assignments">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{assignmentDetails.title}</h2>
            <p className="text-sm text-gray-500">{assignmentDetails.module} ({assignmentDetails.moduleCode})</p>
          </div>
        </div>
        
        {/* Assignment Info and Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Assignment Due Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100 text-blue-700 mr-3">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{format(new Date(assignmentDetails.dueDate), 'PPP')}</p>
                  <p className="text-sm text-gray-500">{format(new Date(assignmentDetails.dueDate), 'p')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-green-100 text-green-700 mr-3">
                  <ThumbsUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{assignmentDetails.totalSubmissions} Students</p>
                  <p className="text-sm text-gray-500">
                    {studentSubmissions.filter(s => s.status === 'late').length} submitted late
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Grading Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium">
                  {assignmentDetails.gradedSubmissions}/{assignmentDetails.totalSubmissions} ({
                    Math.round((assignmentDetails.gradedSubmissions / assignmentDetails.totalSubmissions) * 100)
                  }%)
                </span>
              </div>
              <Progress value={(assignmentDetails.gradedSubmissions / assignmentDetails.totalSubmissions) * 100} />
            </CardContent>
          </Card>
        </div>
        
        {/* Main Grading Interface */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Submissions List */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Student Submissions</CardTitle>
                <div className="mt-2">
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                  <Tabs value={currentTab} onValueChange={setCurrentTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="ungraded">Ungraded</TabsTrigger>
                      <TabsTrigger value="graded">Graded</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((submission) => (
                      <div
                        key={submission.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                          selectedSubmission?.id === submission.id ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => handleSelectSubmission(submission)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={submission.student.avatar} alt={submission.student.name} />
                            <AvatarFallback>{submission.student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900 truncate">{submission.student.name}</h3>
                              <Badge 
                                variant="outline" 
                                className={`${getStatusColor(submission.status)} px-2 font-semibold rounded-full text-xs`}
                              >
                                {submission.status === 'graded' 
                                  ? submission.grade 
                                  : submission.status.charAt(0).toUpperCase() + submission.status.slice(1)
                                }
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                              Submitted: {format(new Date(submission.submissionDate), 'PPp')}
                            </p>
                            <p className="text-xs text-gray-500">
                              Files: {submission.files.length} • {
                                submission.status === 'late' 
                                  ? <span className="text-red-500">{submission.lateHours} hours late</span>
                                  : submission.notes
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No submissions match your search criteria.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Grading Form and Preview */}
          <div className="md:col-span-2">
            {selectedSubmission ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Submission Details</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1"
                          onClick={() => {
                            if (selectedSubmission.id !== '1') {
                              const prevIndex = filteredSubmissions.findIndex(s => s.id === selectedSubmission.id) - 1;
                              if (prevIndex >= 0) {
                                handleSelectSubmission(filteredSubmissions[prevIndex]);
                              }
                            }
                          }}
                          disabled={selectedSubmission.id === filteredSubmissions[0]?.id}
                        >
                          <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1"
                          onClick={() => {
                            if (selectedSubmission.id !== filteredSubmissions[filteredSubmissions.length - 1]?.id) {
                              const nextIndex = filteredSubmissions.findIndex(s => s.id === selectedSubmission.id) + 1;
                              if (nextIndex < filteredSubmissions.length) {
                                handleSelectSubmission(filteredSubmissions[nextIndex]);
                              }
                            }
                          }}
                          disabled={selectedSubmission.id === filteredSubmissions[filteredSubmissions.length - 1]?.id}
                        >
                          Next <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Submitted by <span className="font-medium">{selectedSubmission.student.name}</span> on {format(new Date(selectedSubmission.submissionDate), 'PPP')} at {format(new Date(selectedSubmission.submissionDate), 'p')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Submitted Files</h3>
                        <div className="space-y-2">
                          {selectedSubmission.files.map((file: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                              <div className="flex items-center">
                                <File className="h-4 w-4 text-gray-500 mr-2" />
                                <div>
                                  <p className="text-sm font-medium">{file.name}</p>
                                  <p className="text-xs text-gray-500">{file.size}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Eye className="h-4 w-4 mr-1" /> Preview
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl">
                                    <DialogHeader>
                                      <DialogTitle>File Preview: {file.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="h-[600px] bg-gray-100 rounded-md flex items-center justify-center">
                                      <p className="text-gray-500">File preview would appear here</p>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4 mr-1" /> Download
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {selectedSubmission.status === 'late' && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Late Submission</p>
                            <p className="text-sm text-red-700">
                              This submission was received {selectedSubmission.lateHours} hours after the deadline.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {selectedSubmission.status === 'graded' && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-green-800">Graded</p>
                            <p className="text-sm text-green-700">
                              You've already graded this submission with {selectedSubmission.grade}.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Grade Submission</CardTitle>
                    <div className="flex items-center">
                      <span className="text-sm mr-2">Grade by:</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="grade-percentage"
                            name="grade-type"
                            checked={!markByPoints}
                            onChange={() => setMarkByPoints(false)}
                            className="mr-1.5"
                          />
                          <label htmlFor="grade-percentage" className="text-sm">Percentage</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="grade-points"
                            name="grade-type"
                            checked={markByPoints}
                            onChange={() => setMarkByPoints(true)}
                            className="mr-1.5"
                          />
                          <label htmlFor="grade-points" className="text-sm">Points (out of {assignmentDetails.totalMarks})</label>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {!markByPoints ? (
                          <FormField
                            control={form.control}
                            name="grade"
                            render={({ field }) => (
                              <FormItem className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <FormLabel>Grade Percentage</FormLabel>
                                  <div className="text-2xl font-bold text-primary">{sliderValue[0]}%</div>
                                </div>
                                <FormControl>
                                  <Slider
                                    defaultValue={[85]}
                                    max={100}
                                    step={1}
                                    value={sliderValue}
                                    onValueChange={handleSliderChange}
                                    className="py-4"
                                  />
                                </FormControl>
                                <div className="flex justify-between text-sm text-gray-500 px-2">
                                  <span>0%</span>
                                  <span>50%</span>
                                  <span>100%</span>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <FormField
                            control={form.control}
                            name="grade"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Points (out of {assignmentDetails.totalMarks})</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    max={assignmentDetails.totalMarks} 
                                    {...field} 
                                    onChange={(e) => {
                                      field.onChange(e);
                                      const value = parseInt(e.target.value);
                                      if (!isNaN(value) && value >= 0 && value <= assignmentDetails.totalMarks) {
                                        setSliderValue([Math.round((value / assignmentDetails.totalMarks) * 100)]);
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Enter points between 0 and {assignmentDetails.totalMarks}.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <FormField
                          control={form.control}
                          name="feedback"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Feedback</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Provide detailed feedback for the student..."
                                  className="resize-none h-40"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Include specific comments on what was done well and areas for improvement.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="pt-2 flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline"
                            className="gap-1"
                            onClick={() => {
                              const predefinedFeedback = "Good work overall. Your understanding of the core concepts is evident. Consider strengthening your analysis section in future assignments.";
                              form.setValue('feedback', predefinedFeedback);
                            }}
                          >
                            <ThumbsUp className="h-4 w-4" /> Good
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline"
                            className="gap-1"
                            onClick={() => {
                              const predefinedFeedback = "There are several areas that need improvement. Please review the course material on database normalization and entity relationships.";
                              form.setValue('feedback', predefinedFeedback);
                            }}
                          >
                            <ThumbsDown className="h-4 w-4" /> Needs Improvement
                          </Button>
                          <Button type="submit">Submit Grade</Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-96">
                  <div className="p-4 rounded-full bg-gray-100">
                    <File className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">Select a Submission</h3>
                  <p className="mt-2 text-center text-gray-500 max-w-sm">
                    Select a student submission from the list to view and grade it.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GradeAssignments;
