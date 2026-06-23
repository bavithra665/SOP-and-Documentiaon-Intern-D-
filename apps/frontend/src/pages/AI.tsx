import { useState, useEffect } from 'react';
import { aiService, SOPGenerationResult, DocumentSummaryResult, SOPSimplificationResult, SmartSearchResult } from '../services/ai';
import { documentService, Document } from '../services/document';
import { sopService, SOP } from '../services/sop';
import { Button, Card, CardHeader, CardBody, Input, Select, useToast } from '../components/ui';

export const AI: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sop-generator' | 'document-summary' | 'sop-simplifier' | 'document-chat' | 'smart-search'>('sop-generator');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // SOP Generator State
  const [processName, setProcessName] = useState('');
  const [sopResult, setSopResult] = useState<SOPGenerationResult | null>(null);

  // Document Summary State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [summaryResult, setSummaryResult] = useState<DocumentSummaryResult | null>(null);

  // SOP Simplifier State
  const [sops, setSOPs] = useState<SOP[]>([]);
  const [selectedSOPId, setSelectedSOPId] = useState<number | null>(null);
  const [simplifiedResult, setSimplifiedResult] = useState<SOPSimplificationResult | null>(null);

  // Document Chat State
  const [chatDocumentId, setChatDocumentId] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ question: string; answer: string }>>([]);

  // Smart Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SmartSearchResult | null>(null);

  const handleGenerateSOP = async () => {
    if (!processName.trim()) {
      showToast('Please enter a process name', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await aiService.generateSOP(processName);
      setSopResult(result);
      showToast('SOP generated successfully', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to generate SOP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizeDocument = async () => {
    if (!selectedDocumentId) {
      showToast('Please select a document', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await aiService.summarizeDocument(selectedDocumentId);
      setSummaryResult(result);
      showToast('Document summarized successfully', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to summarize document', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSimplifySOP = async () => {
    if (!selectedSOPId) {
      showToast('Please select an SOP', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await aiService.simplifySOP(selectedSOPId);
      setSimplifiedResult(result);
      showToast('SOP simplified successfully', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to simplify SOP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatDocumentId || !question.trim()) {
      showToast('Please select a document and enter a question', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await aiService.chatWithDocument(chatDocumentId, question);
      setChatHistory([...chatHistory, { question, answer: result.answer }]);
      setQuestion('');
      showToast('Answer received', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to get answer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) {
      showToast('Please enter a search query', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await aiService.smartSearch(searchQuery);
      setSearchResult(result);
      showToast('Search completed', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to perform search', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await documentService.getDocuments();
      setDocuments(docs);
    } catch (error) {
      showToast('Failed to load documents', 'error');
    }
  };

  const loadSOPs = async () => {
    try {
      const sopsData = await sopService.getSOPs();
      setSOPs(sopsData);
    } catch (error) {
      showToast('Failed to load SOPs', 'error');
    }
  };

  useEffect(() => {
    loadDocuments();
    loadSOPs();
  }, []);

  const tabs = [
    { id: 'sop-generator', label: 'SOP Generator' },
    { id: 'document-summary', label: 'Document Summary' },
    { id: 'sop-simplifier', label: 'SOP Simplifier' },
    { id: 'document-chat', label: 'Document Chat' },
    { id: 'smart-search', label: 'Smart Search' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">AI Features</h1>
          <p className="text-sm text-gray-600">Powered by Groq AI</p>
        </CardHeader>
        <CardBody>
          <div className="flex space-x-2 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-b-2 border-ocean-600 text-ocean-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {activeTab === 'sop-generator' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">AI SOP Generator</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Process Name"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              placeholder="e.g., Employee Onboarding Process"
            />
            <Button variant="primary" onClick={handleGenerateSOP} loading={loading}>
              Generate SOP
            </Button>
            {sopResult && (
              <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Purpose</h3>
                  <p className="text-sm text-gray-700">{sopResult.purpose}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Scope</h3>
                  <p className="text-sm text-gray-700">{sopResult.scope}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Responsibilities</h3>
                  <p className="text-sm text-gray-700">{sopResult.responsibilities}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Procedure Steps</h3>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                    {sopResult.procedure_steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'document-summary' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">AI Document Summary</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Select
              label="Select Document"
              value={selectedDocumentId?.toString() || ''}
              onChange={(e) => setSelectedDocumentId(e.target.value ? parseInt(e.target.value) : null)}
              options={[{ value: '', label: 'Select a document' }, ...documents.map(d => ({ value: d.id.toString(), label: d.title }))]}
            />
            <Button variant="primary" onClick={handleSummarizeDocument} loading={loading}>
              Summarize Document
            </Button>
            {summaryResult && (
              <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Summary</h3>
                  <p className="text-sm text-gray-700">{summaryResult.summary}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Key Points</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {summaryResult.key_points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Important Actions</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {summaryResult.important_actions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'sop-simplifier' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">AI SOP Simplifier</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Select
              label="Select SOP"
              value={selectedSOPId?.toString() || ''}
              onChange={(e) => setSelectedSOPId(e.target.value ? parseInt(e.target.value) : null)}
              options={[{ value: '', label: 'Select an SOP' }, ...sops.map(s => ({ value: s.id.toString(), label: s.title }))]}
            />
            <Button variant="primary" onClick={handleSimplifySOP} loading={loading}>
              Simplify SOP
            </Button>
            {simplifiedResult && (
              <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Simplified Purpose</h3>
                  <p className="text-sm text-gray-700">{simplifiedResult.simplified_purpose}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Simplified Scope</h3>
                  <p className="text-sm text-gray-700">{simplifiedResult.simplified_scope}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Simplified Steps</h3>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                    {simplifiedResult.simplified_steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'document-chat' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">AI Document Chat</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Select
              label="Select Document"
              value={chatDocumentId?.toString() || ''}
              onChange={(e) => setChatDocumentId(e.target.value ? parseInt(e.target.value) : null)}
              options={[{ value: '', label: 'Select a document' }, ...documents.map(d => ({ value: d.id.toString(), label: d.title }))]}
            />
            <div className="space-y-2">
              <Input
                label="Your Question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about the document..."
                onKeyPress={(e) => e.key === 'Enter' && handleChat()}
              />
              <Button variant="primary" onClick={handleChat} loading={loading}>
                Ask
              </Button>
            </div>
            {chatHistory.length > 0 && (
              <div className="mt-6 space-y-4 max-h-96 overflow-y-auto">
                {chatHistory.map((chat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="bg-ocean-50 p-3 rounded-lg">
                      <p className="font-semibold text-sm text-ocean-900">You:</p>
                      <p className="text-sm text-ocean-700">{chat.question}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-semibold text-sm text-gray-900">AI:</p>
                      <p className="text-sm text-gray-700">{chat.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'smart-search' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Smart Search</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Search Query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., How do I handle employee onboarding?"
            />
            <Button variant="primary" onClick={handleSmartSearch} loading={loading}>
              Search
            </Button>
            {searchResult && (
              <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Understanding</h3>
                  <p className="text-sm text-gray-700">{searchResult.understanding}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Relevant Results</h3>
                  <ul className="space-y-2">
                    {searchResult.relevant_results.map((result, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        <span className="font-medium">{result.title}</span>
                        <span className="text-gray-500"> (Relevance: {Math.round(result.relevance_score * 100)}%)</span>
                        <p className="text-gray-600">{result.reason}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Suggested Queries</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {searchResult.suggested_queries.map((query, index) => (
                      <li key={index}>{query}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
};
