import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  BarChart3,
  Shield,
  Users,
  DollarSign,
  Activity,
  ArrowRight,
  Plus,
  Save,
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

export function InvestigationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      const { data, error } = await supabase
        .from('risk_alerts')
        .select(`
          *,
          tender:tenders (reference_number, title),
          supplier:suppliers (company_name),
          department:departments (name)
        `)
        .in('status', ['investigating', 'under_review', 'escalated'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching investigations:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    const matchesStatus = !statusFilter || alert.status === statusFilter;
    const matchesSearch = !search ||
      alert.alert_title.toLowerCase().includes(search.toLowerCase()) ||
      alert.alert_reference.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(value);
  };

  const stats = {
    total: alerts.length,
    investigating: alerts.filter(a => a.status === 'investigating').length,
    under_review: alerts.filter(a => a.status === 'under_review').length,
    escalated: alerts.filter(a => a.status === 'escalated').length,
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investigations</h1>
          <p className="text-text-muted mt-1">Active corruption investigations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm text-text-muted">Total Active</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-danger">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-danger" />
            <div>
              <p className="text-sm text-text-muted">Investigating</p>
              <p className="text-2xl font-bold">{stats.investigating}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-warning" />
            <div>
              <p className="text-sm text-text-muted">Under Review</p>
              <p className="text-2xl font-bold">{stats.under_review}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-secondary">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-secondary" />
            <div>
              <p className="text-sm text-text-muted">Escalated</p>
              <p className="text-2xl font-bold">{stats.escalated}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search investigations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select w-full sm:w-48"
            >
              <option value="">All Status</option>
              <option value="investigating">Investigating</option>
              <option value="under_review">Under Review</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Alert</th>
                  <th>Entities</th>
                  <th>Risk Level</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td className="font-medium">{alert.alert_reference}</td>
                    <td>
                      <div>
                        <p className="font-medium">{alert.alert_title}</p>
                        <p className="text-sm text-text-muted">{alert.detection_type}</p>
                      </div>
                    </td>
                    <td>
                      <div>
                        {alert.tender && <p className="text-sm">{alert.tender.reference_number}</p>}
                        {alert.supplier && <p className="text-sm text-text-muted">{alert.supplier.company_name}</p>}
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
                      <span className={`badge ${
                        alert.status === 'investigating' ? 'badge-danger' :
                        alert.status === 'escalated' ? 'badge-warning' :
                        'badge-primary'
                      }`}>
                        {alert.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/auditor/alerts/${alert.id}`} className="btn btn-primary btn-sm">
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
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

export function AuditorReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    tenders: { total: 0, byStatus: [] as any[], byDepartment: [] as any[] },
    alerts: { total: 0, resolved: 0, byType: [] as any[], byRisk: [] as any[] },
    contracts: { total: 0, totalValue: 0, byStatus: [] as any[] },
    suppliers: { total: 0, verified: 0 },
  });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [auditReports, setAuditReports] = useState<any[]>([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState({ title: '', report_type: 'procurement_review', risk_level: 'medium', findings: '', recommendations: '', tender_id: '' });
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    fetchReportData();
  }, []);

  async function fetchReportData() {
    try {
      const [
        tendersData,
        alertsData,
        contractsData,
        suppliersData,
        reportsData,
      ] = await Promise.all([
        supabase.from('tenders').select('id, status, estimated_value, created_at, department:departments(name)'),
        supabase.from('risk_alerts').select('id, status, risk_level, detection_type, amount_involved'),
        supabase.from('contract_awards').select('id, status, contract_value').in('status', ['active', 'completed']),
        supabase.from('suppliers').select('id, is_verified'),
        supabase.from('audit_reports').select('id, report_reference, title, report_type, status, risk_level, findings, recommendations, created_at, tender:tenders(reference_number, title)').order('created_at', { ascending: false }),
      ]);
      const failedQuery = [tendersData, alertsData, contractsData, suppliersData, reportsData].find((query) => query.error);
      if (failedQuery?.error) throw failedQuery.error;

      // Process tenders
      const tenderByStatus: Record<string, number> = {};
      const tenderByDept: Record<string, number> = {};
      (tendersData.data || []).forEach((t: any) => {
        tenderByStatus[t.status] = (tenderByStatus[t.status] || 0) + 1;
        if (t.department?.name) {
          tenderByDept[t.department.name] = (tenderByDept[t.department.name] || 0) + 1;
        }
      });

      // Process alerts
      const alertsByType: Record<string, number> = {};
      const alertsByRisk: Record<string, number> = {};
      (alertsData.data || []).forEach((a: any) => {
        alertsByType[a.detection_type] = (alertsByType[a.detection_type] || 0) + 1;
        alertsByRisk[a.risk_level] = (alertsByRisk[a.risk_level] || 0) + 1;
      });

      // Process contracts
      const contractsByStatus: Record<string, { count: number; value: number }> = {};
      let totalContractValue = 0;
      (contractsData.data || []).forEach((c: any) => {
        totalContractValue += c.contract_value || 0;
        if (!contractsByStatus[c.status]) {
          contractsByStatus[c.status] = { count: 0, value: 0 };
        }
        contractsByStatus[c.status].count++;
        contractsByStatus[c.status].value += c.contract_value || 0;
      });

      setAuditReports(reportsData.data || []);
      setReportData({
        tenders: {
          total: tendersData.data?.length || 0,
          byStatus: Object.entries(tenderByStatus).map(([name, value]) => ({ name, value })),
          byDepartment: Object.entries(tenderByDept).map(([name, value]) => ({ name, value })),
        },
        alerts: {
          total: alertsData.data?.length || 0,
          resolved: (alertsData.data || []).filter((a: any) => a.status === 'resolved').length,
          byType: Object.entries(alertsByType).map(([name, value]) => ({ name, value })),
          byRisk: Object.entries(alertsByRisk).map(([name, value]) => ({ name, value })),
        },
        contracts: {
          total: contractsData.data?.length || 0,
          totalValue: totalContractValue,
          byStatus: Object.entries(contractsByStatus).map(([name, data]) => ({ name, value: (data as any).count })),
        },
        suppliers: {
          total: suppliersData.data?.length || 0,
          verified: (suppliersData.data || []).filter((s: any) => s.is_verified).length,
        },
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `R${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `R${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R${(value / 1000).toFixed(0)}K`;
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(value);
  };

  async function saveAuditReport(e: React.FormEvent) {
    e.preventDefault();
    setReportError('');
    if (!reportForm.title.trim() || !reportForm.findings.trim() || !reportForm.recommendations.trim()) {
      setReportError('Complete the title, findings, and recommendations before saving.');
      return;
    }
    const reference = `AUD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const { error } = await supabase.from('audit_reports').insert({
      report_reference: reference,
      title: reportForm.title.trim(),
      report_type: reportForm.report_type,
      risk_level: reportForm.risk_level,
      findings: reportForm.findings.trim(),
      recommendations: reportForm.recommendations.trim(),
      tender_id: reportForm.tender_id || null,
      created_by: user?.id,
      status: 'draft',
    });
    if (error) {
      console.error('Error saving audit report:', error);
      setReportError('The report could not be saved. Please try again.');
      return;
    }
    setShowReportForm(false);
    setReportForm({ title: '', report_type: 'procurement_review', risk_level: 'medium', findings: '', recommendations: '', tender_id: '' });
    fetchReportData();
  }

  const exportReport = (type: string) => {
    let csv = '';
    let filename = '';

    switch (type) {
      case 'risk':
        csv = 'Risk Alert Report\n\nMetric,Value\n';
        csv += `Total Alerts,${reportData.alerts.total}\n`;
        csv += `Resolved,${reportData.alerts.resolved}\n`;
        csv += `\nBy Risk Level\nLevel,Count\n`;
        reportData.alerts.byRisk.forEach(r => csv += `${r.name},${r.value}\n`);
        csv += `\nBy Detection Type\nType,Count\n`;
        reportData.alerts.byType.forEach(r => csv += `${r.name},${r.value}\n`);
        filename = 'risk-alert-report';
        break;
      case 'procurement':
        csv = 'Procurement Summary Report\n\nMetric,Value\n';
        csv += `Total Tenders,${reportData.tenders.total}\n`;
        csv += `Total Contracts,${reportData.contracts.total}\n`;
        csv += `Total Contract Value,${formatCurrency(reportData.contracts.totalValue)}\n`;
        csv += `Total Suppliers,${reportData.suppliers.total}\n`;
        csv += `Verified Suppliers,${reportData.suppliers.verified}\n`;
        filename = 'procurement-summary';
        break;
      case 'full':
        csv = 'Full Audit Report\n\n';
        csv += 'TENDERS\nTotal,Status Breakdown\n';
        reportData.tenders.byStatus.forEach(s => csv += `${s.name},${s.value}\n`);
        csv += '\nRISK ALERTS\nTotal,Resolved\n';
        csv += `${reportData.alerts.total},${reportData.alerts.resolved}\n`;
        csv += '\nCONTRACTS\nTotal,Value\n';
        csv += `${reportData.contracts.total},${formatCurrency(reportData.contracts.totalValue)}\n`;
        filename = 'full-audit-report';
        break;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Reports</h1>
          <p className="text-text-muted mt-1">Generate and export comprehensive audit reports</p>
        </div>
        <button onClick={() => setShowReportForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Audit Report</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <FileText className="w-6 h-6 text-primary mb-2" />
          <p className="text-2xl font-bold">{reportData.tenders.total}</p>
          <p className="text-sm text-text-muted">Total Tenders</p>
        </div>
        <div className="kpi-card">
          <AlertTriangle className="w-6 h-6 text-danger mb-2" />
          <p className="text-2xl font-bold">{reportData.alerts.total}</p>
          <p className="text-sm text-text-muted">Risk Alerts</p>
        </div>
        <div className="kpi-card">
          <DollarSign className="w-6 h-6 text-success mb-2" />
          <p className="text-2xl font-bold">{formatCurrency(reportData.contracts.totalValue)}</p>
          <p className="text-sm text-text-muted">Contract Value</p>
        </div>
        <div className="kpi-card">
          <Users className="w-6 h-6 text-secondary mb-2" />
          <p className="text-2xl font-bold">{reportData.suppliers.verified}</p>
          <p className="text-sm text-text-muted">Verified Suppliers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold">Alerts by Risk Level</h3>
          </div>
          <div className="card-body">
            {reportData.alerts.byRisk.length ? <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={reportData.alerts.byRisk}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {reportData.alerts.byRisk.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer> : <p className="py-20 text-center text-text-muted">No risk-alert data is available.</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tenders by Status</h3>
          </div>
          <div className="card-body">
            {reportData.tenders.byStatus.length ? <ResponsiveContainer width="100%" height={250}>
              <BarChart data={reportData.tenders.byStatus}>
                <CartesianGrid strokeDasharray="3 3"stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Bar dataKey="value" fill="#1E3A5F" />
              </BarChart>
            </ResponsiveContainer> : <p className="py-20 text-center text-text-muted">No tender data is available.</p>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="text-lg font-semibold">Saved Audit Reports</h3></div>
        <div className="table-container"><table className="table"><thead><tr><th>Reference</th><th>Title</th><th>Tender</th><th>Risk</th><th>Status</th><th>Created</th></tr></thead><tbody>
          {auditReports.length ? auditReports.map((report) => <tr key={report.id}><td className="font-medium">{report.report_reference}</td><td><p className="font-medium">{report.title}</p><p className="text-sm text-text-muted">{report.report_type}</p></td><td>{report.tender?.reference_number || 'General review'}</td><td><span className="badge badge-warning">{report.risk_level}</span></td><td>{report.status}</td><td>{new Date(report.created_at).toLocaleDateString('en-ZA')}</td></tr>) : <tr><td colSpan={6} className="text-center py-8 text-text-muted">No audit reports have been saved yet.</td></tr>}
        </tbody></table></div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Export Reports</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => exportReport('risk')} className="btn btn-outline flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-danger" />
              Risk Alert Report
            </button>
            <button onClick={() => exportReport('procurement')} className="btn btn-outline flex items-center justify-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Procurement Summary
            </button>
            <button onClick={() => exportReport('full')} className="btn btn-primary flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Full Audit Report
            </button>
          </div>
        </div>
      </div>

      {showReportForm && (
        <div className="modal-backdrop" onClick={() => setShowReportForm(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header"><h3 className="text-lg font-semibold">New Audit Report</h3></div>
            <form onSubmit={saveAuditReport}>
              <div className="modal-body space-y-4">
                {reportError && <div className="alert-danger">{reportError}</div>}
                <input className="input" placeholder="Report title" value={reportForm.title} onChange={(event) => setReportForm({ ...reportForm, title: event.target.value })} required />
                <select className="select" value={reportForm.report_type} onChange={(event) => setReportForm({ ...reportForm, report_type: event.target.value })}><option value="procurement_review">Procurement review</option><option value="risk_investigation">Risk investigation</option><option value="compliance_review">Compliance review</option></select>
                <select className="select" value={reportForm.risk_level} onChange={(event) => setReportForm({ ...reportForm, risk_level: event.target.value })}><option value="low">Low risk</option><option value="medium">Medium risk</option><option value="high">High risk</option><option value="critical">Critical risk</option></select>
                <textarea className="input" rows={4} placeholder="Findings" value={reportForm.findings} onChange={(event) => setReportForm({ ...reportForm, findings: event.target.value })} required />
                <textarea className="input" rows={4} placeholder="Recommendations" value={reportForm.recommendations} onChange={(event) => setReportForm({ ...reportForm, recommendations: event.target.value })} required />
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={() => setShowReportForm(false)}>Cancel</button><button type="submit" className="btn-primary"><Save className="w-4 h-4" /> Save Report</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
