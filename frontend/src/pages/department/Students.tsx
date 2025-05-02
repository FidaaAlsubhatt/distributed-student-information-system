import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AddStudentForm from '@/components/department/students/AddStudentForm';
import { Button } from '@/components/ui/button';
import { PlusCircle, UserPlus, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Students = () => {
  const { toast } = useToast();
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const data = await api.getStudents();
        setStudents(data);
      } catch (error: any) {
        console.error('Error fetching students:', error);
        toast({
          title: 'Error',
          description: `Failed to load students: ${error.message || 'Unknown error'}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [toast]);

  return (
    <ProtectedRoute requiredRole="department_admin">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Students</h1>
          <Button onClick={() => setIsAddStudentOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <CardDescription>
              Manage students enrolled in your department
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No students found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsAddStudentOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add your first student
                </Button>
              </div>
            ) : (
              <Table>
                <TableCaption>A list of all students in your department.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>University Email</TableHead>
                    <TableHead>Year of Study</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.student_id}>
                      <TableCell className="font-medium">{student.student_number}</TableCell>
                      <TableCell>{`${student.first_name} ${student.last_name}`}</TableCell>
                      <TableCell>{student.university_email}</TableCell>
                      <TableCell>{student.year_of_study}</TableCell>
                      <TableCell>{student.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AddStudentForm 
        isOpen={isAddStudentOpen} 
        onClose={() => setIsAddStudentOpen(false)} 
      />
    </ProtectedRoute>
  );
};

export default Students;
