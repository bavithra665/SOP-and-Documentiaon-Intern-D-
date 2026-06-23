import { authService } from '../services/auth';
import { AdminDashboard } from '../components/dashboards/AdminDashboard';
import { ManagerDashboard } from '../components/dashboards/ManagerDashboard';
import { EmployeeDashboard } from '../components/dashboards/EmployeeDashboard';

export const Dashboard: React.FC = () => {
  const user = authService.getStoredUser();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'employee':
        return <EmployeeDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Unable to load dashboard. Please contact support.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user?.first_name || user?.username}!</p>
      </div>
      {renderDashboard()}
    </div>
  );
};
