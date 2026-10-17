import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { ProjectMonitoring, ProjectMilestone, ContractorPerformance } from '../types';
import {
  Eye,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  FileText,
  Edit2,
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
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';

export function ProjectMonitoringPage() {
  const [projects, setProjects] = useState<(ProjectMonitoring & {
    contract?: any;
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_monitoring')
        .select(`
          *,
          contract:contract_awards (
            contract_number,
            contract_title,
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

  const filteredProjects = projects.filter((p) => {
    return !statusFilter || p.status === statusFilter;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'in_progress': return 'badge-primary';
      case 'delayed': case 'at_risk': return 'badge-danger';
      case 'on_hold': return 'badge-warning';
      default: return 'badge-secondary';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-success';
    if (percentage >= 50) return 'bg-primary';
    if (percentage >= 25) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Monitoring</h1>
          <p className="text-text-muted mt-1">Track project progress and expenditure</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select w-40"
        >
          <option value="">All Status</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="delayed">Delayed</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm text-text-muted">Total Projects</p>
              <p className="text-2xl font-bold">{projects.length}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-secondary" />
            <div>
              <p className="text-sm text-text-muted">In Progress</p>
              <p className="text-2xl font-bold">{projects.filter(p => p.status === 'in_progress').length}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-warning" />
            <div>
              <p className="text-sm text-text-muted">At Risk/Delayed</p>
              <p className="text-2xl font-bold">{projects.filter(p => ['at_risk', 'delayed'].includes(p.status)).length}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-success" />
            <div>
              <p className="text-sm text-text-muted">Completed</p>
              <p className="text-2xl font-bold">{projects.filter(p => p.status === 'completed').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`badge ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <h3 className="text-lg font-semibold mt-2">{project.project_name}</h3>
                  <p className="text-sm text-text-muted">{project.contract?.supplier?.company_name}</p>
                </div>
                <span className="text-2xl font-bold">{project.completion_percentage}%</span>
              </div>

              <div className="progress-bar mb-4">
                <div
                  className={`progress-fill ${getProgressColor(project.completion_percentage)}`}
                  style={{ width: `${project.completion_percentage}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-muted">Budget</p>
                  <p className="font-medium">{formatCurrency(project.budget_allocated)}</p>
                </div>
                <div>
                  <p className="text-text-muted">Spent</p>
                  <p className={`font-medium ${
                    project.budget_spent > project.budget_allocated ? 'text-danger' : 'text-text-primary'
                  }`}>
                    {formatCurrency(project.budget_spent)}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted">Province</p>
                  <p className="font-medium">{project.project_province || '-'}</p>
                </div>
                <div>
                  <p className="text-text-muted">Milestones</p>
                  <p className="font-medium">
                    {project.completed_milestones}/{project.total_milestones}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <MapPin className="w-4 h-4" />
                  <span>{project.project_province}</span>
                </div>
                {project.risk_level && (
                  <span className={`badge ${
                    project.risk_level === 'high' ? 'badge-danger' :
                    project.risk_level === 'medium' ? 'badge-warning' :
                    'badge-success'
                  }`}>
                    {project.risk_level} Risk
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [performance, setPerformance] = useState<ContractorPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [id]);

  async function fetchProject() {
    try {
      setLoading(true);

      const [projectData, milestonesData, performanceData] = await Promise.all([
        supabase
          .from('project_monitoring')
          .select(`
            *,
            contract:contract_awards (
              contract_number,
              contract_title,
              contract_value,
              contract_start_date,
              contract_end_date,
              supplier:suppliers (company_name, contact_person, contact_email)
            )
          `)
          .eq('id', id)
          .single(),
        supabase
          .from('project_milestones')
          .select('*')
          .eq('project_id', id)
          .order('sort_order'),
        supabase
          .from('contractor_performance')
          .select('*')
          .eq('project_id', id)
          .single(),
      ]);

      setProject(projectData.data);
      setMilestones(milestonesData.data || []);
      setPerformance(performanceData.data);
    } catch (error) {
      console.error('Error fetching project:', error);
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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  const expenditureData = [
    { name: 'Planned', value: project.budget_allocated },
    { name: 'Spent', value: project.budget_spent },
    { name: 'Remaining', value: project.budget_remaining || (project.budget_allocated - project.budget_spent) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.project_name}</h1>
          <p className="text-text-muted mt-1">
            {project.contract?.supplier?.company_name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-3xl font-bold">{project.completion_percentage}%</p>
            <p className="text-sm text-text-muted">Complete</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="text-sm text-text-muted">Budget Allocated</p>
          <p className="text-2xl font-bold">{formatCurrency(project.budget_allocated)}</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-text-muted">Budget Spent</p>
          <p className={`text-2xl font-bold ${
            project.budget_spent > project.budget_allocated ? 'text-danger' : ''
          }`}>
            {formatCurrency(project.budget_spent)}
          </p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-text-muted">Contract Value</p>
          <p className="text-2xl font-bold">{formatCurrency(project.contract?.contract_value || 0)}</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-text-muted">Planned End Date</p>
          <p className="text-xl font-bold">
            {project.planned_end_date ? new Date(project.planned_end_date).toLocaleDateString('en-ZA') : '-'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Milestones</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {milestones.map((milestone, idx) => (
                  <div key={milestone.id} className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      milestone.status === 'completed' ? 'bg-success' :
                      milestone.status === 'in_progress' ? 'bg-primary' :
                      milestone.status === 'delayed' ? 'bg-danger' :
                      'bg-gray-300'
                    }`}>
                      {milestone.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{milestone.milestone_name}</p>
                        <span className={`badge ${
                          milestone.status === 'completed' ? 'badge-success' :
                          milestone.status === 'in_progress' ? 'badge-primary' :
                          milestone.status === 'delayed' ? 'badge-danger' :
                          'badge-secondary'
                        }`}>
                          {milestone.status}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted">{milestone.description}</p>
                      <div className="progress-bar mt-2">
                        <div
                          className={`progress-fill ${
                            milestone.completion_percentage >= 100 ? 'bg-success' :
                            milestone.completion_percentage >= 50 ? 'bg-primary' : 'bg-warning'
                          }`}
                          style={{ width: `${milestone.completion_percentage}%` }}
                        />
                      </div>
                      {milestone.budget_amount && (
                        <p className="text-sm text-text-muted mt-1">
                          {formatCurrency(milestone.spent_amount || 0)} / {formatCurrency(milestone.budget_amount)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Project Details</h3>
            </div>
            <div className="card-body space-y-4 text-sm">
              <div>
                <p className="text-text-muted">Status</p>
                <p className="font-medium">{project.status}</p>
              </div>
              <div>
                <p className="text-text-muted">Province</p>
                <p className="font-medium">{project.project_province}</p>
              </div>
              <div>
                <p className="text-text-muted">Start Date</p>
                <p className="font-medium">
                  {project.actual_start_date || project.planned_start_date
                    ? new Date(project.actual_start_date || project.planned_start_date).toLocaleDateString('en-ZA')
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-text-muted">Days Behind</p>
                <p className={`font-medium ${project.days_behind > 0 ? 'text-danger' : ''}`}>
                  {project.days_behind || 0} days
                </p>
              </div>
            </div>
          </div>

          {performance && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Performance</h3>
              </div>
              <div className="card-body">
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold">{performance.overall_rating}%</p>
                  <p className="text-sm text-text-muted">Overall Rating</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Quality</span>
                    <span className="font-medium">{performance.quality_score}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timeliness</span>
                    <span className="font-medium">{performance.timeliness_score}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compliance</span>
                    <span className="font-medium">{performance.compliance_score}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Communication</span>
                    <span className="font-medium">{performance.communication_score}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContractorPerformancePage() {
  const [performances, setPerformances] = useState<(ContractorPerformance & {
    supplier?: any;
    project?: any;
  })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data, error } = await supabase
        .from('contractor_performance')
        .select(`
          *,
          supplier:suppliers (company_name, bbbee_level),
          project:project_monitoring (project_name)
        `)
        .order('review_date', { ascending: false });

      if (error) throw error;
      setPerformances(data || []);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return 'text-success';
    if (rating >= 60) return 'text-primary';
    if (rating >= 40) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contractor Performance</h1>
          <p className="text-text-muted mt-1">Evaluate and track contractor performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {performances.map((perf) => (
          <div key={perf.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{perf.supplier?.company_name}</h3>
                  <p className="text-sm text-text-muted">{perf.project?.project_name}</p>
                  <p className="text-xs text-text-muted mt-1">Review Period: {perf.review_period}</p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${getRatingColor(perf.overall_rating)}`}>
                    {perf.overall_rating}%
                  </p>
                  <p className="text-sm text-text-muted">Overall</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-2 bg-surface rounded">
                  <p className="text-lg font-bold">{perf.quality_score}%</p>
                  <p className="text-xs text-text-muted">Quality</p>
                </div>
                <div className="text-center p-2 bg-surface rounded">
                  <p className="text-lg font-bold">{perf.timeliness_score}%</p>
                  <p className="text-xs text-text-muted">Timeliness</p>
                </div>
                <div className="text-center p-2 bg-surface rounded">
                  <p className="text-lg font-bold">{perf.compliance_score}%</p>
                  <p className="text-xs text-text-muted">Compliance</p>
                </div>
              </div>

              {perf.review_comments && (
                <p className="text-sm text-text-secondary">{perf.review_comments}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
