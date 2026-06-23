import api from './api';

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  department: number | null;
  department_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserFormData {
  username: string;
  email: string;
  password?: string;
  confirm_password?: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'employee';
  department: number | null;
}

export const userManagementService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/management/users/');
    return response.data;
  },

  getUser: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/management/users/${id}/`);
    return response.data;
  },

  createUser: async (data: UserFormData): Promise<User> => {
    const response = await api.post<User>('/management/users/', data);
    return response.data;
  },

  updateUser: async (id: number, data: Partial<UserFormData>): Promise<User> => {
    const response = await api.put<User>(`/management/users/${id}/`, data);
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/management/users/${id}/`);
  },

  resetUserPassword: async (id: number, password: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/management/users/${id}/reset_password/`, {
      password,
      confirm_password: password,
    });
    return response.data;
  },

  deactivateUser: async (id: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/management/users/${id}/deactivate/`);
    return response.data;
  },

  activateUser: async (id: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/management/users/${id}/activate/`);
    return response.data;
  },
};
