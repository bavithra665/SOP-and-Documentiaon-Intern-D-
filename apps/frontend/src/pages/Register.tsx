import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { Button, Input, Card, CardBody } from '../components/ui';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
}

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    const newErrors: Partial<Record<keyof RegisterData, string>> = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await authService.register(formData);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.data) {
        const apiErrors = err.response.data;
        setErrors(apiErrors);
        setGeneralError(apiErrors.non_field_errors?.[0] || 'Registration failed. Please try again.');
      } else {
        setGeneralError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof RegisterData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-50 to-white">
      <Card className="max-w-md w-full">
        <CardBody>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              AI Documentation System
            </p>
          </div>

          {generalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {generalError}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="first_name"
                name="first_name"
                label="First Name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                error={errors.first_name}
              />
              <Input
                id="last_name"
                name="last_name"
                label="Last Name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                error={errors.last_name}
              />
            </div>

            <Input
              id="username"
              name="username"
              label="Username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
            />

            <Input
              id="email"
              name="email"
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            <Input
              id="password"
              name="password"
              label="Password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              helperText="Must be at least 8 characters"
            />

            <Input
              id="confirm_password"
              name="confirm_password"
              label="Confirm Password"
              type="password"
              required
              value={formData.confirm_password}
              onChange={handleChange}
              error={errors.confirm_password}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-ocean-600 hover:text-ocean-700 font-medium">
              Sign in
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
