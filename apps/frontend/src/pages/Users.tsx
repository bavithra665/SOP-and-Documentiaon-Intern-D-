import { useState, useEffect } from 'react';
import { userManagementService, User, UserFormData } from '../services/userManagement';
import { departmentService, Department } from '../services/department';
import { Button, Card, CardHeader, CardBody, Table, Modal, Input, Select, EmptyState, useToast } from '../components/ui';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'employee',
    department: null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, departmentsData] = await Promise.all([
        userManagementService.getUsers(),
        departmentService.getDepartments(),
      ]);
      setUsers(usersData);
      setDepartments(departmentsData);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirm_password: '',
      first_name: '',
      last_name: '',
      role: 'employee',
      department: null,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.name.split(' ')[0] || '',
      last_name: user.name.split(' ').slice(1).join(' ') || '',
      role: user.role,
      department: user.department,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await userManagementService.deleteUser(id);
      showToast('User deleted successfully', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to delete user', 'error');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      if (user.is_active) {
        await userManagementService.deactivateUser(user.id);
        showToast('User deactivated', 'success');
      } else {
        await userManagementService.activateUser(user.id);
        showToast('User activated', 'success');
      }
      loadData();
    } catch (error) {
      showToast('Failed to update user status', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Partial<Record<keyof UserFormData, string>> = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!editingUser && !formData.password) newErrors.password = 'Password is required';
    if (!editingUser && formData.password !== formData.confirm_password) newErrors.confirm_password = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        await userManagementService.updateUser(editingUser.id, formData);
        showToast('User updated successfully', 'success');
      } else {
        await userManagementService.createUser(formData);
        showToast('User created successfully', 'success');
      }
      setModalOpen(false);
      loadData();
    } catch (error: any) {
      if (error.response?.data) {
        setErrors(error.response.data);
      }
      showToast(editingUser ? 'Failed to update user' : 'Failed to create user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'employee', label: 'Employee' },
  ];

  const departmentOptions = [
    { value: '', label: 'No Department' },
    ...departments.map(d => ({ value: d.id.toString(), label: d.name })),
  ];

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (value: string) => (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        value === 'admin' ? 'bg-purple-100 text-purple-800' :
        value === 'manager' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    )},
    { key: 'department_name', header: 'Department', render: (value: string | null) => value || '-' },
    { key: 'is_active', header: 'Status', render: (value: boolean) => (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {value ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', header: 'Actions', render: (_: any, row: User) => (
      <div className="flex space-x-2">
        <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleToggleActive(row)}>
          {row.is_active ? 'Deactivate' : 'Activate'}
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
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <Button variant="primary" onClick={handleCreate}>
              Create User
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              title="No users yet"
              description="Create your first user to get started"
              action={{ label: 'Create User', onClick: handleCreate }}
            />
          ) : (
            <Table columns={columns} data={users} />
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Edit User' : 'Create User'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              error={errors.first_name}
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              error={errors.last_name}
            />
          </div>
          <Input
            label="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            error={errors.username}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            required
          />
          {!editingUser && (
            <>
              <Input
                label="Password"
                type="password"
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                required
                helperText="Must be at least 8 characters"
              />
              <Input
                label="Confirm Password"
                type="password"
                value={formData.confirm_password || ''}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                error={errors.confirm_password}
                required
              />
            </>
          )}
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            options={roleOptions}
            error={errors.role as string}
          />
          <Select
            label="Department"
            value={formData.department?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, department: e.target.value ? parseInt(e.target.value) : null })}
            options={departmentOptions}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {submitting ? 'Saving...' : editingUser ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
