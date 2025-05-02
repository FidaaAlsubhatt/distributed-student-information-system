import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/contexts/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'academic_staff' | 'department_admin' | 'central_admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, activeRole } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    console.log('ProtectedRoute check - isAuthenticated:', isAuthenticated, 'activeRole:', activeRole);
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      setLocation('/');
      return;
    }

    // If a specific role is required, check if user has it
    // This is commented out to allow users to access dashboards of any role
    /*
    if (requiredRole && activeRole !== requiredRole) {
      console.log(`Role mismatch: required ${requiredRole}, active ${activeRole}`);
      // Redirect to the dashboard for their current role
      setLocation(`/${activeRole}/dashboard`);
    }
    */
  }, [isAuthenticated, activeRole, requiredRole, setLocation]);

  // If authenticated and has required role (or no specific role required), render children
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;