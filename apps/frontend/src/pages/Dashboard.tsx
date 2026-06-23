import { authService } from '../services/auth';
import { Card, CardBody, CardHeader } from '../components/ui';

export const Dashboard: React.FC = () => {
  const user = authService.getStoredUser();

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user?.first_name || user?.username}!</p>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover>
          <CardBody>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-ocean-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Documents</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-ocean-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">SOPs</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-ocean-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Team Members</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Your Role</h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-ocean-100 text-ocean-800">
              {user?.role}
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
