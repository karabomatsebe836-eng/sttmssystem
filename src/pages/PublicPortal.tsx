import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  FileText,
  DollarSign,
  Building2,
  CheckCircle,
  TrendingUp,
  Award,
  MapPin,
  Calendar,
  Users,
  Eye,
  Shield,
  AlertTriangle,
  Search,
  Filter,
} from 'lucide-react';

export function PublicPortalHome() {
  const [stats, setStats] = useState({
    total_tenders: 0,
    awarded_contracts: 0,
    total_spending: 0,
    active_projects: 0,
  });
  const [recentTenders, setRecentTenders] = useState<any[]>([]);
  const [recentContracts, setRecentContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const [
        tendersCount,
        contractsCount,
        tendersValue,
        contractsData,
        activeProjects,
        tenders,
        contracts,
      ] = await Promise.all([
        supabase.from('tenders').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('contract_awards').select('id', { count: 'exact', head: true }),
        supabase.from('tenders').select('estimated_value').eq('status', 'published'),
        supabase.from('contract_awards').select('contract_value'),
        supabase.from('project_monitoring').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('tenders').select(`
          id, reference_number, title, estimated_value, closing_date,
          department:departments (name)
        `).eq('status', 'published').order('publication_date', { ascending: false }).limit(5),
        supabase.from('contract_awards').select(`
          id, contract_number, contract_title, contract_value, contract_start_date,
          supplier:suppliers (company_name),
          department:departments (name)
        `).eq('status', 'active').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalSpending = (contractsData.data || []).reduce(
        (sum, c) => sum + Number(c.contract_value || 0),
        0
      );

      setStats({
        total_tenders: tendersCount.count || 0,
        awarded_contracts: contractsCount.count || 0,
        total_spending: totalSpending,
        active_projects: activeProjects.count || 0,
      });

      setRecentTenders(tenders.data || []);
      setRecentContracts(contracts.data || []);
    } catch (error) {
      console.error('Error fetching public data:', error);
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

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-text-primary mb-4">
          Government Procurement Transparency Portal
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          Access information about public tenders, contracts, and project progress.
          South Africa's commitment to open and accountable procurement.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card bg-primary text-white">
          <div className="flex items-center gap-4">
            <FileText className="w-10 h-10 opacity-80" />
            <div>
              <p className="text-white/80">Open Tenders</p>
              <p className="text-3xl font-bold">{stats.total_tenders}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card bg-secondary text-white">
          <div className="flex items-center gap-4">
            <Award className="w-10 h-10 opacity-80" />
            <div>
              <p className="text-white/80">Awarded Contracts</p>
              <p className="text-3xl font-bold">{stats.awarded_contracts}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card bg-success text-white">
          <div className="flex items-center gap-4">
            <DollarSign className="w-10 h-10 opacity-80" />
            <div>
              <p className="text-white/80">Total Spending</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.total_spending)}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card bg-warning text-white">
          <div className="flex items-center gap-4">
            <Eye className="w-10 h-10 opacity-80" />
            <div>
              <p className="text-white/80">Active Projects</p>
              <p className="text-3xl font-bold">{stats.active_projects}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Tenders</h3>
            <Link to="/public/tenders" className="text-sm text-secondary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentTenders.map((tender) => (
              <Link
                key={tender.id}
                to={`/public/tenders/${tender.id}`}
                className="block px-6 py-4 hover:bg-surface/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tender.title}</p>
                    <p className="text-sm text-text-muted">
                      {tender.department?.name} | {tender.reference_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(tender.estimated_value)}</p>
                    <p className="text-sm text-text-muted">Closes: {new Date(tender.closing_date).toLocaleDateString('en-ZA')}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Contract Awards</h3>
            <Link to="/public/contracts" className="text-sm text-secondary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentContracts.map((contract) => (
              <div key={contract.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{contract.contract_title}</p>
                    <p className="text-sm text-text-muted">
                      {contract.supplier?.company_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-success">{formatCurrency(contract.contract_value)}</p>
                    <p className="text-sm text-text-muted">{contract.department?.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Report Corruption</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-danger/5 border border-danger/20 rounded-xl">
              <Shield className="w-10 h-10 text-danger mb-4" />
              <h4 className="font-semibold mb-2">Whistleblower Report</h4>
              <p className="text-sm text-text-muted mb-4">
                Submit an anonymous report about corruption, fraud, or unethical conduct.
                Your identity will be protected.
              </p>
              <Link to="/public/whistleblower" className="btn btn-danger">
                Submit Anonymous Report
              </Link>
            </div>
            <div className="p-6 bg-warning/5 border border-warning/20 rounded-xl">
              <AlertTriangle className="w-10 h-10 text-warning mb-4" />
              <h4 className="font-semibold mb-2">Public Complaint</h4>
              <p className="text-sm text-text-muted mb-4">
                Submit a complaint or concern about a specific tender, contract, or procurement process.
              </p>
              <Link to="/public/complaint" className="btn btn-warning">
                Submit Complaint
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicTendersPage() {
  const location = useLocation();
  const isSupplierView = location.pathname.startsWith('/supplier/');
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchTenders();
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    const { data } = await supabase.from('departments').select('*').eq('is_active', true);
    setDepartments(data || []);
  }

  async function fetchTenders() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenders')
        .select(`
          id, reference_number, title, description, estimated_value, closing_date,
          publication_date, tender_type, delivery_province,
          department:departments (name),
          category:procurement_categories (name)
        `)
        .eq('status', 'published')
        .order('publication_date', { ascending: false });

      if (error) throw error;
      setTenders(data || []);
    } catch (error) {
      console.error('Error fetching tenders:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTenders = tenders.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.reference_number.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || t.department?.name === deptFilter;
    return matchesSearch && matchesDept;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isSupplierView ? 'Available Tenders' : 'Published Tenders'}</h1>
        <p className="text-text-muted mt-1">
          {isSupplierView ? 'Select a tender to complete and submit your application' : 'Browse all open government tenders'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Search tenders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="select w-full sm:w-48"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4">
        {filteredTenders.map((tender) => (
          <Link
            key={tender.id}
            to={`${isSupplierView ? '/supplier/tenders' : '/public/tenders'}/${tender.id}`}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-primary">{tender.reference_number}</span>
                    <span className="badge badge-secondary">{tender.tender_type}</span>
                  </div>
                  <h3 className="text-lg font-semibold">{tender.title}</h3>
                  <p className="text-sm text-text-muted mt-1 line-clamp-2">{tender.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {tender.department?.name}
                    </span>
                    {tender.delivery_province && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {tender.delivery_province}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-6">
                  <p className="text-xl font-bold">{formatCurrency(tender.estimated_value)}</p>
                  <p className="text-sm text-text-muted mt-1">
                    Closes: {new Date(tender.closing_date).toLocaleDateString('en-ZA')}
                  </p>
                  {isSupplierView && (
                    <span className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-3">
                      View application page
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PublicContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchContracts();
  }, []);

  async function fetchContracts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contract_awards')
        .select(`
          id, contract_number, contract_title, contract_value,
          contract_start_date, contract_end_date, status,
          supplier:suppliers (company_name, contact_person, bbbee_level),
          tender:tenders (reference_number),
          department:departments (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredContracts = contracts.filter((c) => {
    return c.contract_title.toLowerCase().includes(search.toLowerCase()) ||
      c.contract_number.toLowerCase().includes(search.toLowerCase()) ||
      c.supplier?.company_name?.toLowerCase().includes(search.toLowerCase());
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalValue = filteredContracts.reduce((sum, c) => sum + (c.contract_value || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Awarded Contracts</h1>
        <p className="text-text-muted mt-1">View all government contract awards</p>
      </div>

      <div className="kpi-card bg-primary text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80">Total Contract Value</p>
            <p className="text-3xl font-bold">{formatCurrency(totalValue)}</p>
          </div>
          <div className="text-right">
            <p className="text-white/80">Total Contracts</p>
            <p className="text-3xl font-bold">{contracts.length}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          placeholder="Search contracts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Contract</th>
              <th>Supplier</th>
              <th>Department</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map((contract) => (
              <tr key={contract.id}>
                <td>
                  <div>
                    <p className="font-medium">{contract.contract_number}</p>
                    <p className="text-sm text-text-muted">{contract.contract_title}</p>
                  </div>
                </td>
                <td>
                  <div>
                    <p className="font-medium">{contract.supplier?.company_name}</p>
                    {contract.supplier?.bbbee_level && (
                      <p className="text-sm text-text-muted">B-BBEE Level {contract.supplier.bbbee_level}</p>
                    )}
                  </div>
                </td>
                <td>{contract.department?.name}</td>
                <td className="font-medium">{formatCurrency(contract.contract_value)}</td>
                <td>
                  <span className={`badge ${
                    contract.status === 'active' ? 'badge-success' :
                    contract.status === 'completed' ? 'badge-primary' :
                    'badge-secondary'
                  }`}>
                    {contract.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PublicProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_monitoring')
        .select(`
          id, project_name, budget_allocated, budget_spent,
          completion_percentage, status, project_province,
          contract:contract_awards (
            supplier:suppliers (company_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Project Progress</h1>
        <p className="text-text-muted mt-1">Track government project implementation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-text-muted">{project.contract?.supplier?.company_name}</p>
                  <h3 className="font-semibold">{project.project_name}</h3>
                </div>
                <span className={`badge ${
                  project.status === 'completed' ? 'badge-success' :
                  project.status === 'in_progress' ? 'badge-primary' :
                  project.status === 'delayed' ? 'badge-danger' :
                  'badge-secondary'
                }`}>
                  {project.status}
                </span>
              </div>

              <div className="progress-bar mb-2">
                <div
                  className={`progress-fill ${
                    project.completion_percentage >= 80 ? 'bg-success' :
                    project.completion_percentage >= 50 ? 'bg-primary' : 'bg-warning'
                  }`}
                  style={{ width: `${project.completion_percentage}%` }}
                />
              </div>
              <p className="text-sm text-text-muted mb-4">{project.completion_percentage}% Complete</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-muted">Budget</p>
                  <p className="font-medium">{formatCurrency(project.budget_allocated)}</p>
                </div>
                <div>
                  <p className="text-text-muted">Spent</p>
                  <p className={`font-medium ${
                    project.budget_spent > project.budget_allocated ? 'text-danger' : ''
                  }`}>
                    {formatCurrency(project.budget_spent)}
                  </p>
                </div>
                {project.project_province && (
                  <div>
                    <p className="text-text-muted">Province</p>
                    <p className="font-medium">{project.project_province}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
