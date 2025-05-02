import React from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface MenuItem {
  name: string;
  icon: string;
  id: string;
  children?: { name: string; id: string }[];
}

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
  const [location, setLocation] = useLocation();
  const { activeRole } = useUser();
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});

  const getMenuItems = (): MenuItem[] => {
    switch (activeRole) {
      case 'student':
        return [
          { name: 'Overview', icon: 'fa-solid fa-gauge-high', id: '/student/dashboard' },
          {
            name: 'Modules',
            icon: 'fa-solid fa-book',
            id: 'modules',
            children: [
              { name: 'View Modules', id: '/modules' },
              { name: 'Request Enrollment', id: '/request-enrollment' },
              { name: 'Request Drop', id: '/request-drop' },
            ],
          },
          {
            name: 'Assignments',
            icon: 'fa-solid fa-tasks',
            id: 'assignments',
            children: [
              { name: 'View Assignments', id: '/assignments' },
              { name: 'Submit Assignment', id: '/submit-assignment' },
              { name: 'View Grades', id: '/grades' },
            ],
          },
          {
            name: 'Timetable',
            icon: 'fa-solid fa-calendar-alt',
            id: 'timetable',
            children: [
              { name: 'Class Timetable', id: '/class-timetable' },
              { name: 'Exam Timetable', id: '/exam-timetable' },
            ],
          },
          {
            name: 'Profile',
            icon: 'fa-solid fa-user',
            id: 'profile',
            children: [
              { name: 'Edit Profile', id: '/profile' },
              { name: 'Upload Documents', id: '/upload-documents' },
              { name: 'Appeal Action', id: '/appeal-action' },
            ],
          },
          {
            name: 'Communication',
            icon: 'fa-solid fa-comments',
            id: 'communication',
            children: [
              { name: 'Notifications', id: '/notifications' },
              { name: 'Direct Messaging', id: '/messages' },
            ],
          },
          { name: 'Reports', icon: 'fa-solid fa-chart-line', id: '/reports' },
        ];
      case 'academic':
        return [
          { name: 'Overview', icon: 'fa-solid fa-gauge-high', id: '/academic/dashboard' },
          {
            name: 'Modules',
            icon: 'fa-solid fa-book',
            id: 'modules',
            children: [
              { name: 'Manage Modules', id: '/manage-modules' },
              { name: 'Edit Module Info', id: '/edit-module' },
            ],
          },
          {
            name: 'Assignments',
            icon: 'fa-solid fa-tasks',
            id: 'assignments',
            children: [
              { name: 'Manage Assignments', id: '/manage-assignments' },
              { name: 'Grade Assignments', id: '/grade-assignments' },
              { name: 'Provide Feedback', id: '/provide-feedback' },
            ],
          },
          {
            name: 'Exams',
            icon: 'fa-solid fa-file-alt',
            id: 'exams',
            children: [
              { name: 'Manage Exams', id: '/manage-exams' },
              { name: 'Schedule Exams', id: '/schedule-exams' },
              { name: 'Update Exam Details', id: '/update-exams' },
            ],
          },
          {
            name: 'Students',
            icon: 'fa-solid fa-user-graduate',
            id: 'students',
            children: [{ name: 'View Student Info', id: '/view-students' }],
          },
          {
            name: 'Communication',
            icon: 'fa-solid fa-comments',
            id: 'communication',
            children: [
              { name: 'Notifications', id: '/notifications' },
              { name: 'Direct Messaging', id: '/messages' },
            ],
          },
          { name: 'Profile', icon: 'fa-solid fa-user', id: '/profile' },
        ];
      case 'department':
        return [
          { name: 'Overview', icon: 'fa-solid fa-gauge-high', id: '/' },
          {
            name: 'User Management',
            icon: 'fa-solid fa-users',
            id: 'user-management',
            children: [
              { name: 'Manage Students', id: '/manage-students' },
              { name: 'Manage Staff', id: '/manage-staff' },
              { name: 'Assign Roles', id: '/assign-roles' },
              { name: 'Manage Dept Admins', id: '/manage-admins' },
            ],
          },
          {
            name: 'Modules',
            icon: 'fa-solid fa-book',
            id: 'modules',
            children: [
              { name: 'Approve Enrollments', id: '/approve-enrollments' },
              { name: 'Manage Modules', id: '/manage-modules' },
            ],
          },
          {
            name: 'Reports',
            icon: 'fa-solid fa-chart-line',
            id: 'reports',
            children: [
              { name: 'Student Reports', id: '/student-reports' },
              { name: 'Dept Performance', id: '/dept-performance' },
            ],
          },
          {
            name: 'Timetable',
            icon: 'fa-solid fa-calendar-alt',
            id: 'timetable',
            children: [
              { name: 'Manage Exams', id: '/manage-exams' },
              { name: 'Manage Classes', id: '/manage-classes' },
            ],
          },
          {
            name: 'Student Cases',
            icon: 'fa-solid fa-gavel',
            id: 'student-cases',
            children: [
              { name: 'Suspension Records', id: '/suspension-records' },
              { name: 'Student Performance', id: '/student-performance' },
            ],
          },
          {
            name: 'Communication',
            icon: 'fa-solid fa-comments',
            id: 'communication',
            children: [
              { name: 'Notifications', id: '/notifications' },
              { name: 'Direct Messaging', id: '/messages' },
            ],
          },
          { name: 'Profile', icon: 'fa-solid fa-user', id: '/profile' },
        ];
      case 'central':
        return [
          { name: 'Overview', icon: 'fa-solid fa-gauge-high', id: '/' },
          {
            name: 'Department Management',
            icon: 'fa-solid fa-building',
            id: 'dept-management',
            children: [
              { name: 'Manage Dept Admins', id: '/manage-dept-admins' },
              { name: 'User Access', id: '/user-access' },
              { name: 'Assign Roles', id: '/assign-roles' },
            ],
          },
          {
            name: 'User Management',
            icon: 'fa-solid fa-users-cog',
            id: 'user-management',
            children: [
              { name: 'Manage Users', id: '/manage-users' },
            ],
          },
          { name: 'Student Data', icon: 'fa-solid fa-user-graduate', id: '/student-data' },
          {
            name: 'Reports',
            icon: 'fa-solid fa-chart-line',
            id: 'reports',
            children: [
              { name: 'Institution Reports', id: '/institution-reports' },
              { name: 'Cross-Dept Performance', id: '/cross-dept-performance' },
            ],
          },
          {
            name: 'Security',
            icon: 'fa-solid fa-shield-alt',
            id: 'security',
            children: [
              { name: 'System Logs', id: '/system-logs' },
              { name: 'Login Attempts', id: '/login-attempts' },
              { name: 'Audit Trail', id: '/audit-trail' },
              { name: 'Role Permissions', id: '/role-permissions' },
            ],
          },
          {
            name: 'Communication',
            icon: 'fa-solid fa-comments',
            id: 'communication',
            children: [
              { name: 'Notifications', id: '/notifications' },
              { name: 'Direct Messaging', id: '/messages' },
            ],
          },
          { name: 'Profile', icon: 'fa-solid fa-user', id: '/profile' },
        ];
      case 'department_admin':
        return [
          { name: 'Overview', icon: 'fa-solid fa-gauge-high', id: '/department/dashboard' },
          {
            name: 'User Management',
            icon: 'fa-solid fa-users',
            id: 'users',
            children: [
              { name: 'Manage Students', id: '/manage-students' },
              { name: 'Manage Staff', id: '/manage-staff' },
              { name: 'Assign Roles', id: '/assign-roles' },
              { name: 'Manage Admins', id: '/manage-admins' },
            ],
          },
          {
            name: 'Module Management',
            icon: 'fa-solid fa-book',
            id: 'modules',
            children: [
              { name: 'Approve Enrollments', id: '/approve-enrollments' },
              { name: 'Classes & Exams', id: '/classes-exams' },
            ],
          },
          {
            name: 'Reports',
            icon: 'fa-solid fa-chart-line',
            id: 'reports',
            children: [
              { name: 'Student Reports', id: '/student-reports' },
              { name: 'Department Performance', id: '/dept-performance' },
            ],
          },
          {
            name: 'Student Cases',
            icon: 'fa-solid fa-user-graduate',
            id: 'cases',
            children: [
              { name: 'Suspension Records', id: '/suspension-records' },
              { name: 'Student Performance', id: '/student-performance' },
            ],
          },
          {
            name: 'Communication',
            icon: 'fa-solid fa-comments',
            id: 'communication',
            children: [
              { name: 'Notifications', id: '/notifications' },
              { name: 'Direct Messaging', id: '/messages' },
            ],
          },
          { name: 'Profile', icon: 'fa-solid fa-user', id: '/profile' },
        ];
      case 'central_admin':
        return [
          { name: 'Overview', icon: 'fa-solid fa-gauge-high', id: '/central/dashboard' },
          {
            name: 'Department Management',
            icon: 'fa-solid fa-building',
            id: 'departments',
            children: [
              { name: 'Manage Dept Admins', id: '/manage-dept-admins' },
              { name: 'User Access Control', id: '/user-access' },
              { name: 'Student Data', id: '/student-data' },
            ],
          },
          {
            name: 'Reports',
            icon: 'fa-solid fa-chart-line',
            id: 'reports',
            children: [
              { name: 'Institution Reports', id: '/institution-reports' },
              { name: 'Cross-Dept Performance', id: '/cross-dept-performance' },
            ],
          },
          {
            name: 'Security',
            icon: 'fa-solid fa-shield-alt',
            id: 'security',
            children: [
              { name: 'System Logs', id: '/system-logs' },
              { name: 'Login Attempts', id: '/login-attempts' },
              { name: 'Audit Trail', id: '/audit-trail' },
              { name: 'Role Permissions', id: '/role-permissions' },
            ],
          },
          {
            name: 'User Management',
            icon: 'fa-solid fa-users-cog',
            id: 'users',
            children: [
              { name: 'Manage Users', id: '/manage-users' },
            ],
          },
          {
            name: 'Communication',
            icon: 'fa-solid fa-comments',
            id: 'communication',
            children: [
              { name: 'Notifications', id: '/notifications' },
              { name: 'Direct Messaging', id: '/messages' },
            ],
          },
          { name: 'Profile', icon: 'fa-solid fa-user', id: '/profile' },
        ];
      default:
        return [];
    }
  };

  const getRoleName = () => {
    switch (activeRole) {
      case 'student':
        return 'Student Portal';
      case 'academic_staff':
        return 'Academic Portal';
      case 'department_admin':
        return 'Department Portal';
      case 'central_admin':
        return 'Admin Portal';
      default:
        return 'Portal';
    }
  };

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const navigate = (path: string) => {
    // Handle special case for overview/dashboard
    if (path === '/') {
      // Redirect to the appropriate dashboard based on role
      if (activeRole === 'student') {
        setLocation('/student/dashboard');
      } else if (activeRole === 'academic_staff' || activeRole === 'academic') {
        setLocation('/academic/dashboard');
      } else if (activeRole === 'department_admin' || activeRole === 'department') {
        setLocation('/department/dashboard');
      } else if (activeRole === 'central_admin' || activeRole === 'central') {
        setLocation('/central/dashboard');
      } else {
        // Fallback
        setLocation('/student/dashboard');
      }
    } else {
      // For all other paths, navigate directly
      console.log(`Navigating to: ${path}`);
      setLocation(path);
    }
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  const renderMenuIcon = (iconClass: string) => {
    return (
      <span className="mr-3 text-white/80 group-hover:text-white">
        <i className={iconClass}></i>
      </span>
    );
  };

  return (
    <aside
      className={cn(
        'bg-[#1d7a85] text-white w-64 flex-shrink-0 fixed inset-y-0 pt-16 z-10 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:pt-0 overflow-y-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="p-4 border-b border-[#1a6a75]">
        <h2 className="text-xl font-semibold">{getRoleName()}</h2>
      </div>

      <nav className="mt-2">
        {getMenuItems().map((item, index) => (
          <div key={index}>
            <button
              onClick={() => item.children ? toggleMenu(item.id) : navigate(item.id)}
              className={cn(
                'flex items-center px-5 py-2.5 w-full text-left text-white/90 hover:bg-[#1a6a75] hover:text-white group transition-colors',
                (location === item.id || location.includes(item.id)) && !item.children && 'bg-[#1a6a75] text-white font-medium'
              )}
            >
              {renderMenuIcon(item.icon)}
              <span className="text-sm">{item.name}</span>
              {item.children && (
                <span className="ml-auto text-xs opacity-70">
                  {openMenus[item.id] ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              )}
            </button>

            {item.children && openMenus[item.id] && (
              <div className="bg-[#19636d]">
                {item.children.map((child, childIndex) => (
                  <button
                    key={childIndex}
                    onClick={() => navigate(child.id)}
                    className={cn(
                      'block w-full text-left pl-12 pr-4 py-2 text-xs text-white/80 hover:bg-[#185761] hover:text-white transition-colors',
                      location === child.id && 'bg-[#185761] text-white font-medium'
                    )}
                  >
                    <span>{child.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
