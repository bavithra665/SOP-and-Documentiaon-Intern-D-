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
};
