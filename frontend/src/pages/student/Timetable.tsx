import React, { useState } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { timetable } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin } from 'lucide-react';

const Timetable: React.FC = () => {
  const [location] = useLocation();
  const [selectedView, setSelectedView] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDay, setSelectedDay] = useState('Monday');
  
  // Check if we're on the exam timetable page
  const isExamTimetable = location === '/exam-timetable';
  
  // Filter the timetable based on type (class or exam)
  const classTimetableEntries = timetable.filter(entry => entry.type === 'class');
  const examTimetableEntries = timetable.filter(entry => entry.type === 'exam');
  
  // Get entries for the current type
  const currentTimetableEntries = isExamTimetable ? examTimetableEntries : classTimetableEntries;
  
  // Get all days of the week for class timetable or unique days for exam timetable
  const days = isExamTimetable 
    ? [...new Set(examTimetableEntries.map(entry => entry.day))]
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            {isExamTimetable ? 'Exam Timetable' : 'Class Timetable'}
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant={isExamTimetable ? 'outline' : 'default'}
              onClick={() => window.location.href = '/class-timetable'}
            >
              Class Schedule
            </Button>
            <Button
              variant={isExamTimetable ? 'default' : 'outline'}
              onClick={() => window.location.href = '/exam-timetable'}
            >
              Exam Schedule
            </Button>
          </div>
        </div>
        
        {/* View Selector Tabs */}
        {!isExamTimetable && (
          <Tabs defaultValue="weekly" onValueChange={(value) => setSelectedView(value as 'weekly' | 'daily')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="weekly">Weekly View</TabsTrigger>
              <TabsTrigger value="daily">Daily View</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        
        {/* If exam timetable, always show daily view */}
        {isExamTimetable && (
          <div className="flex justify-end">
            <Select defaultValue={days[0]} onValueChange={setSelectedDay}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {days.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Weekly View for Class Timetable */}
        {!isExamTimetable && selectedView === 'weekly' && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Weekly Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="w-20 p-2 border bg-gray-50 text-xs text-gray-500">Time</th>
                      {days.map((day) => (
                        <th key={day} className="p-2 border bg-gray-50 text-xs text-gray-500">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((time) => (
                      <tr key={time} className="border-b">
                        <td className="w-20 p-2 border-r text-center text-xs text-gray-500">{time}</td>
                        {days.map((day) => {
                          const entry = getEntryForTimeSlot(day, time);
                          return (
                            <td key={day} className="p-2 border-r h-20 align-top">
                              {entry && (
                                <div className={`p-2 rounded text-xs ${getModuleColor(entry.moduleCode)}`}>
                                  <div className="font-medium">{entry.moduleName}</div>
                                  <div className="mt-1">{entry.startTime} - {entry.endTime}</div>
                                  <div className="mt-1">{entry.room}, {entry.building}</div>
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
            </CardContent>
          </Card>
        )}
        
        {/* Daily View (for both class and exam timetables) */}
        {(isExamTimetable || selectedView === 'daily') && (
          <div className="space-y-4">
            {!isExamTimetable && (
              <div className="flex justify-end">
                <Select defaultValue="Monday" onValueChange={setSelectedDay}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  {selectedDay}'s {isExamTimetable ? 'Exams' : 'Schedule'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getDailyEntries(selectedDay).length > 0 ? (
                    getDailyEntries(selectedDay).map((entry, index) => (
                      <Card key={index} className="p-4 border">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <Badge className={getModuleColor(entry.moduleCode)}>
                              {entry.moduleCode}
                            </Badge>
                            <h3 className="text-lg font-medium mt-2">{entry.moduleName}</h3>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-2" />
                                {entry.startTime} - {entry.endTime}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2" />
                                {entry.room}, {entry.building}
                              </div>
                              {entry.students && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  {entry.students} students
                                </div>
                              )}
                            </div>
                          </div>
                          {isExamTimetable && (
                            <div className="flex flex-col items-center md:items-end">
                              <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                                Exam
                              </Badge>
                              <div className="mt-2 text-sm font-medium text-gray-700">
                                Duration: 2 hours
                              </div>
                              <Button variant="outline" className="mt-2">
                                View Details
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No {isExamTimetable ? 'exams' : 'classes'} scheduled for {selectedDay}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Legend */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[...new Set(currentTimetableEntries.map(entry => entry.moduleCode))].map((moduleCode, index) => {
                const entry = currentTimetableEntries.find(e => e.moduleCode === moduleCode);
                return entry ? (
                  <Badge key={index} className={getModuleColor(moduleCode)}>
                    {moduleCode} - {entry.moduleName}
                  </Badge>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Timetable;
