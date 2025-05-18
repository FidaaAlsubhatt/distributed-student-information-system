import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getAvailableModules, requestEnrollment, Module } from '@/services/enrollmentService';
import { Loader2, ChevronDown, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  // Use composite value format: 'deptCode:moduleId'
  moduleId: z.string().min(1, { message: 'Please select a module' }),
  reason: z.string().min(10, { message: 'Please provide a detailed reason for enrollment (minimum 10 characters)' }),
  // These are not directly collected from user input, but passed to the onSubmit handler
  departmentId: z.number().optional(),
  isGlobalModule: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const EnrollmentForm: React.FC = () => {
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departmentCode, setDepartmentCode] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [open, setOpen] = useState(false);

  // Fetch available modules on component mount
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAvailableModules();
        
        // Process modules to ensure unique identification
        const modulesWithCompositeIds = data.modules.map((module) => {
          // Create a formatted display name with department for global modules
          const displayName = module.isGlobalModule ? 
            `${module.code} - ${module.title} (${module.departmentCode?.toUpperCase()})` : 
            `${module.code} - ${module.title}`;
          
          // Use the globalModuleId from backend if available, otherwise create a composite ID
          // This ensures consistent identification across frontend and backend
          const compositeId = module.globalModuleId || `${module.departmentCode || departmentCode}:${module.id}`;
          
          // Log the module ID information for debugging
          console.log(`Module ${module.code} - globalModuleId: ${module.globalModuleId}, compositeId: ${compositeId}`);
          
          return {
            ...module,
            compositeId,
            displayName
          };
        });
        
        setModules(modulesWithCompositeIds);
        setDepartmentCode(data.departmentCode);
        
        // Store department ID if available in response
        if ('departmentId' in data && typeof data.departmentId === 'number') {
          setDepartmentId(data.departmentId);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError('Failed to load available modules. Please try again.');
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      moduleId: '',
      reason: '',
      departmentId: undefined,
      isGlobalModule: false,
    },
  });

  // Update selected module when moduleId changes
  useEffect(() => {
    const moduleCompositeId = form.getValues().moduleId;
    
    if (!moduleCompositeId) {
      setSelectedModule(null);
      return;
    }
    
    console.log('Form moduleId changed to:', moduleCompositeId);
    
    // Find the module by the composite ID - exact match only
    const module = modules.find(m => m.compositeId === moduleCompositeId);
    
    if (module) {
      console.log('Found matching module:', module.code, module.title);
      console.log('From department:', module.departmentCode);
      console.log('Is global module:', module.isGlobalModule);
      setSelectedModule(module);
    } else {
      console.warn('No module found with compositeId:', moduleCompositeId);
    }
  }, [form.watch('moduleId'), modules]);

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      
      // Get the currently selected module using the composite ID from the form values
      const compositeId = values.moduleId;
      console.log('Form values on submit:', values);
      console.log('Looking for module with compositeId:', compositeId);
      
      // Find the module by its composite ID or globalModuleId - this ensures we get the exact module that was selected
      const moduleForRequest = modules.find(m => 
        m.compositeId === compositeId || 
        m.globalModuleId === compositeId
      );
      
      if (!moduleForRequest) {
        console.error('No module found with compositeId:', compositeId);
        throw new Error('Selected module not found');
      }
      
      // The module ID to send to the backend is just the numeric part
      const actualModuleId = moduleForRequest.id;
      
      // Normalize module object to handle case sensitivity issues
      // Create a normalized version of the module with consistent property names
      const normalizedModule = {
        id: moduleForRequest.id,
        title: moduleForRequest.title,
        code: moduleForRequest.code,
        departmentId: moduleForRequest.departmentId || 
                     (moduleForRequest as any).departmentid || 
                     (moduleForRequest as any).DepartmentId,
        departmentCode: moduleForRequest.departmentCode || 
                       (moduleForRequest as any).departmentcode || 
                       (moduleForRequest as any).DepartmentCode,
        isGlobalModule: Boolean(
          moduleForRequest.isGlobalModule || 
          (moduleForRequest as any).isglobalmodule || 
          (moduleForRequest as any).IsGlobalModule
        )
      };
      
      // Enhanced logging to debug module selection
      console.log('Selected module for enrollment:', moduleForRequest);
      console.log('Normalized module properties:', normalizedModule);
      console.log('Student departmentId:', departmentId);
      console.log('Submitting enrollment request with ID:', actualModuleId);
      
      // Check if this is actually a global module from another department
      const isFromDifferentDepartment = normalizedModule.departmentId !== departmentId;
      const isGlobalModule = normalizedModule.isGlobalModule || isFromDifferentDepartment;
      
      console.log('Is from different department:', isFromDifferentDepartment);
      console.log('Final isGlobalModule flag:', isGlobalModule);
      
      // For global modules, we MUST use the module's department ID (not the student's)
      // For local modules, we use the student's department ID
      let targetDepartmentId: number | undefined;
      
      if (isGlobalModule) {
        // For global modules, use the module's department ID
        if (!normalizedModule.departmentId) {
          console.error('Missing departmentId for global module:', moduleForRequest);
          console.error('Available properties:', Object.keys(moduleForRequest).join(', '));
          throw new Error('Department ID is required for global module enrollment');
        }
        
        targetDepartmentId = Number(normalizedModule.departmentId); // Ensure it's a number
        console.log('Using module department ID:', targetDepartmentId);
      } else {
        // For local modules, use the student's department ID
        targetDepartmentId = departmentId || undefined;
        console.log('Using student department ID:', targetDepartmentId);
      }
      
      console.log('Using departmentId for request:', targetDepartmentId);
      
      // Submit enrollment request with correct department info and global module flag
      await requestEnrollment(
        actualModuleId, 
        values.reason,
        targetDepartmentId, // Already properly typed as number | undefined
        isGlobalModule
      );
      
      let requestDescription = `Your request for ${moduleForRequest.code} - ${moduleForRequest.title}`;
      if (moduleForRequest.isGlobalModule) {
        requestDescription += ` from the ${moduleForRequest.departmentCode?.toUpperCase()} department`;
      }
      requestDescription += ' has been submitted for approval.';
      
      toast({
        title: 'Enrollment Request Submitted',
        description: requestDescription,
      });
      
      form.reset();
      setSelectedModule(null);
      setSubmitting(false);
    } catch (err: any) {
      console.error('Error submitting enrollment request:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to submit enrollment request. Please try again.',
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className="shadow-md">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-xl font-semibold">Module Enrollment Request</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="shadow-md">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-xl font-semibold">Module Enrollment Request</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
            <p>{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No available modules state
  const availableModules = modules.filter(module => !module.isEnrolled && !module.isPending);
  if (availableModules.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-xl font-semibold">Module Enrollment Request</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800">
            <p>You are already enrolled in all available modules or have pending requests for them.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main form view
  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <CardTitle className="text-xl font-semibold">Module Enrollment Request</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="moduleId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Module</FormLabel>
                  <FormControl>
                    <div className="relative">
                      {/* Custom Dropdown Trigger */}
                      <Button 
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                        onClick={() => setOpen(!open)}
                        disabled={submitting || loading}
                      >
                        {field.value && selectedModule ? (
                          selectedModule.isGlobalModule ? (
                            <div className="flex items-center gap-2">
                              <span>{selectedModule.code} - {selectedModule.title}</span>
                              <Badge variant="outline" className="text-xs bg-blue-50">
                                {selectedModule.departmentCode?.toUpperCase()}
                              </Badge>
                            </div>
                          ) : (
                            <span>{selectedModule.code} - {selectedModule.title}</span>
                          )
                        ) : (
                          "Select a module"
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                      
                      {/* Dropdown Menu */}
                      {open && (
                        <div className="absolute top-full left-0 z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                          <div className="p-1 max-h-[300px] overflow-y-auto">
                            {/* Group modules by type */}
                            <div className="space-y-2">
                              {/* Local Department Modules */}
                              {modules.some(m => !m.isEnrolled && !m.isPending && !m.isGlobalModule) && (
                                <div>
                                  <div className="mb-2 px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                    {departmentCode?.toUpperCase()} Department Modules
                                  </div>
                                  {modules
                                    .filter(m => !m.isEnrolled && !m.isPending && !m.isGlobalModule)
                                    .map((module, index) => (
                                      <div
                                        key={`local-${index}-${module.id}`}
                                        className={cn(
                                          "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                                          field.value === module.compositeId && "bg-accent text-accent-foreground"
                                        )}
                                        onClick={() => {
                                          console.log('Selecting LOCAL module:', module.code);
                                          console.log('  with ID:', module.id);
                                          console.log('  compositeId:', module.compositeId);
                                          
                                          // Important: Store the compositeId in the form
                                          field.onChange(module.compositeId);
                                          setSelectedModule(module);
                                          setOpen(false);
                                        }}
                                      >
                                        <div className="flex flex-1 items-center">
                                          {module.code} - {module.title}
                                        </div>
                                        {field.value === module.compositeId && (
                                          <Check className="ml-auto h-4 w-4" />
                                        )}
                                      </div>
                                    ))}
                                </div>
                              )}
                              
                              {/* Separator if we have both types */}
                              {modules.some(m => !m.isEnrolled && !m.isPending && !m.isGlobalModule) && 
                               modules.some(m => !m.isEnrolled && !m.isPending && m.isGlobalModule) && (
                                <div className="my-2 border-t border-gray-200" />
                              )}
                              
                              {/* Global Modules from Other Departments */}
                              {modules.some(m => !m.isEnrolled && !m.isPending && m.isGlobalModule) && (
                                <div>
                                  <div className="mb-2 px-2 py-1.5 text-sm font-semibold text-muted-foreground flex items-center">
                                    Global Modules From Other Departments
                                  </div>
                                  {modules
                                    .filter(m => !m.isEnrolled && !m.isPending && m.isGlobalModule)
                                    .map((module, index) => (
                                      <div
                                        key={`global-${index}-${module.id}-${module.departmentCode}`}
                                        className={cn(
                                          "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                                          field.value === module.compositeId && "bg-accent text-accent-foreground"
                                        )}
                                        onClick={() => {
                                          console.log('Selecting GLOBAL module:', module.code);
                                          console.log('  with ID:', module.id);
                                          console.log('  from dept:', module.departmentCode);
                                          console.log('  compositeId:', module.compositeId);
                                          
                                          // Important: Store the compositeId in the form
                                          field.onChange(module.compositeId);
                                          setSelectedModule(module);
                                          setOpen(false);
                                        }}
                                      >
                                        <div className="flex flex-1 items-center justify-between">
                                          <span>{module.code} - {module.title}</span>
                                          <Badge variant="outline" className="ml-2 text-xs bg-blue-50">
                                            {module.departmentCode?.toUpperCase()}
                                          </Badge>
                                        </div>
                                        {field.value === module.compositeId && (
                                          <Check className="ml-auto h-4 w-4" />
                                        )}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    {selectedModule?.isGlobalModule ? (
                      <>This is a global module from the {selectedModule.departmentCode?.toUpperCase()} department.</>
                    ) : (
                      <>Select from your department's modules or global modules from other departments.</>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Enrollment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={selectedModule ? 
                        `Please explain why you want to enroll in ${selectedModule.code} - ${selectedModule.title}...` : 
                        "Please explain why you want to enroll in this module..."}
                      className="resize-none h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a clear explanation for your request. This will help in the approval process.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => form.reset()} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EnrollmentForm;
