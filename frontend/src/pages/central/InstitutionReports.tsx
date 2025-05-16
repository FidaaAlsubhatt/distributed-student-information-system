import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TableList from '@/components/dashboard/TableList';

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

const InstitutionReports: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Institution Reports</h2>

        <Tabs defaultValue="students">
          <TabsList>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Student Directory</CardTitle>
              </CardHeader>
              <CardContent>
                <TableList columns={studentColumns} data={students} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments">
            <Card>
              <CardHeader>
                <CardTitle>Module Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                <TableList columns={enrollmentColumns} data={enrollments} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades">
            <Card>
              <CardHeader>
                <CardTitle>Grades Overview</CardTitle>
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
              </CardHeader>
              <CardContent>
                <TableList columns={examColumns} data={exams} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default InstitutionReports;
