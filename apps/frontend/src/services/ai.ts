import api from './api';

export interface SOPGenerationResult {
  purpose: string;
  scope: string;
  responsibilities: string;
  procedure_steps: string[];
}

export interface DocumentSummaryResult {
  summary: string;
  key_points: string[];
  important_actions: string[];
}

export interface SOPSimplificationResult {
  simplified_purpose: string;
  simplified_scope: string;
  simplified_steps: string[];
}

export interface SmartSearchResult {
  understanding: string;
  relevant_results: Array<{
    type: string;
    title: string;
    relevance_score: number;
    reason: string;
  }>;
  suggested_queries: string[];
}

export const aiService = {
  generateSOP: async (processName: string): Promise<SOPGenerationResult> => {
    const response = await api.post<{ result: SOPGenerationResult }>('/ai/ai/generate_sop/', {
      process_name: processName,
    });
    return response.data.result;
  },

  summarizeDocument: async (documentId: number): Promise<DocumentSummaryResult> => {
    const response = await api.post<{ result: DocumentSummaryResult }>('/ai/ai/summarize_document/', {
      document_id: documentId,
    });
    return response.data.result;
  },

  simplifySOP: async (sopId: number): Promise<SOPSimplificationResult> => {
    const response = await api.post<{ result: SOPSimplificationResult }>('/ai/ai/simplify_sop/', {
      sop_id: sopId,
    });
    return response.data.result;
  },

  chatWithDocument: async (documentId: number, question: string): Promise<{ answer: string }> => {
    const response = await api.post<{ answer: string }>('/ai/ai/document_chat/', {
      document_id: documentId,
      question,
    });
    return response.data;
  },

  smartSearch: async (query: string): Promise<SmartSearchResult> => {
    const response = await api.post<{ result: SmartSearchResult }>('/ai/ai/smart_search/', {
      query,
    });
    return response.data.result;
  },
};
