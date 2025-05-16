import React, { useState, useEffect } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { getAssignmentSubmissions, updateSubmissionGrade } from '@/services/api/staff';

// Define interfaces for the component
// Define minimum required types for the component
interface Student {
  id: string;
  name: string;
  avatar?: string;
}

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
  
  // State for storing submissions and assignment details
  const [assignmentDetails, setAssignmentDetails] = useState<any>(null);
  const [studentSubmissions, setStudentSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentAssignmentId, setCurrentAssignmentId] = useState<string>('');

  // Fetch assignment submissions when component mounts
  useEffect(() => {
    // Extract assignment ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (id) {
      setCurrentAssignmentId(id);
      fetchAssignmentSubmissions(id);
    } else {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "No assignment ID provided",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Fetch assignment submissions
  const fetchAssignmentSubmissions = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await getAssignmentSubmissions(id);
      setAssignmentDetails(response.assignment);
      setStudentSubmissions(response.submissions);
      // Department info is available in response.department if needed later
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to load assignment submissions",
        variant: "destructive"
      });
    }
  };

  // Filter submissions based on search and tab
  const filteredSubmissions = studentSubmissions ? studentSubmissions.filter((submission: any) => {
    const matchesSearch = !searchTerm || 
      submission.student_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      currentTab === 'all' || 
      (currentTab === 'ungraded' && (submission.status === 'submitted' || submission.status === 'late')) ||
      (currentTab === 'graded' && submission.status === 'graded');
    
    return matchesSearch && matchesTab;
  }) : [];
  
  // Grading form
  const form = useForm<GradingFormValues>({
    resolver: zodResolver(gradingSchema),
    defaultValues: {
      grade: '',
      feedback: '',
    },
  });
  
  // Handle form submission for grading
  const onSubmit = async (data: GradingFormValues) => {
    if (!selectedSubmission || !currentAssignmentId) {
      toast({
        title: "Error",
        description: "No submission selected or assignment ID missing",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Call the API to update the grade
      await updateSubmissionGrade(
        currentAssignmentId,
        selectedSubmission.student_id,
        data.grade,
        data.feedback
      );
      
      // Refresh the submissions list
      await fetchAssignmentSubmissions(currentAssignmentId);
      
      toast({
        title: "Assignment Graded",
        description: `${selectedSubmission.student_name}'s assignment has been graded successfully.`,
      });
      
      // Reset form and close
      form.reset();
      setSelectedSubmission(null);
    } catch (error) {
      console.error("Error updating grade:", error);
      toast({
        title: "Error",
        description: "Failed to update the grade. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle selecting a submission to grade
  const handleSelectSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    
    // Pre-fill form if the submission has been graded
    if (submission.grade) {
      form.setValue('grade', submission.grade);
      form.setValue('feedback', submission.feedback || '');
    } else {
      form.reset();
    }
  };
  
  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    // Convert percentage to points if needed
    if (markByPoints && assignmentDetails?.total_marks) {
      const pointValue = (value[0] / 100) * assignmentDetails.total_marks;
      form.setValue('grade', pointValue.toFixed(2));
    } else {
      form.setValue('grade', value[0].toString());
    }
  };
  
  // Handle points change
  const handlePointsChange = (value: string) => {
    if (assignmentDetails?.total_marks) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= assignmentDetails.total_marks) {
        const percentage = Math.round((numValue / assignmentDetails.total_marks) * 100);
        setSliderValue([percentage]);
        form.setValue('grade', value);
      }
    }
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
  
  // Calculate stats for the assignment
  const totalSubmissions = studentSubmissions?.length || 0;
  const gradedSubmissions = studentSubmissions ? studentSubmissions.filter((s: any) => s.status === 'graded').length : 0;
  const submittedCount = studentSubmissions ? studentSubmissions.filter((s: any) => s.status !== 'unsubmitted').length : 0;
  const unsubmittedCount = studentSubmissions ? studentSubmissions.filter((s: any) => s.status === 'unsubmitted').length : 0;
  const lateSubmissions = studentSubmissions ? studentSubmissions.filter((s: any) => s.status === 'late').length : 0;
  
  // Calculate the average grade if there are graded assignments
  const completionPercentage = totalSubmissions > 0 ? Math.round((submittedCount / totalSubmissions) * 100) : 0;
  const gradingProgress = totalSubmissions > 0 ? Math.round((gradedSubmissions / totalSubmissions) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            <span className="ml-3">Loading assignment data...</span>
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <Link href="/manage-assignments">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {assignmentDetails?.title || 'Assignment Grading'}
          </h1>
        </div>
        {assignmentDetails && (
          <p className="text-sm text-gray-500">{assignmentDetails.module_title} ({assignmentDetails.module_code})</p>
        )}
        
        {/* Assignment Info and Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {assignmentDetails && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="flex items-center justify-center bg-blue-100 rounded-full p-3 mb-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium mb-1">Due Date</h3>
                <p className="text-2xl font-bold text-center">
                  {format(new Date(assignmentDetails.due_date), 'd MMMM yyyy')}
                </p>
                <p className="text-sm text-gray-500">
                  at {format(new Date(assignmentDetails.due_date), 'h:mm a')}
                </p>
              </CardContent>
            </Card>
          )}
          
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
                  <p className="font-medium">{totalSubmissions} Students</p>
                  <p className="text-sm text-gray-500">
                    {lateSubmissions} submitted late
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Submission Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={completionPercentage} className="h-2 mb-2" />
              <div className="flex justify-between text-sm">
                <span>{submittedCount} submitted</span>
                <span>out of {totalSubmissions}</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span> On Time
                  </span>
                  <span>{submittedCount - lateSubmissions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1"></span> Late
                  </span>
                  <span>{lateSubmissions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-gray-300 mr-1"></span> Not Submitted
                  </span>
                  <span>{unsubmittedCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Grading Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={gradingProgress} className="h-2 mb-2" />
              <div className="flex justify-between text-sm">
                <span>{gradedSubmissions} graded</span>
                <span>out of {submittedCount}</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  {gradingProgress === 100 ? (
                    <span className="text-green-600 font-medium">All submissions have been graded</span>
                  ) : (
                    <span>{submittedCount - gradedSubmissions} submissions left to grade</span>
                  )}
                </p>
              </div>
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
                                <FormLabel>Points</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    max={assignmentDetails?.total_marks} 
                                    step="0.5"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      handlePointsChange(e.target.value);
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
