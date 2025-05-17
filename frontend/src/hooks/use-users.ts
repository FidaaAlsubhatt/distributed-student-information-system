import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AdminFormData } from '../lib/api';

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

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (adminData: AdminFormData) => api.createAdmin(adminData),
    onSuccess: () => {
      // Invalidate and refetch admin users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
}

export function useAdmins(type?: string) {
  return useQuery({
    queryKey: ['admins', type],
    queryFn: () => api.getAdmins(type),
  });
}

export function useAdminById(adminId: string) {
  return useQuery({
    queryKey: ['admins', adminId],
    queryFn: () => api.getAdminById(adminId),
    enabled: !!adminId,
  });
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ adminId, data }: { adminId: string, data: Partial<AdminFormData> }) => api.updateAdmin(adminId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      queryClient.invalidateQueries({ queryKey: ['admins', variables.adminId] });
    },
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (adminId: string) => api.deleteAdmin(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
}
