import { useState, useEffect } from 'react';
import { dashboardService, EmployeeDashboardData } from '../../services/dashboard';
import { Card, CardHeader, CardBody, Button } from '../ui';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const EmployeeDashboard: React.FC = () => {
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const dashboardData = await dashboardService.getEmployeeDashboard();
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
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-ocean-500 to-ocean-600 text-white">
          <CardBody>
            <div className="text-sm font-medium opacity-90">Assigned SOPs</div>
            <div className="text-3xl font-bold mt-2">{data.assigned_sops}</div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardBody>
            <div className="text-sm font-medium opacity-90">Pending SOPs</div>
            <div className="text-3xl font-bold mt-2">{data.pending_sops}</div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardBody>
            <div className="text-sm font-medium opacity-90">Completed SOPs</div>
            <div className="text-3xl font-bold mt-2">{data.completed_sops}</div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardBody>
            <div className="text-sm font-medium opacity-90">Quiz Avg Score</div>
            <div className="text-3xl font-bold mt-2">{data.quiz_average_score}%</div>
          </CardBody>
        </Card>
      </div>

      {/* Quiz Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-sky-500 to-sky-600 text-white">
          <CardBody>
            <div className="text-sm font-medium opacity-90">Quizzes Taken</div>
            <div className="text-3xl font-bold mt-2">{data.quiz_total_taken}</div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
          <CardBody>
            <div className="text-sm font-medium opacity-90">Quiz Pass Rate</div>
            <div className="text-3xl font-bold mt-2">{data.quiz_pass_rate}%</div>
          </CardBody>
        </Card>
      </div>

      {/* Compliance Progress Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Compliance Progress</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.compliance_progress}>
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
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0ea5e9"
                strokeWidth={3}
                dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Recent Documents & Upcoming Quizzes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Recent Documents</h3>
          </CardHeader>
          <CardBody>
            {data.recent_documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No recent documents</div>
            ) : (
              <div className="space-y-3">
                {data.recent_documents.map((doc) => (
                  <div key={doc.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">{doc.title}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {doc.department} • {doc.file_type}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Uploaded by {doc.uploaded_by}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Quizzes</h3>
          </CardHeader>
          <CardBody>
            {data.upcoming_quizzes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No upcoming quizzes</div>
            ) : (
              <div className="space-y-3">
                {data.upcoming_quizzes.map((quiz) => (
                  <div key={quiz.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{quiz.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{quiz.sop_title}</div>
                      <div className="text-xs text-gray-500 mt-1">{quiz.question_count} questions</div>
                    </div>
                    <Button variant="primary" size="sm">
                      Take Quiz
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* SOP Completion Overview */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">SOP Completion Overview</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Completed', value: data.completed_sops },
                  { name: 'Pending', value: data.pending_sops },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
};
