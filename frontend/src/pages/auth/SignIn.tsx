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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

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
      const firstRole = await login(values.email, values.password);
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (firstRole === 'student') {
        setLocation('/student/dashboard');
      } else if (firstRole === 'academic_staff') {
        setLocation('/academic/dashboard');
      } else if (firstRole === 'department_admin') {
        setLocation('/department/dashboard');
      } else if (firstRole === 'central_admin') {
        setLocation('/central/dashboard');
      } else {
        setLocation('/student/dashboard');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleGroups = [
    {
      label: 'Admin Accounts',
      users: [
        { email: 'cs.admin@university.ac.uk', password: 'fidaa123' },
        { email: 'math.admin@university.ac.uk', password: 'fidaa123' },
        { email: 'central.admin@university.ac.uk', password: 'fidaa123' },
      ],
    },
    {
      label: 'Student Accounts',
      users: [
        { email: 'james.wilson@cs.university.ac.uk', password: '20010512' },
        { email: 'emily.clarke@math.university.ac.uk', password: '20030107' },
      ],
    },
    {
      label: 'Staff Accounts',
      users: [
        { email: 'elizabeth.johnson@cs.university.ac.uk', password: '19680324' },
        { email: 'jonathan.phillips@math.university.ac.uk', password: '19700412' },
      ],
    },
    {
      label: 'Invalid Credentials',
      users: [
        { email: 'notfound@example.com', password: 'wrongpass' },
        { email: 'inactive@example.com', password: 'inactivepass' },
      ],
    },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="flex flex-col md:flex-row gap-6 max-w-5xl w-full">
        {/* Sign-in Card */}
        <Card className="w-full md:w-1/2">
          <CardHeader>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSignIn)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input autoFocus placeholder="Enter your email" {...field} />
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
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                        />
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
          <CardFooter>
            <p className="text-sm text-gray-500">
              Don't have an account? Contact your administrator.
            </p>
          </CardFooter>
        </Card>

        {/* Sample Accounts Note Card */}
        <Card className="w-full md:w-1/2 bg-yellow-50 border-yellow-300 shadow-inner">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-800">Demo Note</CardTitle>
            <CardDescription className="text-yellow-700">
              Sample accounts for demo/testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[500px] overflow-auto text-xs text-yellow-900">
            {sampleGroups.map((group, idx) => (
              <div key={idx}>
                <p className="font-semibold">{group.label}:</p>
                {group.users.map((user, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-yellow-100 border border-yellow-300 rounded px-2 py-1 mb-1"
                  >
                    <div>
                      <p>{user.email}</p>
                      <p className="text-yellow-600">{user.password}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue('email', user.email);
                        form.setValue('password', user.password);
                      }}
                      className="text-yellow-700 underline text-xs"
                    >
                      Fill
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
