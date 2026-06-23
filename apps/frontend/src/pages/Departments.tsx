import { useState, useEffect } from 'react';
import { departmentService, Department, DepartmentFormData } from '../services/department';
import { Button, Card, CardHeader, CardBody, Table, Modal, Input, Textarea, EmptyState, useToast } from '../components/ui';

export const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>({ name: '', description: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof DepartmentFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentService.getDepartments();
      setDepartments(data);
    } catch (error) {
      showToast('Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDepartment(null);
    setFormData({ name: '', description: '' });
    setErrors({});
    setModalOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({ name: department.name, description: department.description });
    setErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    
    try {
      await departmentService.deleteDepartment(id);
      showToast('Department deleted successfully', 'success');
      loadDepartments();
    } catch (error) {
      showToast('Failed to delete department', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: 'Department name is required' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingDepartment) {
        await departmentService.updateDepartment(editingDepartment.id, formData);
        showToast('Department updated successfully', 'success');
      } else {
        await departmentService.createDepartment(formData);
        showToast('Department created successfully', 'success');
      }
      setModalOpen(false);
      loadDepartments();
    } catch (error: any) {
      if (error.response?.data) {
        setErrors(error.response.data);
      }
      showToast(editingDepartment ? 'Failed to update department' : 'Failed to create department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'description', header: 'Description' },
    { key: 'user_count', header: 'Users' },
    { key: 'actions', header: 'Actions', render: (_: any, row: Department) => (
      <div className="flex space-x-2">
        <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>
          Delete
        </Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
            <Button variant="primary" onClick={handleCreate}>
              Create Department
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
            </div>
          ) : departments.length === 0 ? (
            <EmptyState
              title="No departments yet"
              description="Create your first department to get started"
              action={{ label: 'Create Department', onClick: handleCreate }}
            />
          ) : (
            <Table columns={columns} data={departments} />
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingDepartment ? 'Edit Department' : 'Create Department'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={errors.description}
            rows={4}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {submitting ? 'Saving...' : editingDepartment ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
