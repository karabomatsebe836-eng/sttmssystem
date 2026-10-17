import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { RiskAlert, AuditLog } from '../types';
import {
  AlertTriangle,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  Shield,
  FileText,
  User,
  Activity,
  Download,
  Calendar,
  TrendingUp,
  ArrowRight,
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
} from 'recharts';

const COLORS = ['#1E3A5F', '#B91C1C', '#B45309', '#15803D'];

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
      (log.user_email && log.user_email.toLowerCase().includes(search.toLowerCase()));
    const matchesAction = !actionFilter || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Description'].join(','),
      ...filteredLogs.map((log) =>
        [
          log.created_at,
          log.user_email || '',
          log.action,
          log.entity_type,
          log.entity_id || '',
          log.description || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-text-muted mt-1">System activity and change history</p>
        </div>
        <button onClick={exportLogs} className="btn btn-outline">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="select w-full sm:w-40"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
            </select>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-ZA')}
                    </td>
                    <td>
                      <div>
                        <p className="font-medium">{log.user_email || 'System'}</p>
                        <p className="text-sm text-text-muted">{log.user_role}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        log.action === 'create' ? 'badge-success' :
                        log.action === 'update' ? 'badge-warning' :
                        log.action === 'delete' ? 'badge-danger' :
                        'badge-primary'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium">{log.entity_type}</p>
                        <p className="text-sm text-text-muted">{log.entity_reference}</p>
                      </div>
                    </td>
                    <td className="max-w-xs truncate">{log.description}</td>
                    <td>
                      <span className={`badge ${
                        log.severity === 'error' ? 'badge-danger' :
                        log.severity === 'warning' ? 'badge-warning' :
                        'badge-secondary'
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RiskAlertsPage() {
  const [alerts, setAlerts] = useState<(RiskAlert & {
    tender?: any;
    supplier?: any;
    department?: any
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('risk_alerts')
        .select(`
          *,
          tender:tenders (reference_number, title),
          supplier:suppliers (company_name),
          department:departments (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    const matchesRisk = !riskFilter || alert.risk_level === riskFilter;
    const matchesStatus = !statusFilter || alert.status === statusFilter;
    return matchesRisk && matchesStatus;
  });

  const stats = {
    total: alerts.length,
    new: alerts.filter((a) => a.status === 'new').length,
    investigating: alerts.filter((a) => a.status === 'investigating').length,
    resolved: alerts.filter((a) => a.status === 'resolved').length,
  };

  const chartData = alerts.reduce((acc, alert) => {
    const type = alert.detection_type;
    const existing = acc.find((d) => d.name === type);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: type, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Risk Alerts Dashboard</h1>
          <p className="text-text-muted mt-1">AI-powered corruption detection alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm text-text-muted">Total Alerts</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-danger">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-danger" />
            <div>
              <p className="text-sm text-text-muted">New</p>
              <p className="text-2xl font-bold">{stats.new}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-warning" />
            <div>
              <p className="text-sm text-text-muted">Investigating</p>
              <p className="text-2xl font-bold">{stats.investigating}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-success">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-success" />
            <div>
              <p className="text-sm text-text-muted">Resolved</p>
              <p className="text-2xl font-bold">{stats.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold">Alerts</h3>
            <div className="flex gap-2">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="select text-sm w-32"
              >
                <option value="">All Risk</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select text-sm w-32"
              >
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="under_review">Under Review</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
          <div className="divide-y divide-border">
            {filteredAlerts.slice(0, 10).map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-surface/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      alert.risk_level === 'critical' || alert.risk_level === 'high'
                        ? 'bg-danger/10'
                        : alert.risk_level === 'medium'
                        ? 'bg-warning/10'
                        : 'bg-success/10'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 ${
                        alert.risk_level === 'critical' || alert.risk_level === 'high'
                          ? 'text-danger'
                          : alert.risk_level === 'medium'
                          ? 'text-warning'
                          : 'text-success'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{alert.alert_title}</p>
                      <p className="text-sm text-text-muted mt-1">{alert.alert_description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                        <span>{alert.alert_reference}</span>
                        <span>{alert.detection_type}</span>
                        {alert.amount_involved && (
                          <span>{formatCurrency(alert.amount_involved)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`badge ${
                      alert.risk_level === 'critical' ? 'badge-danger' :
                      alert.risk_level === 'high' ? 'badge-danger' :
                      alert.risk_level === 'medium' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {alert.risk_level}
                    </span>
                    <span className={`badge ${
                      alert.status === 'new' ? 'badge-primary' :
                      alert.status === 'resolved' ? 'badge-success' :
                      'badge-secondary'
                    }`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.split('_')[0]} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AlertInvestigationPage() {
  const { id } = useParams();
  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    fetchAlert();
  }, [id]);

  async function fetchAlert() {
    try {
      const { data, error } = await supabase
        .from('risk_alerts')
        .select(`
          *,
          tender:tenders (*),
          supplier:suppliers (*),
          contract:contract_awards (*),
          department:departments (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setAlert(data);
      setNotes(data.investigation_notes || '');
    } catch (error) {
      console.error('Error fetching alert:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: string) {
    try {
      const { error } = await supabase
        .from('risk_alerts')
        .update({ status, investigation_notes: notes })
        .eq('id', id);

      if (error) throw error;
      fetchAlert();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  async function resolveAlert() {
    try {
      const { error } = await supabase
        .from('risk_alerts')
        .update({
          status: 'resolved',
          resolution_notes: resolution,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      fetchAlert();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!alert) {
    return <div>Alert not found</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-muted">{alert.alert_reference}</p>
          <h1 className="text-2xl font-bold">{alert.alert_title}</h1>
        </div>
        <div className="flex gap-2">
          <span className={`badge badge-lg ${
            alert.risk_level === 'critical' || alert.risk_level === 'high'
              ? 'badge-danger'
              : 'badge-warning'
          }`}>
            {alert.risk_level} Risk
          </span>
          <span className={`badge badge-lg ${
            alert.status === 'resolved' ? 'badge-success' : 'badge-primary'
          }`}>
            {alert.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Alert Details</h3>
            </div>
            <div className="card-body">
              <p className="text-text-secondary">{alert.alert_description}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-muted">Detection Type</p>
                  <p className="font-medium">{alert.detection_type}</p>
                </div>
                <div>
                  <p className="text-text-muted">Risk Score</p>
                  <p className="font-medium">{alert.risk_score}/100</p>
                </div>
                {alert.ai_confidence_score && (
                  <div>
                    <p className="text-text-muted">AI Confidence</p>
                    <p className="font-medium">{alert.ai_confidence_score}%</p>
                  </div>
                )}
                {alert.amount_involved && (
                  <div>
                    <p className="text-text-muted">Amount Involved</p>
                    <p className="font-medium">{formatCurrency(alert.amount_involved)}</p>
                  </div>
                )}
              </div>
              {alert.ai_recommendation && (
                <div className="mt-4 p-4 bg-warning/10 rounded-lg">
                  <p className="text-sm font-medium text-warning">AI Recommendation</p>
                  <p className="text-sm text-text-secondary mt-1">{alert.ai_recommendation}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Investigation Notes</h3>
            </div>
            <div className="card-body">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input"
                rows={4}
                placeholder="Add investigation notes..."
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => updateStatus('investigating')}
                  className="btn btn-warning"
                >
                  Mark Investigating
                </button>
                <button
                  onClick={() => updateStatus('under_review')}
                  className="btn btn-ghost"
                >
                  Under Review
                </button>
              </div>
            </div>
          </div>

          {alert.status !== 'resolved' && (
            <div className="card border-success">
              <div className="card-header bg-success/10">
                <h3 className="text-lg font-semibold text-success">Resolve Alert</h3>
              </div>
              <div className="card-body">
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Resolution notes..."
                />
                <div className="flex gap-2 mt-4">
                  <button onClick={resolveAlert} className="btn btn-success">
                    <CheckCircle className="w-4 h-4" />
                    Mark as Resolved
                  </button>
                  <button
                    onClick={() => updateStatus('false_positive')}
                    className="btn btn-ghost"
                  >
                    False Positive
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Related Entities</h3>
            </div>
            <div className="card-body space-y-4">
              {alert.tender && (
                <div className="p-3 bg-surface rounded-lg">
                  <p className="text-xs text-text-muted">Tender</p>
                  <p className="font-medium">{alert.tender.reference_number}</p>
                  <p className="text-sm text-text-muted truncate">{alert.tender.title}</p>
                </div>
              )}
              {alert.supplier && (
                <div className="p-3 bg-surface rounded-lg">
                  <p className="text-xs text-text-muted">Supplier</p>
                  <p className="font-medium">{alert.supplier.company_name}</p>
                </div>
              )}
              {alert.department && (
                <div className="p-3 bg-surface rounded-lg">
                  <p className="text-xs text-text-muted">Department</p>
                  <p className="font-medium">{alert.department.name}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Risk Factors</h3>
            </div>
            <div className="card-body">
              <ul className="space-y-2">
                {alert.risk_factors?.map((factor: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Timeline</h3>
            </div>
            <div className="card-body text-sm">
              <div className="space-y-3">
                <div>
                  <p className="text-text-muted">Detected</p>
                  <p className="font-medium">{new Date(alert.detected_at).toLocaleString('en-ZA')}</p>
                </div>
                {alert.assigned_at && (
                  <div>
                    <p className="text-text-muted">Assigned</p>
                    <p className="font-medium">{new Date(alert.assigned_at).toLocaleString('en-ZA')}</p>
                  </div>
                )}
                {alert.resolved_at && (
                  <div>
                    <p className="text-text-muted">Resolved</p>
                    <p className="font-medium">{new Date(alert.resolved_at).toLocaleString('en-ZA')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
