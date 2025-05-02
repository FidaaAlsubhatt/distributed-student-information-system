import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, File, CheckCircle, X } from 'lucide-react';
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { assignments } from '@/data/mockData';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formSchema = z.object({
  comments: z.string().optional(),
  files: z.custom<FileList>()
    .refine(files => files.length > 0, {
      message: 'Please upload at least one file',
    })
    .refine(files => Array.from(files).every(file => file.size <= MAX_FILE_SIZE), {
      message: `Each file must be no more than 10MB`,
    }),
});

type FormValues = z.infer<typeof formSchema>;

const SubmitAssignment: React.FC = () => {
  const { toast } = useToast();
  const [location, params] = useLocation();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Parse assignment ID from URL query params
  const searchParams = new URLSearchParams(params);
  const assignmentId = searchParams.get('id');
  
  // Find assignment details
  const assignment = assignments.find(a => a.id === assignmentId);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comments: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    // Simulate file upload with progress
    setIsUploading(true);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          // Show success toast
          toast({
            title: "Assignment Submitted",
            description: "Your assignment has been successfully submitted.",
          });
          
          return 100;
        }
        return prev + 10;
      });
    }, 500);
    
    console.log({
      assignmentId,
      comments: data.comments,
      files: Array.from(data.files).map(file => file.name),
    });
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFiles(Array.from(e.target.files));
      form.setValue('files', e.target.files);
    }
  };
  
  // Remove a file from the selection
  const removeFile = (index: number) => {
    setUploadedFiles(current => {
      const newFiles = [...current];
      newFiles.splice(index, 1);
      
      // Create a new DataTransfer to update the FileList
      const dt = new DataTransfer();
      newFiles.forEach(file => dt.items.add(file));
      
      form.setValue('files', dt.files, { shouldValidate: true });
      return newFiles;
    });
  };

  if (!assignment) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/assignments">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h2 className="text-2xl font-bold text-gray-800">Submit Assignment</h2>
          </div>
          
          <Card className="shadow-md">
            <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
              <p className="text-gray-500">Assignment not found.</p>
              <Link href="/assignments">
                <Button className="mt-4">Return to Assignments</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/assignments">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">Submit Assignment</h2>
        </div>
        
        <Card className="shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-xl font-semibold">{assignment.title}</CardTitle>
            <p className="text-sm text-gray-600">
              {assignment.module} ({assignment.moduleCode}) • Due: {format(new Date(assignment.dueDate), 'PPp')}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="files"
                  render={({ field: { onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Upload Files</FormLabel>
                      <FormControl>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          {uploadedFiles.length === 0 ? (
                            <>
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500 mb-2">Drag and drop files here, or click to select files</p>
                              <p className="text-xs text-gray-400">
                                Supported formats: PDF, DOC, DOCX, ZIP, RAR (Max: 10MB per file)
                              </p>
                              <input
                                id="file-upload"
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.zip,.rar"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => document.getElementById('file-upload')?.click()}
                              >
                                Select Files
                              </Button>
                            </>
                          ) : (
                            <div className="space-y-3">
                              {uploadedFiles.map((file, index) => (
                                <div 
                                  key={index} 
                                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
                                >
                                  <div className="flex items-center">
                                    <File className="h-4 w-4 text-gray-500 mr-2" />
                                    <div>
                                      <p className="text-sm font-medium">{file.name}</p>
                                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                    </div>
                                  </div>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 rounded-full text-gray-400 hover:text-red-500"
                                    onClick={() => removeFile(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => document.getElementById('file-upload')?.click()}
                              >
                                Add More Files
                              </Button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload all required files for this assignment.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comments (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any comments for your instructor..."
                          className="resize-none h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include any notes or questions about your submission.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Uploading files...</span>
                      <span className="text-gray-700 font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                {uploadProgress === 100 && !isUploading && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-700">
                      Assignment submitted successfully!
                    </span>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
            <Link href="/assignments">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={isUploading || uploadProgress === 100 || uploadedFiles.length === 0}
            >
              Submit Assignment
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

export default SubmitAssignment;
