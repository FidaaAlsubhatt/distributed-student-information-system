import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TableList from '@/components/dashboard/TableList';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartBarIcon, AcademicCapIcon, BuildingLibraryIcon, UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

type Student = {
  global_user_id: string;
  local_id: string;
  student_number: string;
  university_email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  academic_year: number;
  enroll_date: string;
  status: string;
  department_code: string;
};

type Enrollment = {
  global_student_id: string;
  local_student_id: string;
  module_id: string;
  status: string;
  request_date: string;
  department_code: string;
};

type Grade = {
  global_student_id: string;
  student_id: string;
  module_id: string;
  grade: string;
  is_final: boolean;
  created_at: string;
  department_code: string;
};

type Staff = {
  user_id: string;
  first_name: string;
  last_name: string;
  staff_number: string;
  university_email: string;
  title: string;
  created_at: string;
  department_code: string;
};

type Exam = {
  module_id: string;
  title: string;
  exam_date: string;
  location_id: string;
  department_code: string;
};

// Dashboard stat card component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
}> = ({ title, value, description, icon }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="p-2 rounded-full bg-primary/10">
            <div className="w-8 h-8 text-primary">{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const InstitutionReports: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);

  // Fetch all five in parallel from centralized FDW views
  useEffect(() => {
    const fetchWithAuth = async (endpoint: string) => {
      const authData = localStorage.getItem('auth');
      const token = authData ? JSON.parse(authData).token : null;
      
      try {
        const response = await fetch(`/api/central/${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error fetching ${endpoint}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return [];
      }
    };
    
    // Fetch data from centralized views using FDW
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [studentData, enrollmentData, gradeData, staffData, examData] = await Promise.all([
          fetchWithAuth('student_directory'),
          fetchWithAuth('module_enrollments'),
          fetchWithAuth('grades_overview'),
          fetchWithAuth('staff_directory'),
          fetchWithAuth('exam_schedule')
        ]);
        
        setStudents(studentData || []);
        setEnrollments(enrollmentData || []);
        setGrades(gradeData || []);
        setStaff(staffData || []);
        setExams(examData || []);
      } catch (error) {
        console.error('Error fetching central data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  const studentColumns = [
    { key: 'global_user_id', header: 'Global ID' },
    { key: 'local_id',        header: 'Local ID' },
    { key: 'student_number',  header: 'Student #' },
    { key: 'university_email',header: 'Email' },
    { key: 'first_name',      header: 'First Name' },
    { key: 'last_name',       header: 'Last Name' },
    { key: 'date_of_birth',   header: 'DOB' },
    { key: 'academic_year',   header: 'Year' },
    { key: 'enroll_date',     header: 'Enroll Date' },
    { key: 'status',          header: 'Status' },
    { key: 'department_code', header: 'Dept' },
  ];

  const enrollmentColumns = [
    { key: 'global_student_id', header: 'Global Student ID' },
    { key: 'local_student_id',  header: 'Local Student ID' },
    { key: 'module_id',         header: 'Module' },
    { key: 'status',            header: 'Status' },
    { key: 'request_date',      header: 'Requested' },
    { key: 'department_code',   header: 'Dept' },
  ];

  const gradeColumns = [
    { key: 'global_student_id', header: 'Global Student ID' },
    { key: 'student_id',        header: 'Local Student ID' },
    { key: 'module_id',         header: 'Module' },
    { key: 'grade',             header: 'Grade' },
    { key: 'is_final',          header: 'Final?' },
    { key: 'created_at',        header: 'Recorded' },
    { key: 'department_code',   header: 'Dept' },
  ];

  const staffColumns = [
    { key: 'user_id',          header: 'Staff ID' },
    { key: 'first_name',       header: 'First Name' },
    { key: 'last_name',        header: 'Last Name' },
    { key: 'staff_number',     header: 'Number' },
    { key: 'university_email', header: 'Email' },
    { key: 'title',            header: 'Title' },
    { key: 'created_at',       header: 'Joined' },
    { key: 'department_code',  header: 'Dept' },
  ];

  const examColumns = [
    { key: 'module_id',       header: 'Module' },
    { key: 'title',           header: 'Title' },
    { key: 'exam_date',       header: 'Date' },
    { key: 'location_id',     header: 'Location' },
    { key: 'department_code', header: 'Dept' },
  ];

  // Calculate summary statistics from raw data
  const calculateSummaryStats = () => {
    // Department statistics
    const departmentCounts = students.reduce((acc, student) => {
      acc[student.department_code] = (acc[student.department_code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const departmentPieData = Object.entries(departmentCounts).map(([dept, count], index) => ({
      name: dept,
      value: count,
      color: COLORS[index % COLORS.length]
    }));
    
    // Status statistics
    const statusCounts = students.reduce((acc, student) => {
      acc[student.status] = (acc[student.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count
    }));
    
    // Academic year distribution
    const yearCounts = students.reduce((acc, student) => {
      const year = student.academic_year.toString();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const yearData = Object.entries(yearCounts)
      .map(([year, count]) => ({
        name: `Year ${year}`,
        students: count
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Enrollment distribution by department
    const deptEnrollmentCounts = enrollments.reduce((acc, enrollment) => {
      acc[enrollment.department_code] = (acc[enrollment.department_code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const deptEnrollmentData = Object.entries(deptEnrollmentCounts).map(([dept, count]) => ({
      name: dept,
      enrollments: count
    }));
    
    // Grade distribution
    const gradeDistribution = grades.reduce((acc, grade) => {
      // Assuming UK grading system with First, 2:1, 2:2, Third, Pass, Fail
      let category = 'Other';
      
      // Assuming grades are stored as A, B, C, D, etc.
      if (grade.grade === 'A' || grade.grade === 'A+') category = 'First';
      else if (grade.grade === 'B' || grade.grade === 'B+') category = '2:1';
      else if (grade.grade === 'C' || grade.grade === 'C+') category = '2:2';
      else if (grade.grade === 'D' || grade.grade === 'D+') category = 'Third';
      else if (grade.grade === 'E') category = 'Pass';
      else if (grade.grade === 'F') category = 'Fail';
      
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const gradeData = Object.entries(gradeDistribution).map(([grade, count]) => ({
      name: grade,
      students: count
    }));
    
    return {
      departmentPieData,
      statusData,
      yearData,
      deptEnrollmentData,
      gradeData,
      totalStudents: students.length,
      totalStaff: staff.length,
      totalEnrollments: enrollments.length,
      totalModules: [...new Set(enrollments.map(e => e.module_id))].length,
      totalExams: exams.length
    };
  };
  
  const summaryStats = students.length > 0 ? calculateSummaryStats() : null;
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Institution Reports</h2>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading institution data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Statistics */}
            {summaryStats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <StatCard 
                  title="Total Students" 
                  value={summaryStats.totalStudents} 
                  description="Enrolled across all departments"
                  icon={<AcademicCapIcon />} 
                />
                <StatCard 
                  title="Academic Staff" 
                  value={summaryStats.totalStaff} 
                  description="Faculty and researchers"
                  icon={<UserGroupIcon />} 
                />
                <StatCard 
                  title="Active Modules" 
                  value={summaryStats.totalModules} 
                  description="Currently being taught"
                  icon={<ChartBarIcon />} 
                />
                <StatCard 
                  title="Total Enrollments" 
                  value={summaryStats.totalEnrollments} 
                  description="Module registrations"
                  icon={<CheckCircleIcon />} 
                />
                <StatCard 
                  title="Scheduled Exams" 
                  value={summaryStats.totalExams} 
                  description="Upcoming assessments"
                  icon={<BuildingLibraryIcon />} 
                />
              </div>
            )}

            <Tabs defaultValue="students" onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
                <TabsTrigger value="grades">Grades</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
                <TabsTrigger value="exams">Exams</TabsTrigger>
              </TabsList>

              <TabsContent value="students">
                {summaryStats && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Students by Department</CardTitle>
                        <CardDescription>Distribution of students across academic departments</CardDescription>
                      </CardHeader>
                      <CardContent className="flex justify-center">
                        <div className="h-[300px] w-full max-w-[500px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={summaryStats.departmentPieData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {summaryStats.departmentPieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Students by Academic Year</CardTitle>
                        <CardDescription>Distribution across year groups</CardDescription>
                      </CardHeader>
                      <CardContent className="flex justify-center">
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={summaryStats.yearData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="students" fill="#8884d8" name="Students" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                <Card>
                  <CardHeader>
                    <CardTitle>Student Directory</CardTitle>
                    <CardDescription>Complete student records from all departments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TableList columns={studentColumns} data={students} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="enrollments">
                {summaryStats && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Enrollments by Department</CardTitle>
                      <CardDescription>Module enrollment distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={summaryStats.deptEnrollmentData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="enrollments" fill="#00C49F" name="Enrollments" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardHeader>
                    <CardTitle>Module Enrollments</CardTitle>
                    <CardDescription>All student module registrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TableList columns={enrollmentColumns} data={enrollments} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="grades">
                {summaryStats && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Grade Distribution</CardTitle>
                      <CardDescription>Performance across all departments</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={summaryStats.gradeData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="students" fill="#FFBB28" name="Students" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardHeader>
                    <CardTitle>Grades Overview</CardTitle>
                    <CardDescription>Student academic performance records</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TableList columns={gradeColumns} data={grades} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="staff">
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Directory</CardTitle>
                    <CardDescription>Academic and administrative personnel</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TableList columns={staffColumns} data={staff} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="exams">
                <Card>
                  <CardHeader>
                    <CardTitle>Exam Schedule</CardTitle>
                    <CardDescription>Upcoming assessments across all departments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TableList columns={examColumns} data={exams} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstitutionReports;
