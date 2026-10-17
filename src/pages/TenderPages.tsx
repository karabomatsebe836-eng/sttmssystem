import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Tender, Department, ProcurementCategory } from '../types';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Eye,
  Calendar,
  DollarSign,
  Building2,
  FileText,
  Clock,
  Users,
  Award,
  Download,
  Upload,
  Send,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export function TendersListPage() {
  const [tenders, setTenders] = useState<(Tender & { department: Department; category?: ProcurementCategory })[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<ProcurementCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => {
    fetchTenders();
    fetchFilters();
  }, []);

  async function fetchFilters() {
    const [depts, cats] = await Promise.all([
      supabase.from('departments').select('*').eq('is_active', true),
      supabase.from('procurement_categories').select('*').eq('is_active', true),
    ]);
    setDepartments(depts.data || []);
    setCategories(cats.data || []);
  }

  async function fetchTenders() {
    try {
      setLoading(true);
      let query = supabase
        .from('tenders')
        .select(`
          *,
          department:departments (*),
          category:procurement_categories (*)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      if (deptFilter) {
        query = query.eq('department_id', deptFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (search) {
        filtered = filtered.filter((t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.reference_number.toLowerCase().includes(search.toLowerCase())
        );
      }

      setTenders(filtered);
    } catch (error) {
      console.error('Error fetching tenders:', error);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-ZA');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenders</h1>
          <p className="text-text-muted mt-1">Manage all procurement tenders</p>
        </div>
        <Link to="/procurement/tenders/create" className="btn-primary">
          <Plus className="w-4 h-4" />
          Create Tender
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select w-full lg:w-40"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
              <option value="under_evaluation">Under Evaluation</option>
              <option value="awarded">Awarded</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="select w-full lg:w-48"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Category</th>
                  <th>Estimated Value</th>
                  <th>Closing Date</th>
                  <th>Status</th>
                  <th>Bids</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tenders.map((tender) => (
                  <tr key={tender.id}>
                    <td className="font-medium">{tender.reference_number}</td>
                    <td>
                      <Link
                        to={`/procurement/tenders/${tender.id}`}
                        className="hover:text-primary"
                      >
                        {tender.title}
                      </Link>
                    </td>
                    <td>{tender.department?.name}</td>
                    <td>{tender.category?.name || '-'}</td>
                    <td>{formatCurrency(tender.estimated_value)}</td>
                    <td>{tender.closing_date ? formatDate(tender.closing_date) : '-'}</td>
                    <td>
                      <span className={`badge ${
                        tender.status === 'published' ? 'badge-success' :
                        tender.status === 'awarded' ? 'badge-primary' :
                        tender.status === 'closed' || tender.status === 'under_evaluation' ? 'badge-warning' :
                        tender.status === 'cancelled' ? 'badge-danger' :
                        'badge-secondary'
                      }`}>
                        {tender.status}
                      </span>
                    </td>
                    <td>{tender.bids_count}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/procurement/tenders/${tender.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/procurement/tenders/${tender.id}/edit`}
                          className="btn btn-ghost btn-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </div>
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

export function CreateTenderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<ProcurementCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reference_number: '',
    title: '',
    description: '',
    department_id: '',
    category_id: '',
    estimated_value: '',
    closing_date: '',
    opening_date: '',
    delivery_province: '',
    min_bbbee_level: '',
    tender_type: 'open',
    eligibility_criteria: '',
    technical_specifications: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [depts, cats] = await Promise.all([
      supabase.from('departments').select('*').eq('is_active', true),
      supabase.from('procurement_categories').select('*').eq('is_active', true),
    ]);
    setDepartments(depts.data || []);
    setCategories(cats.data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const refNumber = `TDR/${new Date().getFullYear()}/${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const { data: tender, error } = await supabase
        .from('tenders')
        .insert({
          reference_number: refNumber,
          title: formData.title,
          description: formData.description,
          department_id: formData.department_id,
          category_id: formData.category_id || null,
          procurement_officer_id: user?.id,
          tender_type: formData.tender_type,
          status: 'draft',
          estimated_value: parseFloat(formData.estimated_value),
          closing_date: formData.closing_date,
          opening_date: formData.opening_date || null,
          delivery_province: formData.delivery_province || null,
          min_bbbee_level: parseInt(formData.min_bbbee_level) || null,
          eligibility_criteria: formData.eligibility_criteria || null,
          technical_specifications: formData.technical_specifications || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/procurement/tenders/${tender.id}`);
    } catch (error) {
      console.error('Error creating tender:', error);
      alert('Failed to create tender');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Tender</h1>
        <p className="text-text-muted mt-1">Create a new procurement tender</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Tender Details</h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="label">Tender Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    placeholder="e.g., Construction of Primary School"
                    required
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={4}
                    placeholder="Detailed description of the tender requirements"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Department</label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="select"
                      required
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="select"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Specifications</h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="label">Eligibility Criteria</label>
                  <textarea
                    value={formData.eligibility_criteria}
                    onChange={(e) => setFormData({ ...formData, eligibility_criteria: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Required qualifications and eligibility criteria"
                  />
                </div>
                <div>
                  <label className="label">Technical Specifications</label>
                  <textarea
                    value={formData.technical_specifications}
                    onChange={(e) => setFormData({ ...formData, technical_specifications: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Technical requirements and specifications"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Timeline & Budget</h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="label">Tender Type</label>
                  <select
                    value={formData.tender_type}
                    onChange={(e) => setFormData({ ...formData, tender_type: e.target.value })}
                    className="select"
                  >
                    <option value="open">Open Tender</option>
                    <option value="restricted">Restricted Tender</option>
                    <option value="selective">Selective Tender</option>
                    <option value="negotiated">Negotiated Tender</option>
                    <option value="emergency">Emergency Tender</option>
                    <option value="framework">Framework Agreement</option>
                  </select>
                </div>
                <div>
                  <label className="label">Estimated Value (ZAR)</label>
                  <input
                    type="number"
                    value={formData.estimated_value}
                    onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                    className="input"
                    placeholder="e.g., 1000000"
                    required
                  />
                </div>
                <div>
                  <label className="label">Closing Date</label>
                  <input
                    type="datetime-local"
                    value={formData.closing_date}
                    onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Opening Date</label>
                  <input
                    type="date"
                    value={formData.opening_date}
                    onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Requirements</h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="label">Delivery Province</label>
                  <select
                    value={formData.delivery_province}
                    onChange={(e) => setFormData({ ...formData, delivery_province: e.target.value })}
                    className="select"
                  >
                    <option value="">Select province</option>
                    <option value="Eastern Cape">Eastern Cape</option>
                    <option value="Free State">Free State</option>
                    <option value="Gauteng">Gauteng</option>
                    <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                    <option value="Limpopo">Limpopo</option>
                    <option value="Mpumalanga">Mpumalanga</option>
                    <option value="Northern Cape">Northern Cape</option>
                    <option value="North West">North West</option>
                    <option value="Western Cape">Western Cape</option>
                  </select>
                </div>
                <div>
                  <label className="label">Minimum B-BBEE Level</label>
                  <select
                    value={formData.min_bbbee_level}
                    onChange={(e) => setFormData({ ...formData, min_bbbee_level: e.target.value })}
                    className="select"
                  >
                    <option value="">No minimum</option>
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                    <option value="4">Level 4</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/procurement/tenders')}
                className="btn btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Creating...' : 'Create Tender'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export function TenderDetailPage() {
  const { id } = useParams();
  const [tender, setTender] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTender();
  }, [id]);

  async function fetchTender() {
    try {
      const [{ data: tenderData }, { data: bidsData }] = await Promise.all([
        supabase
          .from('tenders')
          .select(`
            *,
            department:departments (*),
            category:procurement_categories (*),
            procurement_officer:users!tenders_procurement_officer_id_fkey (first_name, last_name, email)
          `)
          .eq('id', id)
          .single(),
        supabase
          .from('bids')
          .select(`
            *,
            supplier:suppliers (company_name, contact_person)
          `)
          .eq('tender_id', id),
      ]);

      setTender(tenderData);
      setBids(bidsData || []);
    } catch (error) {
      console.error('Error fetching tender:', error);
    } finally {
      setLoading(false);
    }
  }

  async function publishTender() {
    try {
      const { error } = await supabase
        .from('tenders')
        .update({
          status: 'published',
          publication_date: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      fetchTender();
    } catch (error) {
      console.error('Error publishing tender:', error);
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

  if (!tender) {
    return <div>Tender not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-muted">{tender.reference_number}</p>
          <h1 className="text-2xl font-bold">{tender.title}</h1>
        </div>
        <div className="flex gap-2">
          {tender.status === 'draft' && (
            <button onClick={publishTender} className="btn-success">
              <Send className="w-4 h-4" />
              Publish
            </button>
          )}
          <Link to={`/procurement/tenders/${id}/edit`} className="btn btn-outline">
            <Edit2 className="w-4 h-4" />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center gap-4 mb-4">
                <span className={`badge ${
                  tender.status === 'published' ? 'badge-success' :
                  tender.status === 'awarded' ? 'badge-primary' :
                  'badge-warning'
                } badge-lg`}>
                  {tender.status}
                </span>
                <span className="badge badge-secondary">{tender.tender_type}</span>
              </div>
              <p className="text-text-secondary">{tender.description}</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Bids Received ({bids.length})</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Supplier</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid) => (
                    <tr key={bid.id}>
                      <td className="font-medium">{bid.bid_reference}</td>
                      <td>{bid.supplier?.company_name}</td>
                      <td>{formatCurrency(bid.bid_amount)}</td>
                      <td>
                        <span className={`badge ${
                          bid.status === 'awarded' ? 'badge-success' :
                          bid.status === 'submitted' ? 'badge-primary' :
                          'badge-secondary'
                        }`}>
                          {bid.status}
                        </span>
                      </td>
                      <td>{bid.total_score || '-'}</td>
                      <td>
                        <Link
                          to={`/procurement/evaluations/${bid.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          Evaluate
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Details</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-sm text-text-muted">Department</p>
                <p className="font-medium">{tender.department?.name}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Category</p>
                <p className="font-medium">{tender.category?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Estimated Value</p>
                <p className="font-medium">{formatCurrency(tender.estimated_value)}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Closing Date</p>
                <p className="font-medium">{new Date(tender.closing_date).toLocaleString('en-ZA')}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Province</p>
                <p className="font-medium">{tender.delivery_province || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Min B-BBEE Level</p>
                <p className="font-medium">{tender.min_bbbee_level ? `Level ${tender.min_bbbee_level}` : 'No minimum'}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Statistics</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Views</span>
                <span className="font-medium">{tender.views_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Downloads</span>
                <span className="font-medium">{tender.downloads_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Bids</span>
                <span className="font-medium">{bids.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditTenderPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<ProcurementCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department_id: '',
    category_id: '',
    estimated_value: '',
    closing_date: '',
    opening_date: '',
    delivery_province: '',
    min_bbbee_level: '',
    tender_type: 'open',
    eligibility_criteria: '',
    technical_specifications: '',
    status: 'draft',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const [tenderData, depts, cats] = await Promise.all([
        supabase.from('tenders').select('*').eq('id', id).single(),
        supabase.from('departments').select('*').eq('is_active', true),
        supabase.from('procurement_categories').select('*').eq('is_active', true),
      ]);

      if (tenderData.data) {
        const tender = tenderData.data;
        setFormData({
          title: tender.title,
          description: tender.description || '',
          department_id: tender.department_id || '',
          category_id: tender.category_id || '',
          estimated_value: tender.estimated_value?.toString() || '',
          closing_date: tender.closing_date || '',
          opening_date: tender.opening_date || '',
          delivery_province: tender.delivery_province || '',
          min_bbbee_level: tender.min_bbbee_level?.toString() || '',
          tender_type: tender.tender_type || 'open',
          eligibility_criteria: tender.eligibility_criteria || '',
          technical_specifications: tender.technical_specifications || '',
          status: tender.status || 'draft',
        });
      }
      setDepartments(depts.data || []);
      setCategories(cats.data || []);
    } catch (error) {
      console.error('Error fetching tender:', error);
      alert('Failed to load tender');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('tenders')
        .update({
          title: formData.title,
          description: formData.description,
          department_id: formData.department_id,
          category_id: formData.category_id || null,
          tender_type: formData.tender_type,
          estimated_value: parseFloat(formData.estimated_value),
          closing_date: formData.closing_date,
          opening_date: formData.opening_date || null,
          delivery_province: formData.delivery_province || null,
          min_bbbee_level: parseInt(formData.min_bbbee_level) || null,
          eligibility_criteria: formData.eligibility_criteria || null,
          technical_specifications: formData.technical_specifications || null,
          status: formData.status as any,
          modified_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      navigate(`/procurement/tenders/${id}`);
    } catch (error) {
      console.error('Error updating tender:', error);
      alert('Failed to update tender');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Tender</h1>
          <p className="text-text-muted mt-1">Update tender details</p>
        </div>
        <Link to={`/procurement/tenders/${id}`} className="btn btn-ghost">
          <Eye className="w-4 h-4" />
          View Tender
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Tender Details</h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="label">Tender Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Department</label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="select"
                      required
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="select"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Specifications</h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="label">Eligibility Criteria</label>
                  <textarea
                    value={formData.eligibility_criteria}
                    onChange={(e) => setFormData({ ...formData, eligibility_criteria: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="label">Technical Specifications</label>
                  <textarea
                    value={formData.technical_specifications}
                    onChange={(e) => setFormData({ ...formData, technical_specifications: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Status</h3>
              </div>
              <div className="card-body">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="select w-full"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                  <option value="under_evaluation">Under Evaluation</option>
                  <option value="awarded">Awarded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Timeline & Budget</h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="label">Tender Type</label>
                  <select
                    value={formData.tender_type}
                    onChange={(e) => setFormData({ ...formData, tender_type: e.target.value })}
                    className="select"
                  >
                    <option value="open">Open Tender</option>
                    <option value="restricted">Restricted Tender</option>
                    <option value="selective">Selective Tender</option>
                    <option value="negotiated">Negotiated Tender</option>
                    <option value="emergency">Emergency Tender</option>
                    <option value="framework">Framework Agreement</option>
                  </select>
                </div>
                <div>
                  <label className="label">Estimated Value (ZAR)</label>
                  <input
                    type="number"
                    value={formData.estimated_value}
                    onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Closing Date</label>
                  <input
                    type="datetime-local"
                    value={formData.closing_date}
                    onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Opening Date</label>
                  <input
                    type="date"
                    value={formData.opening_date}
                    onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Requirements</h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="label">Delivery Province</label>
                  <select
                    value={formData.delivery_province}
                    onChange={(e) => setFormData({ ...formData, delivery_province: e.target.value })}
                    className="select"
                  >
                    <option value="">Select province</option>
                    <option value="Eastern Cape">Eastern Cape</option>
                    <option value="Free State">Free State</option>
                    <option value="Gauteng">Gauteng</option>
                    <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                    <option value="Limpopo">Limpopo</option>
                    <option value="Mpumalanga">Mpumalanga</option>
                    <option value="Northern Cape">Northern Cape</option>
                    <option value="North West">North West</option>
                    <option value="Western Cape">Western Cape</option>
                  </select>
                </div>
                <div>
                  <label className="label">Minimum B-BBEE Level</label>
                  <select
                    value={formData.min_bbbee_level}
                    onChange={(e) => setFormData({ ...formData, min_bbbee_level: e.target.value })}
                    className="select"
                  >
                    <option value="">No minimum</option>
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                    <option value="4">Level 4</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/procurement/tenders')}
                className="btn btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
