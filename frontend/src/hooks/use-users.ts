import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  roleScope: string;
  status: string;
  createdAt: string;
  departmentId?: string;
}

export interface Department {
  dept_id: string;
  name: string;
  host: string;
  port: number;
  dbname: string;
  schema_prefix: string;
  status: string;
  contact_email: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  departmentId?: string;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: api.getUsers,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: api.getDepartments,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: CreateUserData) => api.createUser(userData),
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
