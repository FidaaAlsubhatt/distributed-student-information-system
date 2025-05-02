import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { api, UserRole, DepartmentRole, UserData } from '../lib/api';
import { useLocation } from 'wouter';

interface User {
  id: string;
  username: string;
  email: string;
  roles: {
    id: number;
    name: string;
    scope: string;
  }[];
  departmentRoles: DepartmentRole[];
}

interface UserContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  availableRoles: string[];
  activeRole: string | null;
  availableDepartments: DepartmentRole[];
  activeDepartment: DepartmentRole | null;
  login: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  setActiveRole: (role: string) => void;
  setActiveDepartment: (department: DepartmentRole) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [activeDepartment, setActiveDepartment] = useState<DepartmentRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<DepartmentRole[]>([]);

  useEffect(() => {
    // Check for existing auth data in localStorage
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        const authData: UserData = JSON.parse(storedAuth);
        
        // Set current user
        setCurrentUser({
          id: authData.userId,
          username: authData.username,
          email: authData.email,
          roles: authData.roles,
          departmentRoles: authData.departmentRoles
        });
        
        // Set available roles
        const roleNames = authData.roles.map(role => role.name);
        setAvailableRoles(roleNames);
        
        // Set available departments
        setAvailableDepartments(authData.departmentRoles);
        
        // Set active role (default to first role)
        if (roleNames.length > 0 && !activeRole) {
          setActiveRole(roleNames[0]);
        }
        
        // Set active department (default to first department)
        if (authData.departmentRoles.length > 0 && !activeDepartment) {
          setActiveDepartment(authData.departmentRoles[0]);
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored auth data:', error);
        localStorage.removeItem('auth');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<string> => {
    try {
      const authData = await api.login(email, password);
      localStorage.setItem('auth', JSON.stringify(authData));
      
      // Set current user
      setCurrentUser({
        id: authData.userId,
        username: authData.username,
        email: authData.email,
        roles: authData.roles,
        departmentRoles: authData.departmentRoles
      });
      
      // Set available roles
      const roleNames = authData.roles.map(role => role.name);
      setAvailableRoles(roleNames);
      
      // Set available departments
      setAvailableDepartments(authData.departmentRoles);
      
      // Set active role (default to first role)
      let firstRole = '';
      if (roleNames.length > 0) {
        firstRole = roleNames[0];
        setActiveRole(firstRole);
      }
      
      // Set active department (default to first department)
      if (authData.departmentRoles.length > 0) {
        setActiveDepartment(authData.departmentRoles[0]);
      }
      
      // Ensure state is updated before continuing
      setIsAuthenticated(true);
      
      // Wait for state updates to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`Login successful. Welcome back, ${authData.username}! Role: ${firstRole}`);
      
      // Return the first role for redirection purposes
      return firstRole;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.logout();
      localStorage.removeItem('auth');
      setCurrentUser(null);
      setIsAuthenticated(false);
      setActiveRole(null);
      setActiveDepartment(null);
      setAvailableRoles([]);
      setAvailableDepartments([]);
      console.log('Logged out successfully');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        activeRole,
        activeDepartment,
        isAuthenticated,
        login,
        logout,
        setActiveRole,
        setActiveDepartment,
        availableRoles,
        availableDepartments
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
