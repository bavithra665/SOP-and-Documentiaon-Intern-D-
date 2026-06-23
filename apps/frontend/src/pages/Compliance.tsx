import { useState, useEffect } from 'react';
import { sopService, SOP, SOPCompliance, ComplianceAnalytics } from '../services/sop';
import { Card, CardHeader, CardBody, Button, Table, useToast } from '../components/ui';

export const Compliance: React.FC = () => {
  const [analytics, setAnalytics] = useState<ComplianceAnalytics | null>(null);
  const [myCompliance, setMyCompliance] = useState<SOPCompliance[]>([]);
  const [publishedSOPs, setPublishedSOPs] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, complianceData, sopsData] = await Promise.all([
        sopService.getAnalytics(),
        sopService.getMyCompliance(),
        sopService.getPublished(),
      ]);
      setAnalytics(analyticsData);
      setMyCompliance(complianceData);
      setPublishedSOPs(sopsData);
    } catch (error) {
      showToast('Failed to load compliance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async (sopId: number) => {
    try {
      await sopService.readSOP(sopId);
      showToast('SOP marked as read', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to mark SOP as read', 'error');
    }
  };

  const handleAcknowledge = async (sopId: number) => {
    try {
      await sopService.acknowledgeSOP(sopId);
      showToast('SOP acknowledged successfully', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to acknowledge SOP', 'error');
    }
  };

  const getComplianceStatus = (sopId: number) => {
    const compliance = myCompliance.find(c => c.sop === sopId);
    if (!compliance) return { read: false, acknowledged: false };
    return { read: !!compliance.read_at, acknowledged: compliance.acknowledged };
  };

  const columns = [
    { key: 'title', header: 'SOP Title' },
    { key: 'version', header: 'Version', render: (value: number) => `v${value}` },
    { key: 'department_name', header: 'Department', render: (value: string | null) => value || '-' },
    { key: 'status', header: 'Status', render: (_: any, row: SOP) => {
      const status = getComplianceStatus(row.id);
      if (status.acknowledged) {
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Acknowledged</span>;
      } else if (status.read) {
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Read</span>;
      } else {
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Not Started</span>;
      }
    }},
    { key: 'actions', header: 'Actions', render: (_: any, row: SOP) => {
      const status = getComplianceStatus(row.id);
      return (
        <div className="flex space-x-2">
          {!status.read && (
            <Button variant="primary" size="sm" onClick={() => handleRead(row.id)}>
              Mark as Read
            </Button>
          )}
          {status.read && !status.acknowledged && (
            <Button variant="primary" size="sm" onClick={() => handleAcknowledge(row.id)}>
              Acknowledge
            </Button>
          )}
          {status.acknowledged && (
            <span className="text-sm text-green-600 font-medium">Completed</span>
          )}
        </div>
      );
    }},
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">SOP Compliance Dashboard</h1>
        </CardHeader>
      </Card>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Total SOPs</div>
              <div className="text-3xl font-bold text-gray-900">{analytics.total_sops}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Compliance Rate</div>
              <div className="text-3xl font-bold text-green-600">{analytics.compliance_percentage}%</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Read Rate</div>
              <div className="text-3xl font-bold text-blue-600">{analytics.read_percentage}%</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Pending Acknowledgement</div>
              <div className="text-3xl font-bold text-orange-600">{analytics.pending_sops}</div>
            </CardBody>
          </Card>
        </div>
      )}

      {analytics && analytics.department_compliance.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Department Compliance</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {analytics.department_compliance.map((dept) => (
                <div key={dept.department} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{dept.department}</span>
                      <span className="text-sm text-gray-600">{dept.compliance_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-ocean-600 h-2 rounded-full"
                        style={{ width: `${dept.compliance_percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {dept.acknowledged_sops} of {dept.total_sops} SOPs acknowledged
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Published SOPs</h2>
        </CardHeader>
        <CardBody>
          {publishedSOPs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No published SOPs available</div>
          ) : (
            <Table columns={columns} data={publishedSOPs} />
          )}
        </CardBody>
      </Card>
    </div>
  );
};
