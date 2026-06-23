import { useState, useEffect } from 'react';
import { sopService, SOP, SOPFormData } from '../services/sop';
import { departmentService, Department } from '../services/department';
import { Button, Card, CardHeader, CardBody, Table, Modal, Input, Textarea, Select, EmptyState, useToast } from '../components/ui';

export const SOPs: React.FC = () => {
  const [sops, setSOPs] = useState<SOP[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [formData, setFormData] = useState<SOPFormData>({
    title: '',
    purpose: '',
    scope: '',
    procedure_steps: [''],
    department: null,
  });
  const [reviewData, setReviewData] = useState({ approved: true, comments: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ status: '', department: '', search: '' });
  const { showToast } = useToast();

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sopsData, departmentsData] = await Promise.all([
        sopService.getSOPs(filters),
        departmentService.getDepartments(),
      ]);
      setSOPs(sopsData);
      setDepartments(departmentsData);
    } catch (error) {
      showToast('Failed to load SOPs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      title: '',
      purpose: '',
      scope: '',
      procedure_steps: [''],
      department: null,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleEdit = (sop: SOP) => {
    setFormData({
      title: sop.title,
      purpose: sop.purpose,
      scope: sop.scope,
      procedure_steps: sop.procedure_steps || [''],
      department: sop.department,
    });
    setSelectedSOP(sop);
    setErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this SOP?')) return;
    
    try {
      await sopService.deleteSOP(id);
      showToast('SOP deleted successfully', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to delete SOP', 'error');
    }
  };

  const handleView = (sop: SOP) => {
    setSelectedSOP(sop);
    setDetailsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.purpose.trim()) newErrors.purpose = 'Purpose is required';
    if (formData.purpose.length < 10) newErrors.purpose = 'Purpose must be at least 10 characters';
    if (!formData.scope.trim()) newErrors.scope = 'Scope is required';
    if (formData.scope.length < 10) newErrors.scope = 'Scope must be at least 10 characters';
    if (!formData.procedure_steps.length || !formData.procedure_steps[0].trim()) {
      newErrors.procedure_steps = 'At least one procedure step is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (selectedSOP) {
        await sopService.updateSOP(selectedSOP.id, formData);
        showToast('SOP updated successfully', 'success');
      } else {
        await sopService.createSOP(formData);
        showToast('SOP created successfully', 'success');
      }
      setModalOpen(false);
      loadData();
    } catch (error: any) {
      if (error.response?.data) {
        setErrors(error.response.data);
      }
      showToast(selectedSOP ? 'Failed to update SOP' : 'Failed to create SOP', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStep = () => {
    setFormData({ ...formData, procedure_steps: [...formData.procedure_steps, ''] });
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = formData.procedure_steps.filter((_, i) => i !== index);
    setFormData({ ...formData, procedure_steps: newSteps });
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...formData.procedure_steps];
    newSteps[index] = value;
    setFormData({ ...formData, procedure_steps: newSteps });
  };

  const handleSubmitForReview = async (sop: SOP) => {
    try {
      await sopService.submitForReview(sop.id);
      showToast('SOP submitted for review', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to submit SOP for review', 'error');
    }
  };

  const handleReview = async () => {
    if (!selectedSOP) return;
    
    try {
      await sopService.reviewSOP(selectedSOP.id, reviewData.approved, reviewData.comments);
      showToast(`SOP ${reviewData.approved ? 'approved' : 'rejected'}`, 'success');
      setReviewModalOpen(false);
      loadData();
    } catch (error) {
      showToast('Failed to review SOP', 'error');
    }
  };

  const handleApprove = async (sop: SOP) => {
    try {
      await sopService.approveSOP(sop.id);
      showToast('SOP approved and published', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to approve SOP', 'error');
    }
  };

  const handlePublish = async (sop: SOP) => {
    try {
      await sopService.publishSOP(sop.id);
      showToast('SOP published successfully', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to publish SOP', 'error');
    }
  };

  const handleReject = async (sop: SOP) => {
    const reason = window.prompt('Please provide rejection reason:');
    if (!reason) return;
    
    try {
      await sopService.rejectSOP(sop.id, reason);
      showToast('SOP rejected', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to reject SOP', 'error');
    }
  };

  const openReviewModal = (sop: SOP) => {
    setSelectedSOP(sop);
    setReviewData({ approved: true, comments: '' });
    setReviewModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-purple-100 text-purple-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'under_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'published': return 'Published';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const canSubmitForReview = (sop: SOP) => {
    return sop.status === 'draft' && (sop.created_by === currentUser.id || currentUser.role === 'admin');
  };

  const canReview = (sop: SOP) => {
    return sop.status === 'under_review' && (currentUser.role === 'manager' || currentUser.role === 'admin');
  };

  const canApprove = (sop: SOP) => {
    return sop.status === 'approved' && currentUser.role === 'admin';
  };

  const canPublish = (sop: SOP) => {
    return sop.status === 'approved' && currentUser.role === 'admin';
  };

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'version', header: 'Version', render: (value: number) => `v${value}` },
    { key: 'department_name', header: 'Department', render: (value: string | null) => value || '-' },
    { key: 'status', header: 'Status', render: (value: string) => (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
        {getStatusLabel(value)}
      </span>
    )},
    { key: 'created_by_name', header: 'Created By', render: (value: string | null) => value || '-' },
    { key: 'actions', header: 'Actions', render: (_: any, row: SOP) => (
      <div className="flex space-x-2 flex-wrap gap-1">
        <Button variant="ghost" size="sm" onClick={() => handleView(row)}>
          View
        </Button>
        {row.status === 'draft' && (row.created_by === currentUser.id || currentUser.role === 'admin') && (
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
            Edit
          </Button>
        )}
        {canSubmitForReview(row) && (
          <Button variant="primary" size="sm" onClick={() => handleSubmitForReview(row)}>
            Submit
          </Button>
        )}
        {canReview(row) && (
          <Button variant="primary" size="sm" onClick={() => openReviewModal(row)}>
            Review
          </Button>
        )}
        {canApprove(row) && (
          <Button variant="primary" size="sm" onClick={() => handleApprove(row)}>
            Approve
          </Button>
        )}
        {canPublish(row) && (
          <Button variant="primary" size="sm" onClick={() => handlePublish(row)}>
            Publish
          </Button>
        )}
        {(row.status === 'under_review' || row.status === 'approved') && (currentUser.role === 'manager' || currentUser.role === 'admin') && (
          <Button variant="danger" size="sm" onClick={() => handleReject(row)}>
            Reject
          </Button>
        )}
        {row.status === 'draft' && (
          <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>
            Delete
          </Button>
        )}
      </div>
    )},
  ];

  const departmentOptions = [{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d.id.toString(), label: d.name }))];
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'published', label: 'Published' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Standard Operating Procedures</h1>
            <Button variant="primary" onClick={handleCreate}>
              Create SOP
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <Input
              placeholder="Search SOPs..."
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
          ) : sops.length === 0 ? (
            <EmptyState
              title="No SOPs yet"
              description="Create your first SOP to get started"
              action={{ label: 'Create SOP', onClick: handleCreate }}
            />
          ) : (
            <Table columns={columns} data={sops} />
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedSOP ? 'Edit SOP' : 'Create SOP'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
            required
          />
          <Textarea
            label="Purpose"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            error={errors.purpose}
            rows={3}
            required
            helperText="Minimum 10 characters"
          />
          <Textarea
            label="Scope"
            value={formData.scope}
            onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
            error={errors.scope}
            rows={3}
            required
            helperText="Minimum 10 characters"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Procedure Steps</label>
            {formData.procedure_steps.map((step, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  placeholder={`Step ${index + 1}`}
                  className="flex-1"
                />
                {formData.procedure_steps.length > 1 && (
                  <Button variant="danger" size="sm" onClick={() => handleRemoveStep(index)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={handleAddStep}>
              Add Step
            </Button>
            {errors.procedure_steps && (
              <p className="mt-1 text-sm text-red-600">{errors.procedure_steps}</p>
            )}
          </div>
          <Select
            label="Department"
            value={formData.department?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, department: e.target.value ? parseInt(e.target.value) : null })}
            options={[{ value: '', label: 'Select Department' }, ...departments.map(d => ({ value: d.id.toString(), label: d.name }))]}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {submitting ? 'Saving...' : selectedSOP ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title="SOP Details" size="lg">
        {selectedSOP && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedSOP.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Version</label>
              <p className="mt-1 text-sm text-gray-900">v{selectedSOP.version}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Purpose</label>
              <p className="mt-1 text-sm text-gray-900">{selectedSOP.purpose}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Scope</label>
              <p className="mt-1 text-sm text-gray-900">{selectedSOP.scope}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Procedure Steps</label>
              <ol className="list-decimal list-inside space-y-2">
                {selectedSOP.procedure_steps.map((step, index) => (
                  <li key={index} className="text-sm text-gray-900">{step}</li>
                ))}
              </ol>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <p className="mt-1 text-sm text-gray-900">{selectedSOP.department_name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSOP.status)}`}>
                    {getStatusLabel(selectedSOP.status)}
                  </span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Created By</label>
                <p className="mt-1 text-sm text-gray-900">{selectedSOP.created_by_name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(selectedSOP.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            {selectedSOP.review_comments && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Review Comments</label>
                <p className="mt-1 text-sm text-gray-900">{selectedSOP.review_comments}</p>
              </div>
            )}
            {selectedSOP.rejection_reason && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                <p className="mt-1 text-sm text-red-600">{selectedSOP.rejection_reason}</p>
              </div>
            )}
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="secondary" onClick={() => setDetailsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Review SOP">
        {selectedSOP && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={reviewData.approved}
                    onChange={() => setReviewData({ ...reviewData, approved: true })}
                    className="mr-2"
                  />
                  Approve
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!reviewData.approved}
                    onChange={() => setReviewData({ ...reviewData, approved: false })}
                    className="mr-2"
                  />
                  Reject
                </label>
              </div>
            </div>
            <Textarea
              label="Comments"
              value={reviewData.comments}
              onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
              rows={4}
              required={!reviewData.approved}
              helperText="Required when rejecting"
            />
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="secondary" onClick={() => setReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleReview}>
                Submit Review
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
