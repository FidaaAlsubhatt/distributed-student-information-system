import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// Assignment interface based on the database structure
interface Assignment {
  id: string;
  title: string;
  description?: string;
  module: string;
  modulecode: string;
  duedate: string;
  totalmarks?: number;
  weight?: number;
}

const SubmitAssignment: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submitted, setSubmitted] = useState(false);
  
  // Get assignment ID from multiple possible sources
  const getAssignmentId = () => {
    // Try URL query parameters first
    const searchParams = new URLSearchParams(window.location.search);
    const idFromQuery = searchParams.get('id');
    if (idFromQuery) {
      console.log('Found assignment ID in URL query:', idFromQuery);
      return idFromQuery;
    }
    
    // Try sessionStorage as fallback
    const idFromSession = sessionStorage.getItem('currentAssignmentId');
    if (idFromSession) {
      console.log('Found assignment ID in sessionStorage:', idFromSession);
      return idFromSession;
    }
    
    // Try to extract from URL pathname as last resort
    const pathParts = window.location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart !== 'submit-assignment') {
      console.log('Extracted assignment ID from pathname:', lastPart);
      return lastPart;
    }
    
    console.log('No assignment ID found in any source');
    return null;
  };
  
  const assignmentId = getAssignmentId();
  
  useEffect(() => {
    // Fetch assignment details when component mounts
    if (!assignmentId) {
      setError('No assignment ID provided');
      setLoading(false);
      return;
    }
    
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        // Get auth token
        const authJson = localStorage.getItem('auth');
        const token = authJson ? JSON.parse(authJson).token : null;
        
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        // In a real implementation, this would call the API
        // For now, we'll simulate a successful response
        setTimeout(() => {
          // Mock data for an assignment
          setAssignment({
            id: assignmentId,
            title: "Programming Assignment: Data Structures",
            description: "Implement linked lists and demonstrate their operation.",
            module: "Computer Science Fundamentals",
            modulecode: "CS101",
            duedate: "2025-06-01T23:59:59.000Z",
            totalmarks: 100,
            weight: 20
          });
          setLoading(false);
        }, 800);
        
      } catch (err) {
        console.error('Error fetching assignment:', err);
        setError('Failed to load assignment details');
        setLoading(false);
      }
    };
    
    fetchAssignment();
  }, [assignmentId]);
  
  const handleSubmit = async () => {
    if (!assignmentId) {
      toast({
        title: "Error",
        description: "Assignment ID is missing",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Start progress simulation
      const interval = setInterval(() => {
        setSubmitProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // Get auth token
      const authJson = localStorage.getItem('auth');
      const token = authJson ? JSON.parse(authJson).token : null;
      
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive"
        });
        clearInterval(interval);
        setSubmitting(false);
        return;
      }
      
      // In a real implementation, this would call the API
      // Sample submission data
      const submissionData = {
        assignmentId: assignmentId,
        // For a real implementation with department-specific routes:
        // departmentId: userDepartment,
        // Include a placeholder filepath as in your screenshot
        filepath: `/submissions/linked_list_submission_${assignmentId}.zip`
      };
      
      // Simulate API call
      setTimeout(() => {
        // Simulate successful submission
        clearInterval(interval);
        setSubmitProgress(100);
        setSubmitting(false);
        setSubmitted(true);
        
        // Show success toast
        toast({
          title: "Success",
          description: "Assignment submitted successfully",
          variant: "default"
        });
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setSubmitting(false);
      
      toast({
        title: "Error",
        description: "Failed to submit assignment. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (loading) {
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
            <CardContent className="p-8 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-gray-500">Loading assignment details...</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error || !assignment) {
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
            <CardContent className="p-8 flex flex-col items-center justify-center">
              <p className="text-gray-500">{error || 'Assignment not found'}</p>
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
            <p className="text-sm text-gray-600 mt-1">
              {assignment.module} ({assignment.modulecode}) • Due: {format(new Date(assignment.duedate), 'PPp')}
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Assignment Details */}
              <div className="space-y-4 rounded-md border border-gray-200 p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {assignment.totalmarks && (
                    <div>
                      <span className="font-medium block">Total Marks:</span>
                      <span>{assignment.totalmarks}</span>
                    </div>
                  )}
                  {assignment.weight && (
                    <div>
                      <span className="font-medium block">Weight:</span>
                      <span>{assignment.weight}%</span>
                    </div>
                  )}
                </div>
                {assignment.description && (
                  <div>
                    <span className="font-medium block">Description:</span>
                    <p className="text-sm mt-1">{assignment.description}</p>
                  </div>
                )}
              </div>
              
              {/* Simple submission panel */}
              <div className="border rounded-md p-6 bg-gray-50">
                <p className="text-center text-gray-600 mb-4">
                  {submitted ? 
                    "Your assignment has been submitted successfully." : 
                    "Click the button below to submit this assignment."}
                </p>
                
                {submitting && (
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Processing submission...</span>
                      <span className="text-gray-700 font-medium">{submitProgress}%</span>
                    </div>
                    <Progress value={submitProgress} />
                  </div>
                )}
                
                {submitted && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center mt-4">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-700">
                      Assignment submitted successfully!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
            <Link href="/assignments">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button 
              onClick={handleSubmit}
              disabled={submitting || submitted}
            >
              {submitted ? "Submitted" : submitting ? "Submitting..." : "Submit Assignment"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SubmitAssignment;