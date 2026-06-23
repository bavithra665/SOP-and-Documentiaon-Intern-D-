import api from './api';

export interface SOP {
  id: number;
  title: string;
  purpose: string;
  scope: string;
  procedure_steps: string[];
  procedure_steps_count: number;
  department: number | null;
  department_name: string | null;
  status: 'draft' | 'under_review' | 'approved' | 'published' | 'rejected';
  version: number;
  created_by: number;
  created_by_name: string | null;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_comments: string;
  approved_by: number | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejection_reason: string;
  published_at: string | null;
  effective_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SOPFormData {
  title: string;
  purpose: string;
  scope: string;
  procedure_steps: string[];
  department: number | null;
}

export interface SOPCompliance {
  id: number;
  user: number;
  user_name: string;
  sop: number;
  sop_title: string;
  sop_department_name: string | null;
  read_at: string | null;
  acknowledged_at: string | null;
  acknowledged: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComplianceAnalytics {
  total_sops: number;
  read_sops: number;
  acknowledged_sops: number;
  pending_sops: number;
  compliance_percentage: number;
  read_percentage: number;
  department_compliance: Array<{
    department: string;
    total_sops: number;
    acknowledged_sops: number;
    compliance_percentage: number;
  }>;
}

export interface Quiz {
  id: number;
  sop: number;
  sop_title: string;
  sop_department_name: string | null;
  title: string;
  questions: Array<{
    question: string;
    options: string[];
    correct_answer: number;
  }>;
  question_count: number;
  created_by: number;
  created_by_name: string | null;
  created_at: string;
  is_active: boolean;
}

export interface QuizResult {
  id: number;
  quiz: number;
  quiz_title: string;
  sop_title: string;
  user: number;
  user_name: string;
  score: number;
  total_questions: number;
  percentage: number;
  answers: number[];
  completed_at: string;
}

export interface QuizAnalytics {
  total_quizzes: number;
  total_attempts: number;
  average_score: number;
  average_percentage: number;
  pass_rate: number;
  department_performance: Array<{
    department: string;
    total_attempts: number;
    average_percentage: number;
  }>;
  recent_results: Array<{
    user: string;
    quiz: string;
    score: number;
    percentage: number;
    completed_at: string;
  }>;
}

export const sopService = {
  getSOPs: async (params?: { status?: string; department?: string; search?: string }): Promise<SOP[]> => {
    const response = await api.get<SOP[]>('/sops/sops/', { params });
    return response.data;
  },

  getSOP: async (id: number): Promise<SOP> => {
    const response = await api.get<SOP>(`/sops/sops/${id}/`);
    return response.data;
  },

  createSOP: async (data: SOPFormData): Promise<SOP> => {
    const response = await api.post<SOP>('/sops/sops/', data);
    return response.data;
  },

  updateSOP: async (id: number, data: Partial<SOPFormData>): Promise<SOP> => {
    const response = await api.put<SOP>(`/sops/sops/${id}/`, data);
    return response.data;
  },

  deleteSOP: async (id: number): Promise<void> => {
    await api.delete(`/sops/sops/${id}/`);
  },

  submitForReview: async (id: number): Promise<SOP> => {
    const response = await api.post<SOP>(`/sops/sops/${id}/submit_for_review/`);
    return response.data;
  },

  reviewSOP: async (id: number, approved: boolean, comments?: string): Promise<SOP> => {
    const response = await api.post<SOP>(`/sops/sops/${id}/review/`, {
      approved,
      comments: comments || '',
    });
    return response.data;
  },

  approveSOP: async (id: number, effectiveDate?: string): Promise<SOP> => {
    const response = await api.post<SOP>(`/sops/sops/${id}/approve/`, {
      effective_date: effectiveDate || null,
    });
    return response.data;
  },

  publishSOP: async (id: number, effectiveDate?: string): Promise<SOP> => {
    const response = await api.post<SOP>(`/sops/sops/${id}/publish/`, {
      effective_date: effectiveDate || null,
    });
    return response.data;
  },

  rejectSOP: async (id: number, rejectionReason: string): Promise<SOP> => {
    const response = await api.post<SOP>(`/sops/sops/${id}/reject/`, {
      rejection_reason: rejectionReason,
    });
    return response.data;
  },

  readSOP: async (id: number): Promise<SOPCompliance> => {
    const response = await api.post<SOPCompliance>(`/sops/sops/${id}/read/`);
    return response.data;
  },

  acknowledgeSOP: async (id: number): Promise<SOPCompliance> => {
    const response = await api.post<SOPCompliance>(`/sops/sops/${id}/acknowledge/`);
    return response.data;
  },

  getMyCompliance: async (): Promise<SOPCompliance[]> => {
    const response = await api.get<SOPCompliance[]>('/sops/sops/my_compliance/');
    return response.data;
  },

  getAnalytics: async (): Promise<ComplianceAnalytics> => {
    const response = await api.get<ComplianceAnalytics>('/sops/sops/analytics/');
    return response.data;
  },

  getMySOPs: async (): Promise<SOP[]> => {
    const response = await api.get<SOP[]>('/sops/sops/my_sops/');
    return response.data;
  },

  getPendingReview: async (): Promise<SOP[]> => {
    const response = await api.get<SOP[]>('/sops/sops/pending_review/');
    return response.data;
  },

  getPendingApproval: async (): Promise<SOP[]> => {
    const response = await api.get<SOP[]>('/sops/sops/pending_approval/');
    return response.data;
  },

  getPublished: async (): Promise<SOP[]> => {
    const response = await api.get<SOP[]>('/sops/sops/published/');
    return response.data;
  },

  getQuizzes: async (params?: { sop?: string; is_active?: string }): Promise<Quiz[]> => {
    const response = await api.get<Quiz[]>('/sops/quizzes/', { params });
    return response.data;
  },

  getQuiz: async (id: number): Promise<Quiz> => {
    const response = await api.get<Quiz>(`/sops/quizzes/${id}/`);
    return response.data;
  },

  createQuiz: async (sopId: number, numQuestions: number = 5): Promise<Quiz> => {
    const response = await api.post<Quiz>('/sops/quizzes/', {
      sop_id: sopId,
      num_questions: numQuestions,
    });
    return response.data;
  },

  submitQuiz: async (quizId: number, answers: number[]): Promise<QuizResult> => {
    const response = await api.post<QuizResult>(`/sops/quizzes/${quizId}/submit/`, {
      answers,
    });
    return response.data;
  },

  getMyQuizResults: async (): Promise<QuizResult[]> => {
    const response = await api.get<QuizResult[]>('/sops/quizzes/my_results/');
    return response.data;
  },

  getQuizAnalytics: async (): Promise<QuizAnalytics> => {
    const response = await api.get<QuizAnalytics>('/sops/quizzes/analytics/');
    return response.data;
  },
};
