import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  ClipboardCheck,
  Award,
  BarChart3,
  AlertTriangle,
  Shield,
  Eye,
  Megaphone,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  User,
  Activity,
  FileBarChart,
  FlaskConical,
  Scale,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
}

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'User Management', path: '/admin/users', icon: Users, roles: ['admin'] },
  { name: 'Departments', path: '/admin/departments', icon: Building2, roles: ['admin'] },
  { name: 'System Settings', path: '/admin/settings', icon: Settings, roles: ['admin'] },
];

const procurementNavItems: NavItem[] = [
  { name: 'Procurement Dashboard', path: '/procurement', icon: LayoutDashboard },
  { name: 'Tenders', path: '/procurement/tenders', icon: FileText },
  { name: 'Create Tender', path: '/procurement/tenders/create', icon: ClipboardCheck, roles: ['procurement_officer'] },
  { name: 'Evaluation Criteria', path: '/procurement/criteria', icon: Scale, roles: ['procurement_officer'] },
  { name: 'Bid Evaluation', path: '/procurement/evaluations', icon: FileBarChart, roles: ['procurement_officer'] },
  { name: 'Contract Awards', path: '/procurement/awards', icon: Award },
];

const supplierNavItems: NavItem[] = [
  { name: 'Supplier Dashboard', path: '/supplier', icon: LayoutDashboard },
  { name: 'Company Profile', path: '/supplier/profile', icon: Building2 },
  { name: 'Compliance Documents', path: '/supplier/documents', icon: Shield },
  { name: 'Available Tenders', path: '/supplier/tenders', icon: FileText },
  { name: 'My Bids', path: '/supplier/bids', icon: ClipboardCheck },
  { name: 'My Projects', path: '/supplier/projects', icon: Activity },
];

const auditorNavItems: NavItem[] = [
  { name: 'Auditor Dashboard', path: '/auditor', icon: LayoutDashboard, roles: ['auditor'] },
  { name: 'Audit Logs', path: '/auditor/logs', icon: Activity, roles: ['auditor'] },
  { name: 'Risk Alerts', path: '/auditor/alerts', icon: AlertTriangle, roles: ['auditor'] },
  { name: 'Investigations', path: '/auditor/investigations', icon: Shield, roles: ['auditor'] },
  { name: 'Reports', path: '/auditor/reports', icon: FileBarChart, roles: ['auditor'] },
];

const projectNavItems: NavItem[] = [
  { name: 'Project Monitoring', path: '/projects', icon: Eye },
  { name: 'Contractor Performance', path: '/projects/performance', icon: BarChart3 },
];

const analyticsNavItems: NavItem[] = [
  { name: 'Analytics Dashboard', path: '/analytics', icon: BarChart3 },
  { name: 'AI Corruption Detection', path: '/analytics/corruption', icon: FlaskConical },
];

const publicNavItems: NavItem[] = [
  { name: 'Transparency Portal', path: '/public', icon: LayoutDashboard },
  { name: 'Published Tenders', path: '/public/tenders', icon: FileText },
  { name: 'Awarded Contracts', path: '/public/contracts', icon: Award },
  { name: 'Project Progress', path: '/public/projects', icon: Eye },
  { name: 'Submit Complaint', path: '/public/complaint', icon: Megaphone },
  { name: 'Whistleblower Report', path: '/public/whistleblower', icon: Shield },
];

export function Layout() {
  const { user, logout, isAdmin, isProcurementOfficer, isSupplier, isAuditor } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (isAdmin) return [...mainNavItems, ...procurementNavItems.filter((item) => item.path !== '/procurement'), ...auditorNavItems, ...projectNavItems, ...analyticsNavItems];
    if (isProcurementOfficer) return [...procurementNavItems, ...projectNavItems];
    if (isSupplier) return supplierNavItems;
    if (isAuditor) return [...auditorNavItems, ...projectNavItems];
    return publicNavItems;
  };

  const navItems = getNavItems();

  const filteredItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role?.name || '')
  );

  return (
    <div className="min-h-screen bg-surface">
      <div className="sidebar no-print">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-white/10">
          <div className="bg-white rounded-lg px-2 py-1 flex items-center justify-center">
            <img src="/sttms-logo.svg" alt="STTMS" className="h-8 w-auto" />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-white/60 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      <div className="ml-64">
        <header className="sticky top-0 z-30 bg-white border-b border-border shadow-sm no-print">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-surface rounded-lg lg:hidden"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-lg px-2 py-1 flex items-center justify-center">
                  <img src="/sttms-logo.svg" alt="STTMS" className="h-8 w-auto" />
                </div>
                <h1 className="text-xl font-semibold text-primary">
                  Smart Tender Transparency and Monitoring System
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-surface rounded-lg">
                <Bell className="w-5 h-5 text-text-muted" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-surface rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <span className="text-sm font-medium hidden md:block">
                    {user?.first_name} {user?.last_name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                </button>

                {userMenuOpen && (
                  <div className="dropdown">
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="dropdown-item w-full text-left text-danger"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>

        <footer className="px-6 py-4 border-t border-border bg-white no-print">
          <div className="flex items-center justify-between text-sm text-text-muted">
            <p>Smart Tender Transparency and Monitoring System (STTMS) - Republic of South Africa</p>
            <p>Developed for Government Procurement Transparency</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 bg-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/public" className="flex items-center gap-3">
              <div className="bg-white rounded-lg px-2 py-1 flex items-center justify-center">
                <img src="/sttms-logo.svg" alt="STTMS" className="h-8 w-auto" />
              </div>
              <span className="text-[10px] text-white/60">Public Transparency Portal</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/public"
                className={`text-sm font-medium hover:text-white/80 ${
                  location.pathname === '/public' ? 'text-white' : 'text-white/60'
                }`}
              >
                Home
              </Link>
              <Link
                to="/public/tenders"
                className={`text-sm font-medium hover:text-white/80 ${
                  location.pathname.startsWith('/public/tenders') ? 'text-white' : 'text-white/60'
                }`}
              >
                Tenders
              </Link>
              <Link
                to="/public/contracts"
                className={`text-sm font-medium hover:text-white/80 ${
                  location.pathname.startsWith('/public/contracts') ? 'text-white' : 'text-white/60'
                }`}
              >
                Contracts
              </Link>
              <Link
                to="/public/projects"
                className={`text-sm font-medium hover:text-white/80 ${
                  location.pathname.startsWith('/public/projects') ? 'text-white' : 'text-white/60'
                }`}
              >
                Projects
              </Link>
              <Link
                to="/public/whistleblower"
                className="btn btn-sm bg-white text-primary hover:bg-white/90"
              >
                <Shield className="w-4 h-4" />
                Report Corruption
              </Link>
              <Link
                to="/login"
                className="btn btn-sm btn-outline border-white text-white hover:bg-white hover:text-primary"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-primary text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-4">About STTMS</h4>
              <p className="text-sm text-white/80">
                The Smart Tender Transparency and Monitoring System promotes accountability
                and transparency in government procurement across South Africa.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><Link to="/public/tenders" className="hover:text-white">View Tenders</Link></li>
                <li><Link to="/public/contracts" className="hover:text-white">Awarded Contracts</Link></li>
                <li><Link to="/public/projects" className="hover:text-white">Project Progress</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Report Concerns</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><Link to="/public/complaint" className="hover:text-white">Submit Complaint</Link></li>
                <li><Link to="/public/whistleblower" className="hover:text-white">Whistleblower Report</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>National Treasury</li>
                <li>240 Madiba Street</li>
                <li>Kimberley, 8303</li>
                <li>info@treasury.gov.za</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/60">
            <p>Republic of South Africa - National Treasury</p>
            <p className="mt-2">Promoting Transparency in Government Procurement</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
