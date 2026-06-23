import { Outlet } from 'react-router-dom';
import { authService } from '../services/auth';

export const BaseLayout: React.FC = () => {
  const user = authService.getStoredUser();

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-ocean-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">AI Documentation System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">{user?.username}</span>
              <span className="text-xs bg-ocean-500 px-2 py-1 rounded">{user?.role}</span>
              <button
                onClick={handleLogout}
                className="text-sm hover:text-ocean-200 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};
