import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
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
import { Upload, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';

// Define interfaces for our profile data
interface StudentAddress {
  line1: string;
  line2: string;
  city: string;
  county: string;  // UK-specific terminology
  postalCode: string;  // UK-specific terminology
  country: string;
}

interface AcademicInfo {
  studentNumber: string;
  department: string;
  year: number;
  enrollDate: string;
  status: string;
}

interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

interface StudentProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  personalEmail: string;
  phone: string;
  address: StudentAddress;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  academicInfo: AcademicInfo;
  emergencyContact: EmergencyContact;
  avatar: string;
}

const defaultProfile: StudentProfile = {
  id: '',
  name: '',
  username: '',
  email: '',
  personalEmail: '',
  phone: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    county: '',
    postalCode: '',
    country: 'United Kingdom'
  },
  dateOfBirth: '',
  gender: '',
  nationality: '',
  academicInfo: {
    studentNumber: '',
    department: '',
    year: 1,
    enrollDate: '',
    status: ''
  },
  emergencyContact: {
    name: '',
    relation: '',
    phone: ''
  },
  avatar: ''
};

// Form schemas
const profileFormSchema = z.object({
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }).optional(),
  personalEmail: z.string().email({
    message: "Please enter a valid email address.",
  }).optional(),
  address: z.object({
    line1: z.string().min(3, { message: "Address line 1 is required" }),
    line2: z.string().optional(),
    city: z.string().min(2, { message: "City is required" }),
    county: z.string().min(2, { message: "County is required" }),
    postalCode: z.string().min(5, { message: "Valid postal code is required" }),
    country: z.string().default("United Kingdom")
  })
});

const Profile: React.FC = () => {
  // All refs declared at top level
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Hook state declarations
  const { isAuthenticated, currentUser } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfile>(defaultProfile);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Forms initialized at the top level
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      phone: "",
      personalEmail: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        county: "",
        postalCode: "",
        country: "United Kingdom"
      }
    }
  });
  
  // Fetch the student profile from the backend API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!isAuthenticated) {
          setError('Please log in to view your profile');
          setLoading(false);
          return;
        }
        
        // Get auth token from local storage
        const authJson = localStorage.getItem('auth');
        const token = authJson ? JSON.parse(authJson).token : null;
        
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }
        
        // Fetch profile from API
        const response = await axios.get('/api/profile/student-profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setProfile(response.data);
        
        // Update form values with loaded profile data
        profileForm.reset({
          phone: response.data.phone || "",
          personalEmail: response.data.personalEmail || "",
          address: {
            line1: response.data.address?.line1 || "",
            line2: response.data.address?.line2 || "",
            city: response.data.address?.city || "",
            county: response.data.address?.county || "",
            postalCode: response.data.address?.postalCode || "",
            country: response.data.address?.country || "United Kingdom"
          }
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [isAuthenticated]);
  
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
  const onProfileSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    try {
      // Get auth token
      const authJson = localStorage.getItem('auth');
      const token = authJson ? JSON.parse(authJson).token : null;
      
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
        });
        return;
      }
      
      // Update profile via API
      await axios.put('/api/profile/student-profile', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-lg text-gray-600">Loading your profile...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg text-gray-800 mb-2">Error</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
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
                    <AvatarImage src={avatarPreview || profile.avatar} />
                    <AvatarFallback>{profile.name ? profile.name.charAt(0) : 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-lg">{profile.name}</h3>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                    <div className="mt-2">
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20">
                          <Upload className="h-4 w-4 mr-2" />
                          Change Avatar
                        </div>
                        <input 
                          ref={fileInputRef}
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
                
                {/* Basic Info - Read Only */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <h3 className="font-medium text-sm">Student Number</h3>
                    <p className="text-gray-600">{profile.academicInfo?.studentNumber || 'Not available'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-medium text-sm">Department</h3>
                    <p className="text-gray-600">{profile.academicInfo?.department || 'Not available'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-medium text-sm">Year of Study</h3>
                    <p className="text-gray-600">{profile.academicInfo?.year || 'Not available'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-medium text-sm">Enrolment Date</h3>
                    <p className="text-gray-600">{profile.academicInfo?.enrollDate || 'Not available'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-medium text-sm">Status</h3>
                    <p className="text-gray-600">{profile.academicInfo?.status || 'Not available'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-medium text-sm">Date of Birth</h3>
                    <p className="text-gray-600">{profile.dateOfBirth || 'Not available'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-medium text-sm">Nationality</h3>
                    <p className="text-gray-600">{profile.nationality || 'Not available'}</p>
                  </div>
                </div>
                
                {/* Editable Profile Form */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold text-lg mb-4">Contact Information</h3>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Your phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="personalEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Personal Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Your personal email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-3">Address</h4>
                        <div className="space-y-4">
                          <FormField
                            control={profileForm.control}
                            name="address.line1"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address Line 1</FormLabel>
                                <FormControl>
                                  <Input placeholder="Street address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="address.line2"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address Line 2 (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Apartment, suite, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={profileForm.control}
                              name="address.city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input placeholder="City" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="address.county"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>County</FormLabel>
                                  <FormControl>
                                    <Input placeholder="County" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="address.postalCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Postal Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Postal Code" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Button type="submit">Save Changes</Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
                <CardDescription>
                  Your registered emergency contact information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <h3 className="font-medium text-sm">Name</h3>
                    <p className="text-gray-600">{profile.emergencyContact?.name || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-medium text-sm">Relationship</h3>
                    <p className="text-gray-600">{profile.emergencyContact?.relation || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-medium text-sm">Phone Number</h3>
                    <p className="text-gray-600">{profile.emergencyContact?.phone || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-gray-50 flex flex-col items-start">
                <p className="text-sm text-gray-600">To update your emergency contact information, please contact the Student Services Office.</p>
              </CardFooter>
            </Card>
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
                <form className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel>Current Password</FormLabel>
                    <Input type="password" />
                  </div>
                  
                  <div className="space-y-2">
                    <FormLabel>New Password</FormLabel>
                    <Input type="password" />
                    <p className="text-xs text-gray-500">
                      Password must be at least 8 characters and include a mix of letters, numbers, and symbols.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <FormLabel>Confirm New Password</FormLabel>
                    <Input type="password" />
                  </div>
                  
                  <div className="pt-4">
                    <Button type="submit">Change Password</Button>
                  </div>
                </form>
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
