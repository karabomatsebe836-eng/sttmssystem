import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { Layout, PublicLayout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import {
  AdminDashboard,
  ProcurementDashboard,
  SupplierDashboard,
  AuditorDashboard,
} from './pages/DashboardPage';
import { UserManagementPage, DepartmentManagementPage } from './pages/UserManagementPage';
import { TendersListPage, CreateTenderPage, TenderDetailPage, EditTenderPage } from './pages/TenderPages';
import { AuditLogsPage, RiskAlertsPage, AlertInvestigationPage } from './pages/AuditorPages';
import { InvestigationsPage, AuditorReportsPage } from './pages/AuditorReportsPages';
import { ProjectMonitoringPage, ProjectDetailPage, ContractorPerformancePage } from './pages/ProjectPages';
import { PublicPortalHome, PublicTendersPage, PublicContractsPage, PublicProjectsPage } from './pages/PublicPortal';
import { WhistleblowerReportPage, ReportTrackingPage, PublicComplaintPage } from './pages/WhistleblowerPages';
import { AICorruptionDashboard, AnalyticsDashboard } from './pages/AICorruptionDashboard';
import { SystemSettingsPage } from './pages/AdminSettingsPage';
import { EvaluationCriteriaPage, BidEvaluationDetailPage } from './pages/ProcurementPages';
import { SupplierBidSubmissionPage } from './pages/SupplierBidPages';
import { SupplierDocumentsPage } from './pages/SupplierDocumentsPage';
import { ProfilePage } from './pages/ProfilePage';

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role?.name || '')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role?.name) {
    case 'admin':
      return <AdminDashboard />;
    case 'procurement_officer':
      return <ProcurementDashboard />;
    case 'supplier':
      return <SupplierDashboard />;
    case 'auditor':
      return <AuditorDashboard />;
    default:
      return <Navigate to="/public" replace />;
  }
}

function BidEvaluationPage() {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBids();
  }, []);

  async function fetchBids() {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select(`
          id, bid_reference, bid_amount, total_score, status, submission_date,
          supplier:suppliers (company_name),
          tender:tenders (id, reference_number, title, estimated_value)
        `)
        .in('status', ['submitted', 'under_evaluation'])
        .order('submission_date', { ascending: false });

      if (error) throw error;
      setBids(data || []);
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(value);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bid Evaluation</h1>
        <p className="text-text-muted mt-1">Review and score submitted supplier bids</p>
      </div>
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Bid Reference</th>
                <th>Supplier</th>
                <th>Tender</th>
                <th>Bid Amount</th>
                <th>Status</th>
                <th>Score</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bids.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-text-muted">
                    No pending bids for evaluation
                  </td>
                </tr>
              ) : (
                bids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-surface">
                    <td className="font-medium">{bid.bid_reference}</td>
                    <td>{bid.supplier?.company_name || '-'}</td>
                    <td>
                      <div>
                        <p className="font-medium text-sm">{bid.tender?.reference_number}</p>
                        <p className="text-xs text-text-muted">{bid.tender?.title}</p>
                      </div>
                    </td>
                    <td className="font-medium">{formatCurrency(bid.bid_amount)}</td>
                    <td>
                      <span className={`badge ${
                        bid.status === 'under_evaluation' ? 'badge-warning' : 'badge-primary'
                      }`}>
                        {bid.status === 'under_evaluation' ? 'Under Evaluation' : 'Submitted'}
                      </span>
                    </td>
                    <td>{bid.total_score ? `${bid.total_score}%` : '-'}</td>
                    <td className="text-sm text-text-muted">
                      {bid.submission_date ? new Date(bid.submission_date).toLocaleDateString('en-ZA') : '-'}
                    </td>
                    <td>
                      <Link
                        to={`/procurement/evaluations/${bid.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Evaluate
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ContractAwardsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  async function fetchContracts() {
    try {
      const { data, error } = await supabase
        .from('contract_awards')
        .select(`
          id, contract_number, contract_title, contract_value, status,
          supplier:suppliers (company_name)
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(value);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Contract Awards</h1>
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Contract Number</th>
                <th>Title</th>
                <th>Supplier</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id}>
                  <td className="font-medium">{contract.contract_number}</td>
                  <td>{contract.contract_title}</td>
                  <td>{contract.supplier?.company_name}</td>
                  <td>{formatCurrency(contract.contract_value)}</td>
                  <td>
                    <span className={`badge ${contract.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                      {contract.status}
                    </span>
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

function SupplierProfilePage() {
  const { user } = useAuth();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchSupplier();
  }, [user]);

  async function fetchSupplier() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      if (error) throw error;
      setSupplier(data);
    } catch (error) {
      console.error('Error fetching supplier:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const docStatus = supplier?.document_verification_status || 'pending';
  const docStatusBadge =
    docStatus === 'verified' ? 'badge-success' :
    docStatus === 'corruption_flagged' ? 'badge-danger' :
    docStatus === 'rejected' ? 'badge-danger' : 'badge-warning';
  const docStatusLabel =
    docStatus === 'verified' ? 'Documents Verified' :
    docStatus === 'corruption_flagged' ? 'Corruption Flagged' :
    docStatus === 'rejected' ? 'Documents Rejected' : 'Awaiting Document Verification';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Company Profile</h1>

      {/* Document verification call-to-action */}
      <div className={`card border-l-4 ${supplier?.can_bid ? 'border-l-success' : docStatus === 'corruption_flagged' ? 'border-l-danger' : 'border-l-warning'}`}>
        <div className="card-body flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Compliance Document Status</p>
            <p className="text-sm text-text-muted mt-1">
              {supplier?.can_bid
                ? 'All documents verified. You are cleared to view and bid for tenders.'
                : docStatus === 'corruption_flagged'
                ? 'Your documents have been flagged for suspicious content. Bidding is blocked pending auditor review.'
                : 'Upload and verify your compliance documents to unlock bidding access.'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`badge ${docStatusBadge}`}>{docStatusLabel}</span>
            <Link to="/supplier/documents" className="btn-primary btn-sm whitespace-nowrap">
              Manage Documents
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Company Information</h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <p className="text-sm text-text-muted">Company Name</p>
              <p className="font-medium">{supplier?.company_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Registration Number</p>
              <p className="font-medium">{supplier?.company_registration_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Tax Number</p>
              <p className="font-medium">{supplier?.tax_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">B-BBEE Level</p>
              <p className="font-medium">{supplier?.bbbee_level ? `Level ${supplier.bbbee_level}` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">CIDB Rating</p>
              <p className="font-medium">{supplier?.cidb_rating || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">CIDB Registration Number</p>
              <p className="font-medium">{supplier?.cidb_registration_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Business Type</p>
              <p className="font-medium">{supplier?.business_type || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Years in Business</p>
              <p className="font-medium">{supplier?.years_in_business ? `${supplier.years_in_business} years` : '-'}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Contact Information</h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <p className="text-sm text-text-muted">Contact Person</p>
              <p className="font-medium">{supplier?.contact_person || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Email</p>
              <p className="font-medium">{supplier?.contact_email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Phone</p>
              <p className="font-medium">{supplier?.contact_phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Physical Address</p>
              <p className="font-medium">{supplier?.physical_address || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Bidding Access</p>
              <span className={`badge ${supplier?.can_bid ? 'badge-success' : 'badge-danger'}`}>
                {supplier?.can_bid ? 'Enabled — Documents Verified' : 'Blocked — Verification Required'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyBidsPage() {
  const { user } = useAuth();
  const [bids, setBids] = useState<any[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBids();
  }, [user]);

  async function fetchBids() {
    try {
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id, can_bid')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!supplierData) {
        setBids([]);
        setLoading(false);
        return;
      }

      if (supplierData.can_bid === false) {
        setBlocked(true);
        setBids([]);
        setLoading(false);
        return;
      }
      setBlocked(false);

      const { data, error } = await supabase
        .from('bids')
        .select(`
          id, bid_reference, bid_amount, total_score, status, submission_date,
          tender:tenders (reference_number, title)
        `)
        .eq('supplier_id', supplierData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBids(data || []);
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(value);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Bids</h1>
      {blocked ? (
        <div className="card border-l-4 border-l-warning">
          <div className="card-body">
            <p className="font-semibold">Bidding access is currently blocked.</p>
            <p className="text-sm text-text-muted mt-1">Your bid history will appear here after your required supplier documents are verified.</p>
            <Link to="/supplier/documents" className="btn-primary btn-sm mt-4 inline-flex">Review Supplier Documents</Link>
          </div>
        </div>
      ) : null}
      {!blocked && <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Tender</th>
                <th>Amount</th>
                <th>Score</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {bids.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-text-muted">
                    You haven't submitted any bids yet
                  </td>
                </tr>
              ) : (
                bids.map((bid) => (
                  <tr key={bid.id}>
                    <td className="font-medium">{bid.bid_reference}</td>
                    <td>{bid.tender?.title}</td>
                    <td>{formatCurrency(bid.bid_amount)}</td>
                    <td>{bid.total_score ? `${bid.total_score}%` : '-'}</td>
                    <td>
                      <span className={`badge ${
                        bid.status === 'awarded' ? 'badge-success' :
                        bid.status === 'submitted' ? 'badge-primary' :
                        bid.status === 'rejected' ? 'badge-danger' :
                        'badge-secondary'
                      }`}>
                        {bid.status}
                      </span>
                    </td>
                    <td>{bid.submission_date ? new Date(bid.submission_date).toLocaleDateString('en-ZA') : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>}
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/public" element={<PublicPortalHome />} />
        <Route path="/public/tenders" element={<PublicTendersPage />} />
        <Route path="/public/tenders/:id" element={<PublicTendersPage />} />
        <Route path="/public/contracts" element={<PublicContractsPage />} />
        <Route path="/public/projects" element={<PublicProjectsPage />} />
        <Route path="/public/complaint" element={<PublicComplaintPage />} />
        <Route path="/public/whistleblower" element={<WhistleblowerReportPage />} />
        <Route path="/public/track-report" element={<ReportTrackingPage />} />
      </Route>

      {/* Login & Register Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes */}
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Admin Routes */}
        <Route
          path="/admin/users"
          element={
            <PrivateRoute roles={['admin']}>
              <UserManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <PrivateRoute roles={['admin']}>
              <DepartmentManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PrivateRoute roles={['admin']}>
              <SystemSettingsPage />
            </PrivateRoute>
          }
        />

        {/* Procurement Routes */}
        <Route path="/procurement" element={<PrivateRoute roles={['admin', 'procurement_officer']}><ProcurementDashboard /></PrivateRoute>} />
        <Route path="/procurement/tenders" element={<PrivateRoute roles={['admin', 'procurement_officer']}><TendersListPage /></PrivateRoute>} />
        <Route path="/procurement/tenders/create" element={<PrivateRoute roles={['procurement_officer']}><CreateTenderPage /></PrivateRoute>} />
        <Route path="/procurement/tenders/:id" element={<PrivateRoute roles={['admin', 'procurement_officer']}><TenderDetailPage /></PrivateRoute>} />
        <Route path="/procurement/tenders/:id/edit" element={<PrivateRoute roles={['procurement_officer']}><EditTenderPage /></PrivateRoute>} />
        <Route path="/procurement/criteria" element={<PrivateRoute roles={['procurement_officer']}><EvaluationCriteriaPage /></PrivateRoute>} />
        <Route path="/procurement/evaluations" element={<PrivateRoute roles={['procurement_officer']}><BidEvaluationPage /></PrivateRoute>} />
        <Route path="/procurement/evaluations/:id" element={<PrivateRoute roles={['procurement_officer']}><BidEvaluationDetailPage /></PrivateRoute>} />
        <Route path="/procurement/awards" element={<PrivateRoute roles={['admin', 'procurement_officer']}><ContractAwardsPage /></PrivateRoute>} />

        {/* Supplier Routes */}
        <Route path="/supplier" element={<PrivateRoute roles={['supplier']}><SupplierDashboard /></PrivateRoute>} />
        <Route path="/supplier/profile" element={<PrivateRoute roles={['supplier']}><SupplierProfilePage /></PrivateRoute>} />
        <Route path="/supplier/documents" element={<PrivateRoute roles={['supplier']}><SupplierDocumentsPage /></PrivateRoute>} />
        <Route path="/supplier/tenders" element={<PrivateRoute roles={['supplier']}><PublicTendersPage /></PrivateRoute>} />
        <Route path="/supplier/tenders/:id" element={<PrivateRoute roles={['supplier']}><SupplierBidSubmissionPage /></PrivateRoute>} />
        <Route path="/supplier/bids" element={<PrivateRoute roles={['supplier']}><MyBidsPage /></PrivateRoute>} />

        {/* Auditor Routes */}
        <Route path="/auditor" element={<PrivateRoute roles={['auditor']}><AuditorDashboard /></PrivateRoute>} />
        <Route path="/auditor/logs" element={<PrivateRoute roles={['auditor']}><AuditLogsPage /></PrivateRoute>} />
        <Route path="/auditor/alerts" element={<PrivateRoute roles={['auditor']}><RiskAlertsPage /></PrivateRoute>} />
        <Route path="/auditor/alerts/:id" element={<PrivateRoute roles={['auditor']}><AlertInvestigationPage /></PrivateRoute>} />
        <Route path="/auditor/investigations" element={<PrivateRoute roles={['auditor']}><InvestigationsPage /></PrivateRoute>} />
        <Route path="/auditor/reports" element={<PrivateRoute roles={['auditor']}><AuditorReportsPage /></PrivateRoute>} />

        {/* Project Monitoring Routes */}
        <Route path="/projects" element={<ProjectMonitoringPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/performance" element={<ContractorPerformancePage />} />

        {/* Analytics Routes */}
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/analytics/corruption" element={<AICorruptionDashboard />} />
      </Route>

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/public" replace />} />
      <Route path="*" element={<Navigate to="/public" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
