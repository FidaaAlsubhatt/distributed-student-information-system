import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/contexts/UserContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }).optional(),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }).optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  bio: z.string().optional(),
});

const documentsFormSchema = z.object({
  documentType: z.string().min(1, {
    message: "Please select a document type.",
  }),
  documentFile: z.custom<FileList>()
    .refine(files => files.length > 0, {
      message: "Please upload a file.",
    })
    .refine(files => Array.from(files).every(file => file.size <= 5 * 1024 * 1024), {
      message: "File size must be less than 5MB",
    }),
  description: z.string().optional(),
});

const appealFormSchema = z.object({
  caseType: z.string().min(1, {
    message: "Please select a case type.",
  }),
  caseDate: z.string().min(1, {
    message: "Please enter the case date.",
  }),
  description: z.string().min(10, {
    message: "Please provide a detailed description of your appeal (minimum 10 characters).",
  }),
  evidence: z.custom<FileList>().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(8, {
    message: "Current password must be at least 8 characters.",
  }),
  newPassword: z.string().min(8, {
    message: "New password must be at least 8 characters.",
  }),
  confirmPassword: z.string().min(8, {
    message: "Confirm password must be at least 8 characters.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New password and confirm password must match.",
  path: ["confirmPassword"],
});

const Profile: React.FC = () => {
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<{ name: string; type: string; date: string }[]>([
    { name: 'student_id.pdf', type: 'Student ID', date: '2023-01-15' },
    { name: 'transcript.pdf', type: 'Transcript', date: '2023-02-10' },
  ]);
  
  // Profile Form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: currentUser.name,
      email: currentUser.email,
      phone: "1234567890",
      address: "123 University Ave",
      city: "College Town",
      country: "United States",
      postalCode: "12345",
      bio: "Computer Science student with interests in AI and web development.",
    },
  });
  
  // Documents Form
  const documentsForm = useForm<z.infer<typeof documentsFormSchema>>({
    resolver: zodResolver(documentsFormSchema),
    defaultValues: {
      documentType: "",
      description: "",
    },
  });
  
  // Appeal Form
  const appealForm = useForm<z.infer<typeof appealFormSchema>>({
    resolver: zodResolver(appealFormSchema),
    defaultValues: {
      caseType: "",
      caseDate: "",
      description: "",
    },
  });
  
  // Password Form
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle profile form submission
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    console.log(data);
    toast({
      title: "Profile Updated",
      description: "Your profile information has been updated successfully.",
    });
  };
  
  // Handle documents form submission
  const onDocumentsSubmit = (data: z.infer<typeof documentsFormSchema>) => {
    console.log(data);
    
    if (data.documentFile && data.documentFile.length > 0) {
      const newDoc = {
        name: data.documentFile[0].name,
        type: data.documentType,
        date: new Date().toISOString().split('T')[0],
      };
      
      setUploadedDocuments([...uploadedDocuments, newDoc]);
      
      documentsForm.reset();
      
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully.",
      });
    }
  };
  
  // Handle appeal form submission
  const onAppealSubmit = (data: z.infer<typeof appealFormSchema>) => {
    console.log(data);
    toast({
      title: "Appeal Submitted",
      description: "Your appeal has been submitted for review. You will be notified once it's processed.",
    });
    appealForm.reset();
  };
  
  // Handle password form submission
  const onPasswordSubmit = (data: z.infer<typeof passwordFormSchema>) => {
    console.log(data);
    toast({
      title: "Password Changed",
      description: "Your password has been changed successfully.",
    });
    passwordForm.reset();
  };
  
  // Delete a document
  const deleteDocument = (index: number) => {
    setUploadedDocuments(current => current.filter((_, i) => i !== index));
    toast({
      title: "Document Deleted",
      description: "The document has been deleted successfully.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="appeals">Appeals</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal information and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || currentUser.avatar} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-lg">{currentUser.name}</h3>
                    <p className="text-sm text-gray-500">{currentUser.email}</p>
                    <div className="mt-2">
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20">
                          <Upload className="h-4 w-4 mr-2" />
                          Change Avatar
                        </div>
                        <input 
                          id="avatar-upload" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleAvatarChange}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Profile Form */}
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} disabled />
                            </FormControl>
                            <FormDescription>
                              Contact your administrator to change your email.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Tell us a little about yourself"
                              className="resize-none h-32"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit">Save Changes</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Upload Document Form */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Upload Document</CardTitle>
                  <CardDescription>
                    Upload important documents for your student record.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...documentsForm}>
                    <form onSubmit={documentsForm.handleSubmit(onDocumentsSubmit)} className="space-y-4">
                      <FormField
                        control={documentsForm.control}
                        name="documentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Document Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select document type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Student ID">Student ID</SelectItem>
                                <SelectItem value="Transcript">Transcript</SelectItem>
                                <SelectItem value="Medical Certificate">Medical Certificate</SelectItem>
                                <SelectItem value="Recommendation Letter">Recommendation Letter</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={documentsForm.control}
                        name="documentFile"
                        render={({ field: { onChange, ...fieldProps } }) => (
                          <FormItem>
                            <FormLabel>Document File</FormLabel>
                            <FormControl>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 mb-2">Click to upload or drag and drop</p>
                                <p className="text-xs text-gray-400">
                                  PDF, DOC, DOCX up to 5MB
                                </p>
                                <input
                                  type="file"
                                  className="hidden"
                                  id="document-upload"
                                  onChange={(e) => {
                                    onChange(e.target.files);
                                  }}
                                  accept=".pdf,.doc,.docx"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="mt-4"
                                  onClick={() => document.getElementById('document-upload')?.click()}
                                >
                                  Select File
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={documentsForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Add a brief description of the document"
                                className="resize-none h-20"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit">Upload Document</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              {/* Uploaded Documents List */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>My Documents</CardTitle>
                  <CardDescription>
                    View and manage your uploaded documents.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {uploadedDocuments.length > 0 ? (
                    <div className="space-y-4">
                      {uploadedDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center">
                            <div className="p-2 bg-primary/10 rounded-lg mr-4">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium">{doc.name}</h3>
                              <p className="text-sm text-gray-500">
                                {doc.type} • Uploaded on {doc.date}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteDocument(index)}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-4">You haven't uploaded any documents yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Appeals Tab */}
          <TabsContent value="appeals">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Submit Appeal Form */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Submit Appeal</CardTitle>
                  <CardDescription>
                    Appeal a disciplinary action or request special consideration.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...appealForm}>
                    <form onSubmit={appealForm.handleSubmit(onAppealSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={appealForm.control}
                          name="caseType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Appeal Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select appeal type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Grade Appeal">Grade Appeal</SelectItem>
                                  <SelectItem value="Academic Misconduct">Academic Misconduct</SelectItem>
                                  <SelectItem value="Attendance">Attendance Warning</SelectItem>
                                  <SelectItem value="Extenuating Circumstances">Extenuating Circumstances</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={appealForm.control}
                          name="caseDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Incident/Decision</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={appealForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Appeal Details</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Provide detailed information about your appeal..."
                                className="resize-none h-40"
                              />
                            </FormControl>
                            <FormDescription>
                              Be specific about the circumstances and why you believe the appeal should be considered.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={appealForm.control}
                        name="evidence"
                        render={({ field: { onChange, ...fieldProps } }) => (
                          <FormItem>
                            <FormLabel>Supporting Evidence (Optional)</FormLabel>
                            <FormControl>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Upload supporting documents</p>
                                <input
                                  type="file"
                                  className="hidden"
                                  id="evidence-upload"
                                  onChange={(e) => {
                                    onChange(e.target.files);
                                  }}
                                  multiple
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => document.getElementById('evidence-upload')?.click()}
                                >
                                  Choose Files
                                </Button>
                              </div>
                            </FormControl>
                            <FormDescription>
                              You can upload multiple files (PDF, DOC, DOCX, JPG, PNG).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit">Submit Appeal</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              {/* Appeal Guidelines */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Appeal Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Submission Deadline</h3>
                      <p className="text-sm text-gray-600">Appeals must be submitted within 10 working days of the incident or decision.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Supporting Evidence</h3>
                      <p className="text-sm text-gray-600">Provide all relevant documentation to support your appeal.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Clear Explanation</h3>
                      <p className="text-sm text-gray-600">Clearly explain the grounds for your appeal and what outcome you're seeking.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Processing Time</h3>
                      <p className="text-sm text-gray-600">Appeals typically take 5-10 working days to process. Urgent cases may be expedited.</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg mt-6">
                    <h3 className="font-medium text-blue-800">Need Help?</h3>
                    <p className="text-sm text-blue-700 mt-1">If you need assistance with your appeal, please contact the Student Support Services at support@university.edu or call 123-456-7890.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Password Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-w-md">
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 8 characters and include a mix of letters, numbers, and symbols.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="pt-4">
                      <Button type="submit">Change Password</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col items-start bg-gray-50 border-t">
                <h3 className="font-medium">Password Tips:</h3>
                <ul className="text-sm text-gray-600 list-disc list-inside mt-2 space-y-1">
                  <li>Use a minimum of 8 characters</li>
                  <li>Include uppercase and lowercase letters</li>
                  <li>Include at least one number</li>
                  <li>Include at least one special character</li>
                  <li>Don't reuse passwords from other websites</li>
                </ul>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
