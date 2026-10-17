import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Save,
  Trash2,
  Search,
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
  ArrowLeft,
} from 'lucide-react';

interface EvaluationCriterion {
  id: string;
  tender_id: string;
  criterion_name: string;
  criterion_type: 'technical' | 'financial' | 'bbbee' | 'compliance';
  description?: string;
  weight: number;
  max_score: number;
  is_mandatory: boolean;
  passing_score?: number;
  sort_order: number;
}

export function EvaluationCriteriaPage() {
  const { user } = useAuth();
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<EvaluationCriterion | null>(null);
  const [selectedTender, setSelectedTender] = useState('');
  const [formData, setFormData] = useState({
    criterion_name: '',
    criterion_type: 'technical' as const,
    description: '',
    weight: '',
    max_score: '100',
    is_mandatory: false,
    passing_score: '',
    sort_order: '1',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [criteriaData, tendersData] = await Promise.all([
        supabase.from('evaluation_criteria').select('*').order('sort_order'),
        supabase.from('tenders').select('id, reference_number, title').order('created_at', { ascending: false }),
      ]);
      setCriteria(criteriaData.data || []);
      setTenders(tendersData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!selectedTender) {
        alert('Select a tender before saving a criterion.');
        return;
      }
      const weight = parseFloat(formData.weight);
      if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
        alert('Weight must be between 0 and 100.');
        return;
      }
      const { data: existingCriteria, error: criteriaError } = await supabase
        .from('evaluation_criteria')
        .select('id, weight')
        .eq('tender_id', selectedTender)
        .neq('id', editingCriterion?.id || '00000000-0000-0000-0000-000000000000');
      if (criteriaError) throw criteriaError;
      const totalWeight = (existingCriteria || []).reduce((sum, criterion) => sum + Number(criterion.weight || 0), 0) + weight;
      if (Math.abs(totalWeight - 100) > 0.01) {
        alert(`Criteria weights for this tender must total 100%. Current total would be ${totalWeight}%.`);
        return;
      }
      const data = {
        tender_id: selectedTender,
        criterion_name: formData.criterion_name,
        criterion_type: formData.criterion_type,
        description: formData.description || null,
        weight,
        max_score: parseFloat(formData.max_score),
        is_mandatory: formData.is_mandatory,
        passing_score: formData.passing_score ? parseFloat(formData.passing_score) : null,
        sort_order: parseInt(formData.sort_order),
      };

      if (editingCriterion) {
        const { error } = await supabase
          .from('evaluation_criteria')
          .update(data)
          .eq('id', editingCriterion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('evaluation_criteria').insert(data);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingCriterion(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving criterion:', error);
      alert('Failed to save criterion');
    }
  }

  async function deleteCriterion(id: string) {
    if (!confirm('Are you sure you want to delete this criterion?')) return;
    try {
      const { error } = await supabase.from('evaluation_criteria').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting criterion:', error);
      alert('Failed to delete criterion');
    }
  }

  function resetForm() {
    setFormData({
      criterion_name: '',
      criterion_type: 'technical',
      description: '',
      weight: '',
      max_score: '100',
      is_mandatory: false,
      passing_score: '',
      sort_order: '1',
    });
    setSelectedTender('');
  }

  function openEditModal(criterion: EvaluationCriterion) {
    setEditingCriterion(criterion);
    setSelectedTender(criterion.tender_id);
    setFormData({
      criterion_name: criterion.criterion_name,
      criterion_type: criterion.criterion_type,
      description: criterion.description || '',
      weight: criterion.weight.toString(),
      max_score: criterion.max_score.toString(),
      is_mandatory: criterion.is_mandatory,
      passing_score: criterion.passing_score?.toString() || '',
      sort_order: criterion.sort_order.toString(),
    });
    setShowModal(true);
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technical': return 'badge-primary';
      case 'financial': return 'badge-success';
      case 'bbbee': return 'badge-warning';
      case 'compliance': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Evaluation Criteria</h1>
          <p className="text-text-muted mt-1">Configure evaluation criteria for tender assessments</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingCriterion(null);
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Criterion
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Criterion</th>
                <th>Type</th>
                <th>Tender</th>
                <th>Weight</th>
                <th>Max Score</th>
                <th>Mandatory</th>
                <th>Passing Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((criterion) => {
                const tender = tenders.find(t => t.id === criterion.tender_id);
                return (
                  <tr key={criterion.id}>
                    <td>
                      <div>
                        <p className="font-medium">{criterion.criterion_name}</p>
                        {criterion.description && (
                          <p className="text-sm text-text-muted">{criterion.description}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getTypeColor(criterion.criterion_type)}`}>
                        {criterion.criterion_type}
                      </span>
                    </td>
                    <td>{tender?.reference_number || 'All Tenders'}</td>
                    <td>{criterion.weight}%</td>
                    <td>{criterion.max_score}</td>
                    <td>
                      {criterion.is_mandatory ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td>{criterion.passing_score || '-'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(criterion)} className="btn btn-ghost btn-sm">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteCriterion(criterion.id)} className="btn btn-ghost btn-sm text-danger">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold">
                {editingCriterion ? 'Edit Criterion' : 'Add Evaluation Criterion'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label">Tender</label>
                  <select
                    value={selectedTender}
                    onChange={(e) => setSelectedTender(e.target.value)}
                    className="select"
                  >
                    <option value="">Select a tender</option>
                    {tenders.map((tender) => (
                      <option key={tender.id} value={tender.id}>
                        {tender.reference_number} - {tender.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Criterion Name</label>
                  <input
                    type="text"
                    value={formData.criterion_name}
                    onChange={(e) => setFormData({ ...formData, criterion_name: e.target.value })}
                    className="input"
                    placeholder="e.g., Technical Proposal Quality"
                    required
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="Description of what is being evaluated"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Type</label>
                    <select
                      value={formData.criterion_type}
                      onChange={(e) => setFormData({ ...formData, criterion_type: e.target.value as any })}
                      className="select"
                    >
                      <option value="technical">Technical</option>
                      <option value="financial">Financial</option>
                      <option value="bbbee">B-BBEE</option>
                      <option value="compliance">Compliance</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Weight (%)</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="input"
                      min="0"
                      max="100"
                      step="0.1"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Max Score</label>
                    <input
                      type="number"
                      value={formData.max_score}
                      onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Passing Score</label>
                    <input
                      type="number"
                      value={formData.passing_score}
                      onChange={(e) => setFormData({ ...formData, passing_score: e.target.value })}
                      className="input"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_mandatory"
                    checked={formData.is_mandatory}
                    onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_mandatory" className="text-sm">Mandatory Criterion</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingCriterion ? 'Update' : 'Create'} Criterion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function BidEvaluationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bid, setBid] = useState<any>(null);
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  async function fetchData() {
    try {
      setError('');
      const { data: bidData, error: bidError } = await supabase
        .from('bids')
        .select('*, supplier:suppliers (company_name), tender:tenders (id, reference_number, title, estimated_value)')
        .eq('id', id)
        .maybeSingle();
      if (bidError) throw bidError;
      if (!bidData) {
        setBid(null);
        return;
      }

      const [criteriaData, evalData] = await Promise.all([
        supabase.from('evaluation_criteria').select('*').eq('tender_id', bidData.tender_id).order('sort_order'),
        supabase.from('evaluations').select('*').eq('bid_id', id),
      ]);
      if (criteriaData.error) throw criteriaData.error;
      if (evalData.error) throw evalData.error;

      setBid(bidData);
      setCriteria(criteriaData.data || []);
      setEvaluations(evalData.data || []);
      const existingScores: Record<string, number> = {};
      const existingComments: Record<string, string> = {};
      (evalData.data || []).forEach((evaluation: any) => {
        if (evaluation.criterion_id) {
          existingScores[evaluation.criterion_id] = evaluation.score;
          existingComments[evaluation.criterion_id] = evaluation.comments || '';
        }
      });
      setScores(existingScores);
      setComments(existingComments);
    } catch (error) {
      console.error('Error fetching evaluation data:', error);
      setError('We could not load this bid evaluation. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!criteria.length) {
      setError('This tender has no evaluation criteria configured. Add criteria before evaluating a bid.');
      return;
    }
    const hasInvalidScore = criteria.some((criterion) => {
      const score = scores[criterion.id];
      return score === undefined || score < 0 || score > criterion.max_score || Number.isNaN(score);
    });
    if (hasInvalidScore) {
      setError('Enter a valid score for every criterion before saving.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const { error: deleteError } = await supabase.from('evaluations').delete().eq('bid_id', id);
      if (deleteError) throw deleteError;

      // Insert new evaluations
      const evalData = criteria.map(c => ({
        bid_id: id,
        evaluator_id: user?.id,
        criterion_id: c.id,
        score: scores[c.id],
        weighted_score: (scores[c.id] / c.max_score) * c.weight,
        max_possible_score: c.max_score,
        comments: comments[c.id] || null,
        evaluation_status: 'completed',
        evaluated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('evaluations').insert(evalData);
      if (error) throw error;

      // Calculate total score
      const totalScore = criteria.reduce((sum, c) => {
        return sum + ((scores[c.id] || 0) / c.max_score) * c.weight;
      }, 0);

      // Update bid with total score
      const { error: bidUpdateError } = await supabase
        .from('bids')
        .update({
          total_score: Math.round(totalScore * 100) / 100,
          status: 'under_evaluation',
        })
        .eq('id', id);
      if (bidUpdateError) throw bidUpdateError;

      alert('Evaluation saved successfully');
      navigate('/procurement/evaluations');
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('Failed to save evaluation');
    } finally {
      setSaving(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(value);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (error && !bid) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Unable to load bid evaluation</h2>
        <p className="text-text-muted">{error}</p>
        <button onClick={() => navigate('/procurement/evaluations')} className="btn-primary mt-6">Back to Evaluations</button>
      </div>
    );
  }

  if (!bid) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Bid evaluation unavailable</h2>
        <p className="text-text-muted">This bid could not be found.</p>
        <button onClick={() => navigate('/procurement/evaluations')} className="btn-primary mt-6">Back to Evaluations</button>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technical': return 'bg-primary/10 text-primary';
      case 'financial': return 'bg-success/10 text-success';
      case 'bbbee': return 'bg-warning/10 text-warning';
      case 'compliance': return 'bg-danger/10 text-danger';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="alert-danger">{error}</div>}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/procurement/evaluations')} className="btn btn-ghost">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex-1">
          <p className="text-sm text-text-muted">{bid.tender?.reference_number}</p>
          <h1 className="text-2xl font-bold">Evaluate Bid: {bid.bid_reference}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {!criteria.length && <div className="card"><div className="card-body text-center text-text-muted">No evaluation criteria have been configured for this tender.</div></div>}
              {criteria.map((criterion) => (
                <div key={criterion.id} className="card">
                  <div className="card-body">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className={`badge ${getTypeColor(criterion.criterion_type)} mb-2`}>
                          {criterion.criterion_type}
                        </span>
                        <h4 className="font-semibold">{criterion.criterion_name}</h4>
                        {criterion.description && (
                          <p className="text-sm text-text-muted">{criterion.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-muted">Weight: {criterion.weight}%</p>
                        <p className="text-sm text-text-muted">Max: {criterion.max_score}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="label">Score (0-{criterion.max_score})</label>
                        <input
                          type="number"
                          value={scores[criterion.id] || 0}
                          onChange={(e) => setScores({ ...scores, [criterion.id]: parseFloat(e.target.value) || 0 })}
                          className="input"
                          min="0"
                          max={criterion.max_score}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="label">Comments</label>
                        <textarea
                          value={comments[criterion.id] || ''}
                          onChange={(e) => setComments({ ...comments, [criterion.id]: e.target.value })}
                          className="input"
                          rows={2}
                          placeholder="Optional comments"
                        />
                      </div>
                    </div>
                    {criterion.is_mandatory && scores[criterion.id] !== undefined && scores[criterion.id] < (criterion.passing_score || 0) && (
                      <div className="mt-2 flex items-center gap-2 text-danger">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Below passing score ({criterion.passing_score})</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={() => navigate('/procurement/evaluations')} className="btn btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Evaluation'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Bid Details</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-sm text-text-muted">Supplier</p>
                <p className="font-medium">{bid.supplier?.company_name}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Tender</p>
                <p className="font-medium">{bid.tender?.title}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Bid Amount</p>
                <p className="font-medium text-xl">{formatCurrency(bid.bid_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Current Score</p>
                <p className="font-medium text-xl">
                  {bid.total_score ? `${bid.total_score}%` : 'Not evaluated'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
