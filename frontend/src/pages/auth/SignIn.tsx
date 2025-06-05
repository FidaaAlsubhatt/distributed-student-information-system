import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser } from '../../contexts/UserContext';
import { Button } from '../../components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';

// Define the form schema
const formSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignIn() {
  const { login } = useUser();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSignIn = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Login and get the first role
      const firstRole = await login(values.email, values.password);
      console.log('Login successful, role:', firstRole);
      
      // Small delay to ensure authentication state is properly set
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Redirect based on role
      if (firstRole === 'student') {
        console.log('Redirecting to student dashboard');
        setLocation('/student/dashboard');
      } else if (firstRole === 'academic_staff') {
        console.log('Redirecting to academic dashboard');
        setLocation('/academic/dashboard');
      } else if (firstRole === 'department_admin') {
        console.log('Redirecting to department dashboard');
        setLocation('/department/dashboard');
      } else if (firstRole === 'central_admin') {
        console.log('Redirecting to central dashboard');
        setLocation('/central/dashboard');
      } else {
        // Fallback to student dashboard if role is unknown
        console.log('Unknown role, redirecting to student dashboard');
        setLocation('/student/dashboard');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-sm text-gray-500">
            Don't have an account? Contact your administrator.
          </p>
          <div className="w-full border-t pt-4">
            <p className="text-xs text-gray-400 mb-2">Admin Accounts:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="font-semibold">CS Department Admin:</p>
                <p>cs.admin@university.ac.uk</p>
                <p>fidaa123</p>
              </div>
              <div>
                <p className="font-semibold">Math Department Admin:</p>
                <p>math.admin@university.ac.uk</p>
                <p>fidaa123</p>
              </div>
              <div>
                <p className="font-semibold">Central Admin:</p>
                <p>central.admin@university.ac.uk</p>
                <p>fidaa123</p>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}