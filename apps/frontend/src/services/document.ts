import api from './api';

export interface Document {
  id: number;
  title: string;
  description: string;
  category: number | null;
  category_name: string | null;
  department: number | null;
  department_name: string | null;
  document_file: string;
  file_name: string;
  file_size: number;
  file_size_display: string;
  file_type: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  created_by: number;
  created_by_name: string | null;
  approved_by: number | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentCategory {
  id: number;
  name: string;
  description: string;
  document_count: number;
  created_at: string;
}

export interface DocumentFormData {
  title: string;
  description: string;
  category: number | null;
  department: number | null;
  document_file: File;
}

export const documentService = {
  getDocuments: async (params?: { status?: string; category?: string; department?: string; search?: string }): Promise<Document[]> => {
    const response = await api.get<Document[]>('/documents/documents/', { params });
    return response.data;
  },

  getDocument: async (id: number): Promise<Document> => {
    const response = await api.get<Document>(`/documents/documents/${id}/`);
    return response.data;
  },

  createDocument: async (formData: FormData): Promise<Document> => {
    const response = await api.post<Document>('/documents/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateDocument: async (id: number, data: Partial<DocumentFormData>): Promise<Document> => {
    const response = await api.put<Document>(`/documents/documents/${id}/`, data);
    return response.data;
  },

  deleteDocument: async (id: number): Promise<void> => {
    await api.delete(`/documents/documents/${id}/`);
  },

  downloadDocument: async (id: number): Promise<Blob> => {
    const response = await api.get(`/documents/documents/${id}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  submitForApproval: async (id: number): Promise<Document> => {
    const response = await api.post<Document>(`/documents/documents/${id}/submit_for_approval/`);
    return response.data;
  },

  approveDocument: async (id: number, status: 'approved' | 'rejected', rejectionReason?: string): Promise<Document> => {
    const response = await api.post<Document>(`/documents/documents/${id}/approve/`, {
      status,
      rejection_reason: rejectionReason || '',
    });
    return response.data;
  },

  getMyDocuments: async (): Promise<Document[]> => {
    const response = await api.get<Document[]>('/documents/documents/my_documents/');
    return response.data;
  },

  getPendingApproval: async (): Promise<Document[]> => {
    const response = await api.get<Document[]>('/documents/documents/pending_approval/');
    return response.data;
  },

  getCategories: async (): Promise<DocumentCategory[]> => {
    const response = await api.get<DocumentCategory[]>('/documents/categories/');
    return response.data;
  },

  createCategory: async (data: { name: string; description: string }): Promise<DocumentCategory> => {
    const response = await api.post<DocumentCategory>('/documents/categories/', data);
    return response.data;
  },

  updateCategory: async (id: number, data: { name: string; description: string }): Promise<DocumentCategory> => {
    const response = await api.put<DocumentCategory>(`/documents/categories/${id}/`, data);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/documents/categories/${id}/`);
  },
};
