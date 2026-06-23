import { useState, useEffect } from 'react';
import { dashboardService, ManagerDashboardData } from '../../services/dashboard';
import { Card, CardHeader, CardBody, Table } from '../ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export const ManagerDashboard: React.FC = () => {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const dashboardData = await dashboardService.getManagerDashboard();
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{data.department_name}</h2>
        <p className="text-gray-600">Department Overview</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-ocean-500 to-ocean-600 text-white">
          <CardBody>
            <div className="text-sm font-medium opacity-90">Employees</div>
            <div className="text-3xl font-bold mt-2">{data.total_employees}</div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-sky-500 to-sky-600 text-white">
          <CardBody>
            <div className="text-sm font-medium opacity-90">SOPs</div>
            <div className="text-3xl font-bold mt-2">{data.department_sops}</div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardBody>
            <div className="text-sm font-medium opacity-90">Compliance</div>
            <div className="text-3xl font-bold mt-2">{data.employee_compliance_rate}%</div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardBody>
            <div className="text-sm font-medium opacity-90">Pending Reviews</div>
            <div className="text-3xl font-bold mt-2">{data.pending_reviews}</div>
          </CardBody>
        </Card>
      </div>

      {/* Quiz Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardBody>
            <div className="text-sm font-medium opacity-90">Quiz Average Score</div>
            <div className="text-3xl font-bold mt-2">{data.quiz_average_score}%</div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
          <CardBody>
            <div className="text-sm font-medium opacity-90">Quiz Pass Rate</div>
            <div className="text-3xl font-bold mt-2">{data.quiz_pass_rate}%</div>
          </CardBody>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Compliance Trend</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.compliance_trend}>
                <defs>
                  <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0ea5e9"
                  fillOpacity={1}
                  fill="url(#colorCompliance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Quiz Performance</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.quiz_performance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="employee" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="average_score" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
        </CardHeader>
        <CardBody>
          {data.top_performers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No quiz data available</div>
          ) : (
            <Table
              columns={[
                { key: 'employee', header: 'Employee' },
                { key: 'average_score', header: 'Average Score', render: (value: number) => `${value}%` },
                { key: 'quizzes_taken', header: 'Quizzes Taken' },
              ]}
              data={data.top_performers}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
};
