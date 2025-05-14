import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useUser } from '@/contexts/UserContext';

// Keep the interfaces simple for timetable entries
interface TimetableEntry {
  id: string;
  day: string;
  moduleCode: string;
  moduleName: string;
  startTime: string;
  endTime: string;
  room?: string;
  type: 'class' | 'exam';
}

const SimpleTimetable: React.FC = () => {
  const [location] = useLocation();
  const { isAuthenticated } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [department, setDepartment] = useState<string>('');
  
  // Check if we're on the exam timetable page
  const isExamPage = location === '/exam-timetable';
  const endpoint = isExamPage ? '/api/timetable/exams' : '/api/timetable/classes';
  const title = isExamPage ? 'Exam Timetable' : 'Class Timetable';
  
  // Fetch timetable data from the API
  useEffect(() => {
    const fetchTimetableData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!isAuthenticated) {
          setError('Please log in to view your timetable');
          setLoading(false);
          return;
        }
        
        // Get auth token
        const authJson = localStorage.getItem('auth');
        const token = authJson ? JSON.parse(authJson).token : null;
        
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }
        
        // Fetch timetable data
        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Log the full response for debugging
        console.log('Timetable API response:', response.data);
        
        // Extract entries based on endpoint
        const entries = isExamPage
          ? response.data.exams || []
          : response.data.classes || [];
          
        setTimetableEntries(entries);
        
        // Save department info if available
        if (response.data.department) {
          setDepartment(response.data.department);
          console.log('Department from API:', response.data.department);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching timetable data:', err);
        setError('Failed to load timetable data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchTimetableData();
  }, [isAuthenticated, endpoint, isExamPage]);
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading timetable...</span>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="mt-2 text-lg">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Department Badge */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {department && (
              <Badge className="capitalize bg-blue-100 text-blue-800 hover:bg-blue-200">
                {department.replace('_schema', '')} Department
              </Badge>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant={!isExamPage ? 'default' : 'outline'}
              onClick={() => window.location.pathname = '/class-timetable'}
            >
              Classes
            </Button>
            <Button 
              variant={isExamPage ? 'default' : 'outline'}
              onClick={() => window.location.pathname = '/exam-timetable'}
            >
              Exams
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Your {isExamPage ? 'Exam' : 'Class'} Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {timetableEntries.length > 0 ? (
              <div className="space-y-4">
                {timetableEntries.map(entry => (
                  <div 
                    key={entry.id}
                    className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium text-lg">{entry.moduleName}</h3>
                        <p className="text-sm text-gray-600">{entry.moduleCode}</p>
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Time:</span> {entry.startTime} - {entry.endTime}
                        </div>
                        {entry.room && (
                          <div className="mt-1 text-sm">
                            <span className="font-medium">Location:</span> {entry.room}
                          </div>
                        )}
                      </div>
                      <Badge variant={entry.type === 'exam' ? 'destructive' : 'outline'}>
                        {entry.type === 'exam' ? 'EXAM' : 'CLASS'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border rounded-lg">
                <p className="text-muted-foreground">No {isExamPage ? 'exams' : 'classes'} scheduled.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SimpleTimetable;
