import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  type Department, type Module, type Assignment, 
  type Notification, type StudentCase, type User 
} from '@shared/schema';

// ======== Department Hooks ========
export function useDepartments() {
  return useQuery({
    queryKey: ['/api/departments'],
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: [`/api/departments/${id}`],
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  return useMutation({
    mutationFn: (department: Partial<Department>) => 
      apiRequest('POST', '/api/departments', department).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
    },
  });
}

export function useUpdateDepartment() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Department> }) => 
      apiRequest('PATCH', `/api/departments/${id}`, data).then(res => res.json()),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      queryClient.invalidateQueries({ queryKey: [`/api/departments/${variables.id}`] });
    },
  });
}

// ======== Module Hooks ========
export function useModules(departmentId?: string) {
  const url = departmentId 
    ? `/api/modules?departmentId=${departmentId}` 
    : '/api/modules';
    
  return useQuery({
    queryKey: [url],
  });
}

export function useModule(id: string) {
  return useQuery({
    queryKey: [`/api/modules/${id}`],
    enabled: !!id,
  });
}

export function useCreateModule() {
  return useMutation({
    mutationFn: (module: Partial<Module>) => 
      apiRequest('POST', '/api/modules', module).then(res => res.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/modules?departmentId=${data.departmentId}`] 
      });
    },
  });
}

export function useUpdateModule() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Module> }) => 
      apiRequest('PATCH', `/api/modules/${id}`, data).then(res => res.json()),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/modules?departmentId=${data.departmentId}`] 
      });
      queryClient.invalidateQueries({ queryKey: [`/api/modules/${variables.id}`] });
    },
  });
}

// ======== Assignment Hooks ========
export function useAssignments(moduleId?: string) {
  const url = moduleId 
    ? `/api/assignments?moduleId=${moduleId}` 
    : '/api/assignments';
    
  return useQuery({
    queryKey: [url],
  });
}

export function useAssignment(id: string) {
  return useQuery({
    queryKey: [`/api/assignments/${id}`],
    enabled: !!id,
  });
}

export function useCreateAssignment() {
  return useMutation({
    mutationFn: (assignment: Partial<Assignment>) => 
      apiRequest('POST', '/api/assignments', assignment).then(res => res.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/assignments?moduleId=${data.moduleId}`] 
      });
    },
  });
}

export function useUpdateAssignment() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Assignment> }) => 
      apiRequest('PATCH', `/api/assignments/${id}`, data).then(res => res.json()),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/assignments?moduleId=${data.moduleId}`] 
      });
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${variables.id}`] });
    },
  });
}

// ======== Notification Hooks ========
export function useNotifications(userId?: string) {
  const url = userId 
    ? `/api/notifications?userId=${userId}` 
    : '/api/notifications';
    
  return useQuery({
    queryKey: [url],
  });
}

export function useCreateNotification() {
  return useMutation({
    mutationFn: (notification: Partial<Notification>) => 
      apiRequest('POST', '/api/notifications', notification).then(res => res.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      if (data.userId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/notifications?userId=${data.userId}`] 
        });
      }
    },
  });
}

export function useMarkNotificationAsRead() {
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest('PATCH', `/api/notifications/${id}/read`, {}).then(res => res.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      if (data.userId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/notifications?userId=${data.userId}`] 
        });
      }
    },
  });
}

// ======== Student Case Hooks ========
export function useStudentCases(departmentId?: string) {
  const url = departmentId 
    ? `/api/student-cases?departmentId=${departmentId}` 
    : '/api/student-cases';
    
  return useQuery({
    queryKey: [url],
  });
}

export function useCreateStudentCase() {
  return useMutation({
    mutationFn: (studentCase: Partial<StudentCase>) => 
      apiRequest('POST', '/api/student-cases', studentCase).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/student-cases'] });
    },
  });
}

export function useUpdateStudentCaseStatus() {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'urgent' | 'pending' | 'resolved' }) => 
      apiRequest('PATCH', `/api/student-cases/${id}/status`, { status }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/student-cases'] });
    },
  });
}

// ======== User Hooks ========
export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['/api/users'],
  });
}

export function useUser(id: string) {
  return useQuery<User>({
    queryKey: [`/api/users/${id}`],
    enabled: !!id,
  });
}

export function useCreateUser() {
  return useMutation<User, Error, Partial<User>>({
    mutationFn: (user: Partial<User>) => 
      apiRequest('POST', '/api/users', user).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
  });
}

export function useUpdateUser() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => 
      apiRequest('PATCH', `/api/users/${id}`, data).then(res => res.json()),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${variables.id}`] });
    },
  });
}