import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/contexts/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'academic_staff' | 'department_admin' | 'central_admin';
}

const DASHBOARD_PATHS = {
  student: '/student/dashboard',
  academic_staff: '/academic/dashboard',
  department_admin: '/department/dashboard',
  central_admin: '/central/dashboard',
} as const;

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { authReady, isAuthenticated, activeRole } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!isAuthenticated) {
      setLocation('/');
      return;
    }

    if (requiredRole && activeRole !== requiredRole) {
      if (activeRole && activeRole in DASHBOARD_PATHS) {
        setLocation(DASHBOARD_PATHS[activeRole as keyof typeof DASHBOARD_PATHS]);
      } else {
        setLocation('/');
      }
    }
  }, [authReady, isAuthenticated, activeRole, requiredRole, setLocation]);

  if (!authReady || !isAuthenticated) {
    return null;
  }

  if (requiredRole && activeRole !== requiredRole) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
