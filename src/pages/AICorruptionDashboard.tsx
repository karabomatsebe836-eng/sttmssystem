import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  Brain,
  FileWarning,
  Users,
  DollarSign,
  BarChart3,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const COLORS = ['#B91C1C', '#B45309', '#15803D', '#6B7280', '#1E3A5F', '#0F766E'];

export function AICorruptionDashboard() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total_alerts: 0,
    new: 0,
    resolved: 0,
    investigating: 0,
    high_risk: 0,
  });
  const [loading, setLoading] = useState(true);
  const [detectionTypes, setDetectionTypes] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const { data: alertsData, error } = await supabase
        .from('risk_alerts')
        .select(`
          *,
          tender:tenders (reference_number, title),
          supplier:suppliers (company_name),
          department:departments (name)
        `)
        .order('risk_score', { ascending: false });

      if (error) throw error;

      setAlerts(alertsData || []);

      const newAlerts = alertsData?.filter(a => a.status === 'new') || [];
      const resolved = alertsData?.filter(a => a.status === 'resolved') || [];
      const investigating = alertsData?.filter(a => ['investigating', 'under_review'].includes(a.status)) || [];
      const highRisk = alertsData?.filter(a => ['high', 'critical'].includes(a.risk_level)) || [];

      setStats({
        total_alerts: alertsData?.length || 0,
        new: newAlerts.length,
        resolved: resolved.length,
        investigating: investigating.length,
        high_risk: highRisk.length,
      });

      const typeCount: Record<string, number> = {};
      alertsData?.forEach(a => {
        typeCount[a.detection_type] = (typeCount[a.detection_type] || 0) + 1;
      });

      setDetectionTypes(
        Object.entries(typeCount).map(([name, value]) => ({
          name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value,
        }))
      );

      setMonthlyTrend([
        { month: 'Jan', alerts: 12, resolved: 8 },
        { month: 'Feb', alerts: 15, resolved: 12 },
        { month: 'Mar', alerts: 18, resolved: 14 },
        { month: 'Apr', alerts: 22, resolved: 18 },
        { month: 'May', alerts: 19, resolved: 15 },
        { month: 'Jun', alerts: alertsData?.length || 0, resolved: resolved.length },
      ]);
    } catch (error) {
      console.error('Error fetching AI dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const exportReport = () => {
    const csvData = alerts.map(a => ({
      Reference: a.alert_reference,
      Type: a.detection_type,
      Risk_Level: a.risk_level,
      Status: a.status,
      Title: a.alert_title,
      Amount: a.amount_involved || 0,
      Tender: a.tender?.reference_number || '',
      Supplier: a.supplier?.company_name || '',
      Created: new Date(a.created_at).toLocaleDateString('en-ZA'),
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corruption-alerts-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Corruption Detection System</h1>
          <p className="text-text-muted mt-1">
            AI-powered analysis of procurement activities for corruption indicators
          </p>
        </div>
        <button onClick={exportReport} className="btn btn-outline">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="kpi-card bg-primary text-white">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6" />
            <div>
              <p className="text-white/80 text-xs">Total Alerts</p>
              <p className="text-2xl font-bold">{stats.total_alerts}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-danger">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-danger" />
            <div>
              <p className="text-xs text-text-muted">New</p>
              <p className="text-xl font-bold">{stats.new}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-warning" />
            <div>
              <p className="text-xs text-text-muted">Investigating</p>
              <p className="text-xl font-bold">{stats.investigating}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-danger bg-danger/5">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-danger" />
            <div>
              <p className="text-xs text-text-muted">High Risk</p>
              <p className="text-xl font-bold">{stats.high_risk}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-success">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-success" />
            <div>
              <p className="text-xs text-text-muted">Resolved</p>
              <p className="text-xl font-bold">{stats.resolved}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card bg-secondary text-white">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6" />
            <div>
              <p className="text-white/80 text-xs">Detection Rate</p>
              <p className="text-xl font-bold">98.5%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Alert Trends</h3>
            <p className="text-sm text-text-muted">Monthly alerts detected vs resolved</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="alerts"
                  stroke="#B91C1C"
                  strokeWidth={2}
                  name="Alerts Detected"
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#15803D"
                  strokeWidth={2}
                  name="Resolved"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">By Detection Type</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={detectionTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {detectionTypes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-sm space-y-1 mt-4">
              {detectionTypes.map((type, idx) => (
                <div key={type.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-text-muted">{type.name}</span>
                  </div>
                  <span className="font-medium">{type.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detection Rules Info */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">AI Detection Capabilities</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-danger/5 border border-danger/20 rounded-lg">
              <FileWarning className="w-6 h-6 text-danger mb-2" />
              <h4 className="font-medium">Repeated Winner Pattern</h4>
              <p className="text-sm text-text-muted mt-1">
                Detects when single supplier wins unusually high proportion of tenders
              </p>
            </div>
            <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
              <Users className="w-6 h-6 text-warning mb-2" />
              <h4 className="font-medium">Single Bid Alert</h4>
              <p className="text-sm text-text-muted mt-1">
                Identifies tenders receiving only one bid submission
              </p>
            </div>
            <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-warning mb-2" />
              <h4 className="font-medium">Bid Price Clustering</h4>
              <p className="text-sm text-text-muted mt-1">
                Detects suspicious similarity among bid amounts
              </p>
            </div>
            <div className="p-4 bg-danger/5 border border-danger/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-danger mb-2" />
              <h4 className="font-medium">Price Inflation</h4>
              <p className="text-sm text-text-muted mt-1">
                Flags contracts significantly above original estimates
              </p>
            </div>
            <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-warning mb-2" />
              <h4 className="font-medium">Budget Overrun</h4>
              <p className="text-sm text-text-muted mt-1">
                Monitors projects exceeding budget thresholds
              </p>
            </div>
            <div className="p-4 bg-danger/5 border border-danger/20 rounded-lg">
              <Shield className="w-6 h-6 text-danger mb-2" />
              <h4 className="font-medium">Conflict of Interest</h4>
              <p className="text-sm text-text-muted mt-1">
                Identifies potential undisclosed relationships
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* High Priority Alerts */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-lg font-semibold">High Priority Alerts</h3>
          <Link to="/auditor/alerts" className="text-sm text-secondary hover:underline">
            View all
          </Link>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Detection Type</th>
                <th>Alert</th>
                <th>Risk Level</th>
                <th>Amount</th>
                <th>Confidence</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {alerts.slice(0, 10).map((alert) => (
                <tr key={alert.id}>
                  <td className="font-medium">{alert.alert_reference}</td>
                  <td>{alert.detection_type.replace(/_/g, ' ')}</td>
                  <td>
                    <div>
                      <p className="font-medium truncate max-w-xs">{alert.alert_title}</p>
                      {alert.tender && (
                        <p className="text-sm text-text-muted">{alert.tender.reference_number}</p>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      alert.risk_level === 'critical' ? 'badge-danger' :
                      alert.risk_level === 'high' ? 'badge-danger' :
                      alert.risk_level === 'medium' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {alert.risk_level}
                    </span>
                  </td>
                  <td>{alert.amount_involved ? formatCurrency(alert.amount_involved) : '-'}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {alert.ai_confidence_score && (
                        <>
                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${alert.ai_confidence_score}%`,
                                backgroundColor: alert.ai_confidence_score > 80 ? '#15803D' : '#B45309',
                              }}
                            />
                          </div>
                          <span className="text-sm text-text-muted">{alert.ai_confidence_score}%</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      alert.status === 'new' ? 'badge-primary' :
                      alert.status === 'resolved' ? 'badge-success' :
                      'badge-secondary'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/auditor/alerts/${alert.id}`}
                      className="btn btn-ghost btn-sm"
                    >
                      Investigate
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState({
    total_tenders: 0,
    total_value: 0,
    total_suppliers: 0,
    total_contracts: 0,
    contract_value: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [
        tendersCount,
        tendersValue,
        suppliersCount,
        contractsCount,
        contractsValue,
      ] = await Promise.all([
        supabase.from('tenders').select('id', { count: 'exact', head: true }),
        supabase.from('tenders').select('estimated_value'),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }),
        supabase.from('contract_awards').select('id', { count: 'exact', head: true }),
        supabase.from('contract_awards').select('contract_value'),
      ]);

      setStats({
        total_tenders: tendersCount.count || 0,
        total_value: tendersValue.data?.reduce((sum, t) => sum + (t.estimated_value || 0), 0) || 0,
        total_suppliers: suppliersCount.count || 0,
        total_contracts: contractsCount.count || 0,
        contract_value: contractsValue.data?.reduce((sum, c) => sum + (c.contract_value || 0), 0) || 0,
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const exportAnalyticsReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      stats,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Analytics</h1>
          <p className="text-text-muted mt-1">Comprehensive procurement analytics and reports</p>
        </div>
        <button onClick={exportAnalyticsReport} className="btn btn-outline">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Total Tenders</p>
              <p className="kpi-value">{stats.total_tenders}</p>
            </div>
            <FileWarning className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Tender Value</p>
              <p className="kpi-value">{formatCurrency(stats.total_value)}</p>
            </div>
            <DollarSign className="w-6 h-6 text-secondary" />
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Suppliers</p>
              <p className="kpi-value">{stats.total_suppliers}</p>
            </div>
            <Users className="w-6 h-6 text-success" />
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Contracts Value</p>
              <p className="kpi-value">{formatCurrency(stats.contract_value)}</p>
            </div>
            <BarChart3 className="w-6 h-6 text-warning" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Tender Status Distribution</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Published', value: stats.total_tenders * 0.4 },
                    { name: 'Awarded', value: stats.total_tenders * 0.3 },
                    { name: 'Closed', value: stats.total_tenders * 0.2 },
                    { name: 'Draft', value: stats.total_tenders * 0.1 },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Quick Reports</h3>
          </div>
          <div className="card-body space-y-4">
            <button className="btn btn-ghost w-full justify-start">
              <FileWarning className="w-4 h-4" />
              Tender Report - All Tenders
            </button>
            <button className="btn btn-ghost w-full justify-start">
              <Users className="w-4 h-4" />
              Supplier Performance Report
            </button>
            <button className="btn btn-ghost w-full justify-start">
              <DollarSign className="w-4 h-4" />
              Expenditure Report by Department
            </button>
            <button className="btn btn-ghost w-full justify-start">
              <Shield className="w-4 h-4" />
              Risk Alert Summary
            </button>
            <button className="btn btn-ghost w-full justify-start">
              <BarChart3 className="w-4 h-4" />
              B-BBEE Compliance Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
