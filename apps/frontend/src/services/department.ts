import api from './api';

export interface Department {
  id: number;
  name: string;
  description: string;
  user_count: number;
  created_at: string;
  updated_at: string;
}

export interface DepartmentFormData {
  name: string;
  description: string;
}

export const departmentService = {
  getDepartments: async (): Promise<Department[]> => {
    const response = await api.get<Department[]>('/management/departments/');
    return response.data;
  },

  getDepartment: async (id: number): Promise<Department> => {
    const response = await api.get<Department>(`/management/departments/${id}/`);
    return response.data;
  },

  createDepartment: async (data: DepartmentFormData): Promise<Department> => {
    const response = await api.post<Department>('/management/departments/', data);
    return response.data;
  },

  updateDepartment: async (id: number, data: Partial<DepartmentFormData>): Promise<Department> => {
    const response = await api.put<Department>(`/management/departments/${id}/`, data);
    return response.data;
  },

  deleteDepartment: async (id: number): Promise<void> => {
    await api.delete(`/management/departments/${id}/`);
  },

  getDepartmentUsers: async (id: number): Promise<any[]> => {
    const response = await api.get(`/management/departments/${id}/users/`);
    return response.data;
  },
};
