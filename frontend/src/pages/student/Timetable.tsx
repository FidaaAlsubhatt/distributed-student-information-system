import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useUser } from '@/contexts/UserContext';

// Define interfaces for our timetable data
interface ClassSession {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  building: string;
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  sessionType: string;
  lecturer: string;
  type: 'class';
}

interface ExamSession {
  id: string;
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  building: string;
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  duration: number;
  examTitle?: string; // Added to match backend response
  type: 'exam';
}

type TimetableEntry = ClassSession | ExamSession;

const Timetable: React.FC = () => {
  const [location] = useLocation();
  const { isAuthenticated } = useUser();
  const [selectedView, setSelectedView] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classTimetableEntries, setClassTimetableEntries] = useState<ClassSession[]>([]);
  const [examTimetableEntries, setExamTimetableEntries] = useState<ExamSession[]>([]);
  
  // Check if we're on the exam timetable page
  const isExamTimetable = location === '/exam-timetable';
  const isClassTimetable = location === '/class-timetable' || location === '/timetable';
  
  // Debug current location and timetable state
  console.log('Current location:', location);
  console.log('Is exam timetable:', isExamTimetable);
  console.log('Is class timetable:', isClassTimetable);
  console.log('Class entries:', classTimetableEntries.length);
  console.log('Exam entries:', examTimetableEntries.length);
  
  // CRITICAL FIX: Explicitly assign the correct timetable entries based on the current page
  // When on the exam timetable page, show ONLY exam entries
  // When on the class timetable page, show ONLY class entries
  const currentTimetableEntries = isExamTimetable ? examTimetableEntries : classTimetableEntries;
  
  // Debug which entries we're showing
  console.log('Current page entries:', currentTimetableEntries);
  
  // Get all days of the week for class timetable or unique days for exam timetable
  const days = isExamTimetable 
    ? [...new Set(examTimetableEntries.map(entry => entry.day))].sort()
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
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
        
        // Fetch class timetable data
        const classResponse = await axios.get('/api/timetable/classes', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Fetch exam timetable data
        const examResponse = await axios.get('/api/timetable/exams', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setClassTimetableEntries(classResponse.data.classes || []);
        setExamTimetableEntries(examResponse.data.exams || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching timetable data:', err);
        setError('Failed to load timetable data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchTimetableData();
  }, [isAuthenticated]);
  
  // Get daily entries for selected day
  const getDailyEntries = (day: string) => {
    return currentTimetableEntries.filter(entry => entry.day === day)
      .sort((a, b) => {
        const timeA = a.startTime.split(':').map(Number);
        const timeB = b.startTime.split(':').map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });
  };
  
  // Create time slots for the weekly view (8am to 6pm)
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 8;
    return `${hour}:00`;
  });
  
  // Check if a time slot has an entry
  const getEntryForTimeSlot = (day: string, time: string) => {
    const hour = parseInt(time.split(':')[0]);
    
    return currentTimetableEntries.find(entry => {
      const entryDay = entry.day;
      if (entryDay !== day) return false;
      
      const entryStartHour = parseInt(entry.startTime.split(':')[0]);
      const entryEndHour = parseInt(entry.endTime.split(':')[0]);
      
      // Check if this entry covers this hour
      return hour >= entryStartHour && hour < entryEndHour;
    });
  };
  
  // Get a suitable color for each module
  const getModuleColor = (moduleCode: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200', 
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200'
    ];
    
    // Simple hash function to consistently assign a color to each module
    const hash = moduleCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Format time to UK format
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    return `${hour}:${minute.toString().padStart(2, '0')}`;
  };
  
  // Format date to UK format (DD/MM/YYYY)
  const formatDate = (dateString: string) => {
    // If the date is already in DD/MM/YYYY format, return it as is
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    try {
      const date = new Date(dateString);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch {
      return dateString; // Return original if parsing fails
    }
  };
  
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
            className="mt-4">
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">
            {isExamTimetable ? 'Exam Timetable' : 'Class Timetable'}
          </h1>
          
          <div className="flex space-x-2">
            <Button 
              variant={!isExamTimetable ? 'default' : 'outline'}
              onClick={() => window.location.pathname = '/class-timetable'}
            >
              Classes
            </Button>
            <Button 
              variant={isExamTimetable ? 'default' : 'outline'}
              onClick={() => window.location.pathname = '/exam-timetable'}
            >
              Exams
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Your Schedule</CardTitle>
              <div className="flex space-x-2">
                <Button 
                  variant={selectedView === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedView('weekly')}
                >
                  Weekly View
                </Button>
                <Button 
                  variant={selectedView === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedView('daily')}
                >
                  Daily View
                </Button>
              </div>
            </div>
            
            {selectedView === 'daily' && (
              <div className="mt-4">
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger className="w-full md:w-[240px]">
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map(day => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {currentTimetableEntries.length === 0 ? (
              <div className="p-8 text-center border rounded-lg">
                <p className="text-muted-foreground">
                  {isExamTimetable 
                    ? "You don't have any scheduled exams at the moment."
                    : "You don't have any scheduled classes at the moment."}
                </p>
              </div>
            ) : selectedView === 'weekly' ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 text-left">Time</th>
                      {days.map(day => (
                        <th key={day} className="border p-2 text-left">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(time => (
                      <tr key={time}>
                        <td className="border p-2 whitespace-nowrap">{time}</td>
                        {days.map(day => {
                          const entry = getEntryForTimeSlot(day, time);
                          return (
                            <td key={day} className="border p-2">
                              {entry && (
                                <div className={`p-2 rounded border ${getModuleColor(entry.moduleCode)}`}>
                                  <div className="font-medium">{entry.moduleCode}</div>
                                  <div className="text-sm">{entry.moduleName}</div>
                                  
                                  {/* Exam-specific information */}
                                  {entry.type === 'exam' && (
                                    <>
                                      <div className="mt-1">
                                        <Badge variant="destructive" className="mr-1">EXAM</Badge>
                                        {entry.examTitle && (
                                          <div className="text-sm font-medium text-red-600 mt-1">
                                            {entry.examTitle}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center text-sm mt-1">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        <span>{entry.date}</span>
                                      </div>
                                    </>
                                  )}
                                  
                                  {/* Common information for both types */}
                                  <div className="flex items-center text-sm mt-1">
                                    <Clock className="w-3 h-3 mr-1" />
                                    <span>{formatTime(entry.startTime)} - {formatTime(entry.endTime)}</span>
                                  </div>
                                  <div className="flex items-center text-sm mt-1">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    <span>{entry.room}, {entry.building}</span>
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{selectedDay}'s Schedule</h3>
                {getDailyEntries(selectedDay).length > 0 ? (
                  <div className="space-y-3">
                    {getDailyEntries(selectedDay).map((entry, i) => (
                      <div 
                        key={i}
                        className={`p-4 rounded-lg border ${getModuleColor(entry.moduleCode)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-medium text-lg">{entry.moduleCode}</h4>
                            <p>{entry.moduleName}</p>
                            
                            {entry.type === 'class' && (
                              <Badge variant="outline">
                                {entry.sessionType}
                              </Badge>
                            )}
                            
                            {entry.type === 'exam' && (
                              <div className="space-y-1">
                                <Badge variant="destructive">
                                  EXAM
                                </Badge>
                                <Badge variant="outline" className="ml-2">
                                  {entry.duration} minutes
                                </Badge>
                                {entry.examTitle && (
                                  <div className="text-sm font-medium text-red-600 mt-1">
                                    {entry.examTitle}
                                  </div>
                                )}
                                {entry.date && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    <Calendar className="inline w-3 h-3 mr-1" />
                                    {entry.date}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {entry.type === 'class' && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Lecturer</p>
                              <p>{entry.lecturer}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            <div>
                              <p className="text-sm text-muted-foreground">Time</p>
                              <p>{formatTime(entry.startTime)} - {formatTime(entry.endTime)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            <div>
                              <p className="text-sm text-muted-foreground">Location</p>
                              <p>{entry.room}, {entry.building}</p>
                            </div>
                          </div>
                          
                          {entry.type === 'exam' && entry.date && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              <div>
                                <p className="text-sm text-muted-foreground">Date</p>
                                <p>{formatDate(entry.date)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border rounded-lg">
                    <p className="text-muted-foreground">No sessions scheduled for {selectedDay}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Module Legend */}
        {currentTimetableEntries.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[...new Set(currentTimetableEntries.map(entry => entry.moduleCode))].map((moduleCode) => (
                  <div 
                    key={moduleCode}
                    className={`px-2 py-1 rounded text-xs ${getModuleColor(moduleCode)}`}
                  >
                    {moduleCode}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Timetable;
