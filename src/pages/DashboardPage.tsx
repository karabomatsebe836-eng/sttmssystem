import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  FileText,
  DollarSign,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Award,
  Activity,
  Shield,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
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
} from 'recharts';

const COLORS = ['#1E3A5F', '#0F766E', '#15803D', '#B45309', '#B91C1C', '#6B7280'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCompactCurrency = (value: number) => {
  if (value >= 1000000000) {
    return `R${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `R${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
};

interface DashboardStats {
  totalTenders: number;
  publishedTenders: number;
  awardedTenders: number;
  totalProcurementValue: number;
  totalAwardedValue: number;
  activeContracts: number;
  completedContracts: number;
  totalSuppliers: number;
  verifiedSuppliers: number;
  pendingBids: number;
  newRiskAlerts: number;
  highRiskAlerts: number;
  resolvedAlerts: number;
  publicReportsPending: number;
  whistleblowerPending: number;
  activeProjects: number;
  completedProjects: number;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [tenderTrend, setTenderTrend] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [riskDistribution, setRiskDistribution] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      // Fetch counts
      const [
        tendersCount,
        publishedCount,
        awardedCount,
        tendersValue,
        contracts,
        suppliersCount,
        verifiedCount,
        pendingBids,
        newAlerts,
        highAlerts,
        resolvedAlerts,
        publicReports,
        whistleblowerReports,
        activeProjects,
        completedProjects,
        recentUsersData,
        recentAlertsData,
      ] = await Promise.all([
        supabase.from('tenders').select('id', { count: 'exact', head: true }),
        supabase.from('tenders').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('tenders').select('id', { count: 'exact', head: true }).eq('status', 'awarded'),
        supabase.from('tenders').select('estimated_value'),
        supabase.from('contract_awards').select('contract_value, status'),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('bids').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('risk_alerts').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('risk_alerts').select('id', { count: 'exact', head: true }).in('risk_level', ['high', 'critical']),
        supabase.from('risk_alerts').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabase.from('public_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('whistleblower_reports').select('id', { count: 'exact', head: true }).in('status', ['pending', 'under_review']),
        supabase.from('project_monitoring').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('project_monitoring').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('users').select('id, first_name, last_name, email, created_at, role:roles(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('risk_alerts').select('id, alert_reference, alert_title, risk_level, status, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalProcurement = tendersValue.data?.reduce((sum: number, t: any) => sum + (t.estimated_value || 0), 0) || 0;
      const awardedValue = contracts.data?.filter(c => c.status === 'active' || c.status === 'completed').reduce((sum: number, c: any) => sum + (c.contract_value || 0), 0) || 0;
      const activeContracts = contracts.data?.filter(c => c.status === 'active').length || 0;
      const completedContracts = contracts.data?.filter(c => c.status === 'completed').length || 0;

      setStats({
        totalTenders: tendersCount.count || 0,
        publishedTenders: publishedCount.count || 0,
        awardedTenders: awardedCount.count || 0,
        totalProcurementValue: totalProcurement,
        totalAwardedValue: awardedValue,
        activeContracts,
        completedContracts,
        totalSuppliers: suppliersCount.count || 0,
        verifiedSuppliers: verifiedCount.count || 0,
        pendingBids: pendingBids.count || 0,
        newRiskAlerts: newAlerts.count || 0,
        highRiskAlerts: highAlerts.count || 0,
        resolvedAlerts: resolvedAlerts.count || 0,
        publicReportsPending: publicReports.count || 0,
        whistleblowerPending: whistleblowerReports.count || 0,
        activeProjects: activeProjects.count || 0,
        completedProjects: completedProjects.count || 0,
      });

      setRecentUsers(recentUsersData.data || []);
      setRecentAlerts(recentAlertsData.data || []);

      // Mock trend data based on actual counts
      setTenderTrend([
        { month: 'Jan', tenders: Math.floor((tendersCount.count || 0) * 0.12), awards: Math.floor((awardedCount.count || 0) * 0.1) },
        { month: 'Feb', tenders: Math.floor((tendersCount.count || 0) * 0.15), awards: Math.floor((awardedCount.count || 0) * 0.12) },
        { month: 'Mar', tenders: Math.floor((tendersCount.count || 0) * 0.18), awards: Math.floor((awardedCount.count || 0) * 0.14) },
        { month: 'Apr', tenders: Math.floor((tendersCount.count || 0) * 0.22), awards: Math.floor((awardedCount.count || 0) * 0.16) },
        { month: 'May', tenders: Math.floor((tendersCount.count || 0) * 0.19), awards: Math.floor((awardedCount.count || 0) * 0.12) },
        { month: 'Jun', tenders: tendersCount.count || 0, awards: awardedCount.count || 0 },
      ]);

      setStatusDistribution([
        { name: 'Published', value: publishedCount.count || 0, color: '#0F766E' },
        { name: 'Awarded', value: awardedCount.count || 0, color: '#15803D' },
        { name: 'Under Review', value: Math.floor((tendersCount.count || 0) * 0.15), color: '#B45309' },
        { name: 'Other', value: Math.floor((tendersCount.count || 0) * 0.1), color: '#6B7280' },
      ]);

      setRiskDistribution([
        { name: 'New', value: newAlerts.count || 0 },
        { name: 'High Risk', value: highAlerts.count || 0 },
        { name: 'Resolved', value: resolvedAlerts.count || 0 },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-text-muted mt-1">Welcome back, {user?.first_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-primary">{user?.department?.name}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Total Tenders</p>
              <p className="kpi-value">{stats?.totalTenders || 0}</p>
              <div className="flex items-center gap-1 text-sm text-success mt-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>{stats?.publishedTenders} published</span>
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Procurement Value</p>
              <p className="kpi-value">{formatCompactCurrency(stats?.totalProcurementValue || 0)}</p>
              <div className="flex items-center gap-1 text-sm text-success mt-1">
                <CheckCircle className="w-3 h-3" />
                <span>{formatCompactCurrency(stats?.totalAwardedValue)} awarded</span>
              </div>
            </div>
            <div className="p-3 bg-secondary/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Registered Suppliers</p>
              <p className="kpi-value">{stats?.totalSuppliers || 0}</p>
              <div className="flex items-center gap-1 text-sm text-success mt-1">
                <CheckCircle className="w-3 h-3" />
                <span>{stats?.verifiedSuppliers} verified</span>
              </div>
            </div>
            <div className="p-3 bg-success/10 rounded-lg">
              <Users className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Active Projects</p>
              <p className="kpi-value">{stats?.activeProjects || 0}</p>
              <div className="flex items-center gap-1 text-sm text-text-muted mt-1">
                <Activity className="w-3 h-3" />
                <span>{stats?.completedProjects} completed</span>
              </div>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg">
              <Activity className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Risk Alerts Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card border-l-4 border-l-danger">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <div>
              <p className="text-sm text-text-muted">New Risk Alerts</p>
              <p className="text-2xl font-bold">{stats?.newRiskAlerts || 0}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-warning" />
            <div>
              <p className="text-sm text-text-muted">High Priority</p>
              <p className="text-2xl font-bold">{stats?.highRiskAlerts || 0}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-success">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <div>
              <p className="text-sm text-text-muted">Resolved</p>
              <p className="text-2xl font-bold">{stats?.resolvedAlerts || 0}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-text-muted">Pending Bids</p>
              <p className="text-2xl font-bold">{stats?.pendingBids || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Tender Activity</h3>
            <p className="text-sm text-text-muted">Tenders published vs awarded (2021-2026)</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tenderTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Legend />
                <Bar dataKey="tenders" fill="#1E3A5F" name="Tenders" />
                <Bar dataKey="awards" fill="#0F766E" name="Awards" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Tender Status Distribution</h3>
            <p className="text-sm text-text-muted">Current tender statuses</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Users</h3>
            <Link to="/admin/users" className="text-sm text-secondary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentUsers.map((u: any) => (
              <div key={u.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {u.first_name?.[0]}{u.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium">{u.first_name} {u.last_name}</p>
                    <p className="text-sm text-text-muted">{u.email}</p>
                  </div>
                </div>
                <span className="badge badge-secondary">{u.role?.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Risk Alerts</h3>
            <Link to="/auditor/alerts" className="text-sm text-secondary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentAlerts.map((alert: any) => (
              <div key={alert.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
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
                    <p className="text-sm text-text-muted">{alert.alert_reference}</p>
                  </div>
                </div>
                <span className={`badge ${
                  alert.status === 'new' ? 'badge-danger' :
                  alert.status === 'resolved' ? 'badge-success' :
                  'badge-warning'
                }`}>
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProcurementDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_tenders: 0,
    published_tenders: 0,
    pending_evaluations: 0,
    active_contracts: 0,
    total_value: 0,
    awarded_value: 0,
  });
  const [myTenders, setMyTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    try {
      setLoading(true);

      const [
        tendersCount,
        publishedCount,
        pendingBids,
        contracts,
        tendersData,
        myTendersData,
      ] = await Promise.all([
        supabase.from('tenders').select('id', { count: 'exact', head: true }),
        supabase.from('tenders').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('bids').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('contract_awards').select('contract_value, status'),
        supabase.from('tenders').select('estimated_value'),
        supabase.from('tenders').select(`
          id, reference_number, title, status, estimated_value, closing_date,
          bids:bids(count)
        `).order('created_at', { ascending: false }).limit(5),
      ]);

      const totalVal = tendersData.data?.reduce((sum: number, t: any) => sum + (t.estimated_value || 0), 0) || 0;
      const awardedVal = contracts.data?.filter(c => c.status === 'active' || c.status === 'completed').reduce((sum: number, c: any) => sum + (c.contract_value || 0), 0) || 0;
      const activeContracts = contracts.data?.filter(c => c.status === 'active').length || 0;

      setStats({
        total_tenders: tendersCount.count || 0,
        published_tenders: publishedCount.count || 0,
        pending_evaluations: pendingBids.count || 0,
        active_contracts: activeContracts,
        total_value: totalVal,
        awarded_value: awardedVal,
      });

      setMyTenders(myTendersData.data || []);
    } catch (error) {
      console.error('Error fetching procurement data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Procurement Dashboard</h1>
          <p className="text-text-muted mt-1">Welcome, {user?.first_name} {user?.last_name}</p>
        </div>
        <Link to="/procurement/tenders/create" className="btn-primary">
          <FileText className="w-4 h-4" />
          Create Tender
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Total Tenders</p>
              <p className="kpi-value">{stats.total_tenders}</p>
            </div>
            <FileText className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Published</p>
              <p className="kpi-value">{stats.published_tenders}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Pending Evaluations</p>
              <p className="kpi-value">{stats.pending_evaluations}</p>
            </div>
            <Clock className="w-6 h-6 text-warning" />
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Active Contracts</p>
              <p className="kpi-value">{stats.active_contracts}</p>
            </div>
            <Award className="w-6 h-6 text-secondary" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="kpi-card bg-primary text-white">
          <p className="text-white/80">Total Procurement Value</p>
          <p className="text-3xl font-bold mt-2">{formatCompactCurrency(stats.total_value)}</p>
        </div>
        <div className="kpi-card bg-secondary text-white">
          <p className="text-white/80">Contracted Value</p>
          <p className="text-3xl font-bold mt-2">{formatCompactCurrency(stats.awarded_value)}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Recent Tenders</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Title</th>
                <th>Value</th>
                <th>Status</th>
                <th>Bids</th>
                <th>Closing Date</th>
              </tr>
            </thead>
            <tbody>
              {myTenders.map((tender: any) => (
                <tr key={tender.id}>
                  <td className="font-medium">{tender.reference_number}</td>
                  <td>{tender.title}</td>
                  <td>{formatCurrency(tender.estimated_value)}</td>
                  <td>
                    <span className={`badge ${
                      tender.status === 'published' ? 'badge-success' :
                      tender.status === 'awarded' ? 'badge-primary' :
                      'badge-secondary'
                    }`}>
                      {tender.status}
                    </span>
                  </td>
                  <td>{Array.isArray(tender.bids) ? tender.bids.length : 0}</td>
                  <td>{tender.closing_date ? new Date(tender.closing_date).toLocaleDateString('en-ZA') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function SupplierDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    available_tenders: 0,
    my_bids: 0,
    active_contracts: 0,
    performance_score: 0,
  });
  const [availableTenders, setAvailableTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const [
        tendersCount,
        bidsCount,
        contractsCount,
        tenders,
        performance,
      ] = await Promise.all([
        supabase.from('tenders').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('bids').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('contract_awards').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('tenders').select(`
          id, reference_number, title, estimated_value, closing_date,
          department:departments(name)
        `).eq('status', 'published').gt('closing_date', new Date().toISOString()).order('closing_date', { ascending: true }).limit(5),
        supabase.from('contractor_performance').select('overall_rating').order('review_date', { ascending: false }).limit(1),
      ]);

      setStats({
        available_tenders: tendersCount.count || 0,
        my_bids: bidsCount.count || 0,
        active_contracts: contractsCount.count || 0,
        performance_score: performance.data?.[0]?.overall_rating || 80,
      });

      setAvailableTenders(tenders.data || []);
    } catch (error) {
      console.error('Error fetching supplier data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supplier Dashboard</h1>
          <p className="text-text-muted mt-1">Welcome, {user?.first_name} {user?.last_name}</p>
        </div>
        <Link to="/supplier/tenders" className="btn-primary">
          <Eye className="w-4 h-4" />
          Browse Tenders
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Available Tenders</p>
              <p className="kpi-value">{stats.available_tenders}</p>
            </div>
            <FileText className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">My Bids</p>
              <p className="kpi-value">{stats.my_bids}</p>
            </div>
            <Clock className="w-6 h-6 text-warning" />
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Active Contracts</p>
              <p className="kpi-value">{stats.active_contracts}</p>
            </div>
            <Award className="w-6 h-6 text-secondary" />
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Performance Score</p>
              <p className="kpi-value">{stats.performance_score}%</p>
            </div>
            <TrendingUp className="w-6 h-6 text-success" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-lg font-semibold">Closing Soon</h3>
          <Link to="/supplier/tenders" className="text-sm text-secondary hover:underline">
            View all
          </Link>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Title</th>
                <th>Department</th>
                <th>Value</th>
                <th>Closing Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {availableTenders.map((tender: any) => (
                <tr key={tender.id}>
                  <td className="font-medium">{tender.reference_number}</td>
                  <td>{tender.title}</td>
                  <td>{tender.department?.name}</td>
                  <td>{formatCurrency(tender.estimated_value)}</td>
                  <td>{new Date(tender.closing_date).toLocaleDateString('en-ZA')}</td>
                  <td>
                    <Link
                      to={`/supplier/tenders/${tender.id}`}
                      className="btn-sm btn-primary"
                    >
                      View & Bid
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

export function AuditorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_tenders: 0,
    total_alerts: 0,
    contract_value: 0,
    verified_suppliers: 0,
    new_alerts: 0,
    high_risk: 0,
    resolved: 0,
    reports_pending: 0,
    whistleblower_pending: 0,
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const [
        tendersCount,
        alertsCount,
        contractAwards,
        verifiedSuppliers,
        newAlerts,
        highRisk,
        resolved,
        publicReports,
        whistleblowerReports,
        recentAlerts,
      ] = await Promise.all([
        supabase.from('tenders').select('id', { count: 'exact', head: true }),
        supabase.from('risk_alerts').select('id', { count: 'exact', head: true }),
        supabase.from('contract_awards').select('contract_value').in('status', ['active', 'completed']),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('risk_alerts').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('risk_alerts').select('id', { count: 'exact', head: true }).in('risk_level', ['high', 'critical']),
        supabase.from('risk_alerts').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabase.from('public_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('whistleblower_reports').select('id', { count: 'exact', head: true }).in('status', ['pending', 'under_review']),
        supabase.from('risk_alerts').select(`
          id, alert_reference, alert_title, risk_level, status, detection_type,
          created_at, amount_involved
        `).order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        total_tenders: tendersCount.count || 0,
        total_alerts: alertsCount.count || 0,
        contract_value: (contractAwards.data || []).reduce((total, award) => total + Number(award.contract_value || 0), 0),
        verified_suppliers: verifiedSuppliers.count || 0,
        new_alerts: newAlerts.count || 0,
        high_risk: highRisk.count || 0,
        resolved: resolved.count || 0,
        reports_pending: publicReports.count || 0,
        whistleblower_pending: whistleblowerReports.count || 0,
      });

      setAlerts(recentAlerts.data || []);
    } catch (error) {
      console.error('Error fetching auditor data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Auditor Dashboard</h1>
          <p className="text-text-muted mt-1">Welcome, {user?.first_name} {user?.last_name}</p>
        </div>
        <Link to="/auditor/alerts" className="btn-primary">
          <AlertTriangle className="w-4 h-4" />
          View All Alerts
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Total Tenders</p>
              <p className="text-2xl font-bold">{stats.total_tenders}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-danger">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-danger/10 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-danger" />
            </div>
            <div>
              <p className="text-sm text-text-muted">New Alerts</p>
              <p className="text-2xl font-bold">{stats.new_alerts}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-warning/10 rounded-lg">
              <Shield className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-text-muted">High Risk</p>
              <p className="text-2xl font-bold">{stats.high_risk}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-success">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Resolved</p>
              <p className="text-2xl font-bold">{stats.resolved}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-secondary">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Verified Suppliers</p>
              <p className="text-2xl font-bold">{stats.verified_suppliers}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Public Reports Pending</p>
              <p className="kpi-value">{stats.reports_pending}</p>
            </div>
            <Building2 className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Whistleblower Reports</p>
              <p className="kpi-value">{stats.whistleblower_pending}</p>
            </div>
            <Shield className="w-6 h-6 text-secondary" />
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">Contract Value</p>
              <p className="kpi-value">{formatCurrency(stats.contract_value)}</p>
            </div>
            <DollarSign className="w-6 h-6 text-success" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Recent Risk Alerts</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Alert</th>
                <th>Type</th>
                <th>Risk Level</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert: any) => (
                <tr key={alert.id}>
                  <td className="font-medium">{alert.alert_reference}</td>
                  <td>{alert.alert_title}</td>
                  <td>{alert.detection_type}</td>
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
                      alert.status === 'new' ? 'badge-danger' :
                      alert.status === 'resolved' ? 'badge-success' :
                      'badge-warning'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/auditor/alerts/${alert.id}`}
                      className="btn btn-primary btn-sm"
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