import { useState, useEffect } from 'react';
import { documentService, Document, DocumentCategory } from '../services/document';
import { departmentService, Department } from '../services/department';
import { Button, Card, CardHeader, CardBody, Table, Modal, Input, Textarea, Select, EmptyState, useToast } from '../components/ui';

export const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploadFormData, setUploadFormData] = useState<FormData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ status: '', category: '', department: '', search: '' });
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsData, categoriesData, departmentsData] = await Promise.all([
        documentService.getDocuments(filters),
        documentService.getCategories(),
        departmentService.getDepartments(),
      ]);
      setDocuments(docsData);
      setCategories(categoriesData);
      setDepartments(departmentsData);
    } catch (error) {
      showToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = () => {
    setUploadFormData(new FormData());
    setFile(null);
    setErrors({});
    setUploadModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setErrors({ document_file: 'Only PDF, DOCX, PPTX, and XLSX files are allowed' });
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        setErrors({ document_file: 'File size cannot exceed 10MB' });
        return;
      }
      
      setFile(selectedFile);
      const formData = new FormData();
      formData.append('document_file', selectedFile);
      setUploadFormData(formData);
      setErrors({});
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFormData || !file) {
      setErrors({ document_file: 'Please select a file' });
      return;
    }

    const title = (e.target as any).title.value;
    const description = (e.target as any).description.value;
    const category = (e.target as any).category.value;
    const department = (e.target as any).department.value;

    if (!title) {
      setErrors({ title: 'Title is required' });
      return;
    }

    uploadFormData.append('title', title);
    uploadFormData.append('description', description);
    uploadFormData.append('category', category || '');
    uploadFormData.append('department', department || '');

    setSubmitting(true);
    try {
      await documentService.createDocument(uploadFormData);
      showToast('Document uploaded successfully', 'success');
      setUploadModalOpen(false);
      loadData();
    } catch (error: any) {
      if (error.response?.data) {
        setErrors(error.response.data);
      }
      showToast('Failed to upload document', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const blob = await documentService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Document downloaded', 'success');
    } catch (error) {
      showToast('Failed to download document', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await documentService.deleteDocument(id);
      showToast('Document deleted successfully', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to delete document', 'error');
    }
  };

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'pending_approval': return 'Pending Approval';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'category_name', header: 'Category', render: (value: string | null) => value || '-' },
    { key: 'department_name', header: 'Department', render: (value: string | null) => value || '-' },
    { key: 'status', header: 'Status', render: (value: string) => (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
        {getStatusLabel(value)}
      </span>
    )},
    { key: 'file_size_display', header: 'Size' },
    { key: 'created_by_name', header: 'Created By', render: (value: string | null) => value || '-' },
    { key: 'actions', header: 'Actions', render: (_: any, row: Document) => (
      <div className="flex space-x-2">
        <Button variant="ghost" size="sm" onClick={() => handleView(row)}>
          View
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleDownload(row)}>
          Download
        </Button>
        <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>
          Delete
        </Button>
      </div>
    )},
  ];

  const categoryOptions = [{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c.id.toString(), label: c.name }))];
  const departmentOptions = [{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d.id.toString(), label: d.name }))];
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <Button variant="primary" onClick={handleUpload}>
              Upload Document
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <Input
              placeholder="Search documents..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="max-w-xs"
            />
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={statusOptions}
              className="max-w-xs"
            />
            <Select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              options={categoryOptions}
              className="max-w-xs"
            />
            <Select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              options={departmentOptions}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              title="No documents yet"
              description="Upload your first document to get started"
              action={{ label: 'Upload Document', onClick: handleUpload }}
            />
          ) : (
            <Table columns={columns} data={documents} />
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Document Details" size="lg">
        {selectedDocument && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <p className="mt-1 text-sm text-gray-900">{selectedDocument.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1 text-sm text-gray-900">{selectedDocument.description || '-'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.category_name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.department_name || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">File Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.file_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">File Size</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.file_size_display}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDocument.status)}`}>
                    {getStatusLabel(selectedDocument.status)}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created By</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.created_by_name || '-'}</p>
              </div>
            </div>
            {selectedDocument.rejection_reason && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                <p className="mt-1 text-sm text-red-600">{selectedDocument.rejection_reason}</p>
              </div>
            )}
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => handleDownload(selectedDocument)}>
                Download
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Upload Document" size="lg">
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <Input
            label="Title"
            name="title"
            required
            error={errors.title}
          />
          <Textarea
            label="Description"
            name="description"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              name="category"
              options={[{ value: '', label: 'Select Category' }, ...categories.map(c => ({ value: c.id.toString(), label: c.name }))]}
            />
            <Select
              label="Department"
              name="department"
              options={[{ value: '', label: 'Select Department' }, ...departments.map(d => ({ value: d.id.toString(), label: d.name }))]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document File</label>
            <input
              type="file"
              accept=".pdf,.docx,.pptx,.xlsx"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
            {errors.document_file && (
              <p className="mt-1 text-sm text-red-600">{errors.document_file}</p>
            )}
            {file && (
              <p className="mt-1 text-sm text-gray-500">Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Allowed: PDF, DOCX, PPTX, XLSX (Max 10MB)</p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {submitting ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
