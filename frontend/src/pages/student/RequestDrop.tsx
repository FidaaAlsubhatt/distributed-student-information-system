import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { modules } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangleIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  moduleCode: z.string().min(1, { message: "Please select a module" }),
  reason: z.string().min(10, { message: "Reason must be at least 10 characters" }),
  acknowledgement: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge the terms" }),
  }),
});

type FormValues = z.infer<typeof formSchema>;

const RequestDrop: React.FC = () => {
  const { toast } = useToast();
  const activeModules = modules.filter(module => module.status === 'active');
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      moduleCode: '',
      reason: '',
      acknowledgement: false,
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log(data);
    
    toast({
      title: "Drop request submitted",
      description: `Your request to drop ${data.moduleCode} has been submitted for approval.`,
    });
    
    // In a real app, would redirect after successful submission
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/modules">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">Request Module Drop</h2>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Dropping a module may affect your academic progress, financial aid, and graduation timeline. Please consult with your academic advisor before proceeding.
            </AlertDescription>
          </Alert>
          
          <Card className="shadow-md">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-xl font-semibold">Module Drop Request</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="moduleCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Module to Drop</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select module" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {activeModules.map((module) => (
                              <SelectItem key={module.id} value={module.code}>
                                {module.code} - {module.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for Dropping</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please explain why you need to drop this module..."
                            className="resize-none h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Be specific about your reasons. This information will help in the approval process.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                    <h4 className="font-medium text-amber-800 mb-2">Please note:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
                      <li>Dropping after the withdrawal deadline may result in a 'W' grade on your transcript.</li>
                      <li>If you drop below full-time status (12 credits), your financial aid may be affected.</li>
                      <li>International students must maintain full-time enrollment status to maintain visa eligibility.</li>
                    </ul>
                  </div>

                  <FormField
                    control={form.control}
                    name="acknowledgement"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Acknowledgement</FormLabel>
                          <FormDescription>
                            I understand the consequences of dropping this module and have consulted with my academic advisor.
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Link href="/modules">
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    </Link>
                    <Button type="submit" variant="destructive">
                      Submit Drop Request
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RequestDrop;
