import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth';
import { Button, Input, Card, CardBody } from '../components/ui';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const [formData, setFormData] = useState({
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState<{ password?: string; confirm_password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};

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

    if (!token) {
      setGeneralError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, formData.password);
      setSuccess(true);
    } catch (err: any) {
      setGeneralError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-50 to-white">
        <Card className="max-w-md w-full">
          <CardBody>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Password reset successful
              </h2>
              <p className="text-gray-600 mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Sign in
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-50 to-white">
      <Card className="max-w-md w-full">
        <CardBody>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Reset your password
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your new password below.
            </p>
          </div>

          {generalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {generalError}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              id="password"
              name="password"
              label="New Password"
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
              label="Confirm New Password"
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
              {loading ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Remember your password?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-ocean-600 hover:text-ocean-700 font-medium"
            >
              Sign in
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
