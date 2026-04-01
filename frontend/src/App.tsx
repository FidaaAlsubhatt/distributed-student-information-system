import type { ComponentType } from "react";
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
import ViewModules from "@/pages/academic/ViewModules";
import ManageAssignments from "@/pages/academic/ManageAssignments";
import GradeAssignments from "@/pages/academic/GradeAssignments";
import ViewStudents from "@/pages/academic/ViewStudents";

// Department Admin Pages
import DepartmentDashboard from "@/pages/department/Dashboard";
import ManageStaff from "@/pages/department/ManageStaff";
import ManageStudents from "@/pages/department/ManageStudents";
import ManagePrograms from "@/pages/department/ManagePrograms";
import ManageModules from "@/pages/department/ManageModules";
import ManageEnrollments from "@/pages/department/ManageEnrollments";
import DepartmentReports from "@/pages/department/Reports";
import StudentCases from "@/pages/department/StudentCases";
import DepartmentExams from "@/pages/department/ManageExams";
import DepartmentClasses from "@/pages/department/ManageClasses";

// Central Admin Pages
import CentralDashboard from "@/pages/central/Dashboard";
import DepartmentManagement from "@/pages/central/DepartmentManagement";
import InstitutionReports from "@/pages/central/InstitutionReports";
import SecurityMonitoring from "@/pages/central/SecurityMonitoring";

type AppRole = "student" | "academic_staff" | "department_admin" | "central_admin";

interface ProtectedPageRouteProps {
  path: string;
  role: AppRole;
  component: ComponentType;
}

function ProtectedPageRoute({ path, role, component: Component }: ProtectedPageRouteProps) {
  return (
    <Route path={path}>
      <ProtectedRoute requiredRole={role}>
        <Component />
      </ProtectedRoute>
    </Route>
  );
}

function Router() {
  return (
    <Switch>
      {/* Default/Home route */}
      <Route path="/" component={SignIn} />
      
      {/* Role-specific dashboard routes */}
      <ProtectedPageRoute path="/student/dashboard" role="student" component={StudentDashboard} />
      <ProtectedPageRoute path="/academic/dashboard" role="academic_staff" component={AcademicDashboard} />
      <ProtectedPageRoute path="/department/dashboard" role="department_admin" component={DepartmentDashboard} />
      <ProtectedPageRoute path="/central/dashboard" role="central_admin" component={CentralDashboard} />
      
      {/* Student routes */}
      <ProtectedPageRoute path="/modules" role="student" component={Modules} />
      <ProtectedPageRoute path="/request-enrollment" role="student" component={RequestEnrollment} />
      <ProtectedPageRoute path="/request-drop" role="student" component={RequestDrop} />
      <ProtectedPageRoute path="/assignments" role="student" component={ViewAssignments} />
      <ProtectedPageRoute path="/submit-assignment" role="student" component={SubmitAssignment} />
      <ProtectedPageRoute path="/grades" role="student" component={ViewGrades} />
      <ProtectedPageRoute path="/class-timetable" role="student" component={Timetable} />
      <ProtectedPageRoute path="/exam-timetable" role="student" component={Timetable} />
      <ProtectedPageRoute path="/profile" role="student" component={Profile} />
      <ProtectedPageRoute path="/notifications" role="student" component={Notifications} />
      <ProtectedPageRoute path="/messages" role="student" component={Messages} />
      
      {/* Academic Staff routes */}
      <ProtectedPageRoute path="/view-modules" role="academic_staff" component={ViewModules} />
      <ProtectedPageRoute path="/edit-module" role="academic_staff" component={ViewModules} />
      <ProtectedPageRoute path="/manage-assignments" role="academic_staff" component={ManageAssignments} />
      <ProtectedPageRoute path="/grade-assignments" role="academic_staff" component={GradeAssignments} />
      <ProtectedPageRoute path="/provide-feedback" role="academic_staff" component={GradeAssignments} />
      <ProtectedPageRoute path="/view-students" role="academic_staff" component={ViewStudents} />
      
      {/* Department Admin routes */}
      <ProtectedPageRoute path="/manage-students" role="department_admin" component={ManageStudents} />
      <ProtectedPageRoute path="/manage-staff" role="department_admin" component={ManageStaff} />
      <ProtectedPageRoute path="/manage-programs" role="department_admin" component={ManagePrograms} />
      <ProtectedPageRoute path="/manage-enrollments" role="department_admin" component={ManageEnrollments} />
      <ProtectedPageRoute path="/manage-modules" role="department_admin" component={ManageModules} />
      <ProtectedPageRoute path="/student-reports" role="department_admin" component={DepartmentReports} />
      <ProtectedPageRoute path="/dept-performance" role="department_admin" component={DepartmentReports} />
      <ProtectedPageRoute path="/suspension-records" role="department_admin" component={StudentCases} />
      <ProtectedPageRoute path="/student-performance" role="department_admin" component={StudentCases} />
      <ProtectedPageRoute path="/exams" role="department_admin" component={DepartmentExams} />
      <ProtectedPageRoute path="/classes" role="department_admin" component={DepartmentClasses} />
      
      {/* Central Admin routes */}
      <ProtectedPageRoute path="/manage-dept-admins" role="central_admin" component={DepartmentManagement} />
      <ProtectedPageRoute path="/user-access" role="central_admin" component={DepartmentManagement} />
      <ProtectedPageRoute path="/student-data" role="central_admin" component={DepartmentManagement} />
      <ProtectedPageRoute path="/institution-reports" role="central_admin" component={InstitutionReports} />
      <ProtectedPageRoute path="/cross-dept-performance" role="central_admin" component={InstitutionReports} />
      <ProtectedPageRoute path="/system-logs" role="central_admin" component={SecurityMonitoring} />
      <ProtectedPageRoute path="/login-attempts" role="central_admin" component={SecurityMonitoring} />
      <ProtectedPageRoute path="/audit-trail" role="central_admin" component={SecurityMonitoring} />
      <ProtectedPageRoute path="/role-permissions" role="central_admin" component={SecurityMonitoring} />
      
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
