import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "./contexts/UserContext";
import NotFound from "@/pages/not-found";
import SignIn from "@/pages/auth/SignIn";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Student Pages
import StudentDashboard from "@/pages/student/Dashboard";
import Modules from "@/pages/student/Modules";
import RequestEnrollment from "@/pages/student/RequestEnrollment";
import RequestDrop from "@/pages/student/RequestDrop";
import ViewAssignments from "@/pages/student/ViewAssignments";
import SubmitAssignment from "@/pages/student/SubmitAssignment";
import ViewGrades from "@/pages/student/ViewGrades";
import Timetable from "@/pages/student/Timetable";
import Profile from "@/pages/student/Profile";
import Notifications from "@/pages/student/Notifications";
import Messages from "@/pages/student/Messages";

// Academic Staff Pages
import AcademicDashboard from "@/pages/academic/Dashboard";
import ManageModules from "@/pages/academic/ManageModules";
import ManageAssignments from "@/pages/academic/ManageAssignments";
import GradeAssignments from "@/pages/academic/GradeAssignments";
import ManageExams from "@/pages/academic/ManageExams";
import ViewStudents from "@/pages/academic/ViewStudents";

// Department Admin Pages
import DepartmentDashboard from "@/pages/department/Dashboard";
import ManageStaff from "@/pages/department/ManageStaff";
import ManageStudents from "@/pages/department/ManageStudents";
import ManagePrograms from "@/pages/department/ManagePrograms";
import DepartmentReports from "@/pages/department/Reports";
import StudentCases from "@/pages/department/StudentCases";
import DepartmentExams from "@/pages/department/Exams";
import DepartmentClasses from "@/pages/department/Classes";

// Central Admin Pages
import CentralDashboard from "@/pages/central/Dashboard";
import DepartmentManagement from "@/pages/central/DepartmentManagement";
import InstitutionReports from "@/pages/central/InstitutionReports";
import SecurityMonitoring from "@/pages/central/SecurityMonitoring";


function Router() {
  return (
    <Switch>
      {/* Default/Home route */}
      <Route path="/" component={SignIn} />
      
      {/* Role-specific dashboard routes */}
      <Route path="/student/dashboard">
        <ProtectedRoute requiredRole="student">
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/academic/dashboard">
        <ProtectedRoute requiredRole="academic_staff">
          <AcademicDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/department/dashboard">
        <ProtectedRoute requiredRole="department_admin">
          <DepartmentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/central/dashboard">
        <ProtectedRoute requiredRole="central_admin">
          <CentralDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Student routes */}
      <Route path="/modules" component={Modules} />
      <Route path="/request-enrollment" component={RequestEnrollment} />
      <Route path="/request-drop" component={RequestDrop} />
      <Route path="/assignments" component={ViewAssignments} />
      <Route path="/submit-assignment" component={SubmitAssignment} />
      <Route path="/grades" component={ViewGrades} />
      <Route path="/class-timetable" component={Timetable} />
      <Route path="/exam-timetable" component={Timetable} />
      <Route path="/profile" component={Profile} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/messages" component={Messages} />
      
      {/* Academic Staff routes */}
      <Route path="/manage-modules" component={ManageModules} />
      <Route path="/edit-module" component={ManageModules} />
      <Route path="/manage-assignments" component={ManageAssignments} />
      <Route path="/grade-assignments" component={GradeAssignments} />
      <Route path="/provide-feedback" component={GradeAssignments} />
      <Route path="/manage-exams" component={ManageExams} />
      <Route path="/schedule-exams" component={ManageExams} />
      <Route path="/update-exams" component={ManageExams} />
      <Route path="/view-students" component={ViewStudents} />
      
      {/* Department Admin routes */}
      <Route path="/manage-students" component={ManageStudents} />
      <Route path="/manage-staff" component={ManageStaff} />  
      <Route path="/manage-programs" component={ManagePrograms} />
      <Route path="/student-reports" component={DepartmentReports} />
      <Route path="/dept-performance" component={DepartmentReports} />
      <Route path="/suspension-records" component={StudentCases} />
      <Route path="/student-performance" component={StudentCases} />
      <Route path="/exams" component={DepartmentExams} />
      <Route path="/classes" component={DepartmentClasses} />
      
      {/* Central Admin routes */}
      <Route path="/manage-dept-admins" component={DepartmentManagement} />
      <Route path="/user-access" component={DepartmentManagement} />
      <Route path="/student-data" component={DepartmentManagement} />
      <Route path="/institution-reports" component={InstitutionReports} />
      <Route path="/cross-dept-performance" component={InstitutionReports} />
      <Route path="/system-logs" component={SecurityMonitoring} />
      <Route path="/login-attempts" component={SecurityMonitoring} />
      <Route path="/audit-trail" component={SecurityMonitoring} />
      <Route path="/role-permissions" component={SecurityMonitoring} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
