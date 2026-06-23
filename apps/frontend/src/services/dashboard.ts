import api from './api';

export interface AdminDashboardData {
  total_users: number;
  total_departments: number;
  total_documents: number;
  total_sops: number;
  pending_approvals: number;
  compliance_rate: number;
  user_growth: Array<{ month: string; count: number }>;
  document_growth: Array<{ month: string; count: number }>;
  sop_growth: Array<{ month: string; count: number }>;
  department_compliance: Array<{ department: string; compliance_rate: number; total_sops: number }>;
}

export interface ManagerDashboardData {
  department_name: string;
  total_employees: number;
  department_sops: number;
  employee_compliance_rate: number;
  quiz_average_score: number;
  quiz_pass_rate: number;
  pending_reviews: number;
  compliance_trend: Array<{ month: string; count: number }>;
  quiz_performance: Array<{ employee: string; average_score: number; quizzes_taken: number }>;
  top_performers: Array<{ employee: string; average_score: number; quizzes_taken: number }>;
}

export interface EmployeeDashboardData {
  assigned_sops: number;
  pending_sops: number;
  completed_sops: number;
  quiz_average_score: number;
  quiz_total_taken: number;
  quiz_pass_rate: number;
  recent_documents: Array<{
    id: number;
    title: string;
    file_type: string;
    uploaded_by: string;
    uploaded_at: string;
    department: string;
  }>;
  upcoming_quizzes: Array<{
    id: number;
    title: string;
    sop_title: string;
    question_count: number;
  }>;
  compliance_progress: Array<{ month: string; count: number }>;
}

export const dashboardService = {
  getAdminDashboard: async (): Promise<AdminDashboardData> => {
    const response = await api.get<AdminDashboardData>('/api/admin/');
    return response.data;
  },

  getManagerDashboard: async (): Promise<ManagerDashboardData> => {
    const response = await api.get<ManagerDashboardData>('/api/manager/');
    return response.data;
  },

  getEmployeeDashboard: async (): Promise<EmployeeDashboardData> => {
    const response = await api.get<EmployeeDashboardData>('/api/employee/');
    return response.data;
  },
};
