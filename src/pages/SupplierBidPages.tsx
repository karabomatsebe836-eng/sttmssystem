import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Send,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  Building2,
  Clock,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export function SupplierBidSubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [tender, setTender] = useState<any>(null);
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bidReference, setBidReference] = useState('');
  const [formData, setFormData] = useState({
    bid_amount: '',
    technical_proposal: '',
    methodology: '',
    timeline_proposal: '',
    team_proposal: '',
  });

  useEffect(() => {
    if (id) fetchData();
  }, [id, user]);

  async function fetchData() {
    try {
      const [tenderData, supplierData] = await Promise.all([
        supabase
          .from('tenders')
          .select(`
            *,
            department:departments (name),
            category:procurement_categories (name)
          `)
          .eq('id', id)
          .eq('status', 'published')
          .gt('closing_date', new Date().toISOString())
          .maybeSingle(),
        supabase
          .from('suppliers')
          .select('*')
          .eq('user_id', user?.id)
          .maybeSingle(),
      ]);

      if (tenderData.error) throw tenderData.error;
      if (supplierData.error) throw supplierData.error;
      setTender(tenderData.data);
      setSupplier(supplierData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const ref = `BID-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      const { error } = await supabase
        .from('bids')
        .insert({
          tender_id: id,
          supplier_id: supplier?.id,
          bid_reference: ref,
          status: 'submitted',
          bid_amount: parseFloat(formData.bid_amount),
          total_bid_amount: parseFloat(formData.bid_amount),
          technical_proposal: formData.technical_proposal,
          methodology: formData.methodology || null,
          timeline_proposal: formData.timeline_proposal || null,
          team_proposal: formData.team_proposal || null,
          price_breakdown: {},
          compliance_docs: [],
          bid_documents: [],
          submission_date: new Date().toISOString(),
          submission_ip: null,
        })
        .select()
        .single();

      if (error) throw error;

      const { error: countError } = await supabase.rpc('increment_bids_count', { tender_id: id });
      if (countError) console.warn('Tender bid count was not updated:', countError.message);

      setBidReference(ref);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting bid:', error);
      alert('Failed to submit bid. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-muted">Loading tender details...</p>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Tender Not Found</h2>
        <p className="text-text-muted mb-6">This tender may no longer be available for bidding.</p>
        <Link to="/supplier/tenders" className="btn-primary">
          Browse Available Tenders
        </Link>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Supplier Profile Required</h2>
        <p className="text-text-muted mb-6">Please complete your supplier profile before submitting bids.</p>
        <Link to="/supplier/profile" className="btn-primary">Complete Profile</Link>
      </div>
    );
  }

  if (supplier.can_bid === false) {
    const isCorruption = supplier.document_verification_status === 'corruption_flagged';
    return (
      <div className="text-center py-12">
        <ShieldAlert className={`w-16 h-16 mx-auto mb-4 ${isCorruption ? 'text-danger' : 'text-warning'}`} />
        <h2 className="text-2xl font-bold mb-2">
          {isCorruption ? 'Bidding Access Blocked — Fraud Flag' : 'Bidding Access Locked'}
        </h2>
        <p className="text-text-muted mb-4 max-w-md mx-auto">
          {isCorruption
            ? 'One or more of your uploaded documents were flagged as potential fraud by the AI verification system. Bidding is suspended pending an auditor review. If you believe this is an error, please contact the procurement office.'
            : 'Your compliance documents have not yet been verified. Upload and verify all required documents to unlock bidding.'}
        </p>
        <Link to="/supplier/documents" className="btn-primary">Go to Compliance Documents</Link>
      </div>
    );
  }

  // Check if tender deadline has passed
  const isDeadlinePassed = tender.closing_date && new Date(tender.closing_date) < new Date();
  if (isDeadlinePassed) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 text-danger mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Deadline Passed</h2>
        <p className="text-text-muted mb-6">The deadline for this tender has passed. Submissions are no longer accepted.</p>
        <Link to="/supplier/tenders" className="btn-primary">
          Browse Other Tenders
        </Link>
      </div>
    );
  }

  // Success screen after submission
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Bid Submitted Successfully!</h2>
          <p className="text-text-muted mb-6">
            Your bid has been received and is now under review. Please save your bid reference number.
          </p>
          <div className="bg-surface rounded-lg p-6 mb-6">
            <p className="text-sm text-text-muted mb-2">Your Bid Reference</p>
            <p className="text-3xl font-mono font-bold text-primary">{bidReference}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-6">
            <div className="p-4 bg-surface rounded-lg">
              <p className="text-sm text-text-muted">Tender</p>
              <p className="font-medium">{tender.reference_number}</p>
            </div>
            <div className="p-4 bg-surface rounded-lg">
              <p className="text-sm text-text-muted">Your Bid Amount</p>
              <p className="font-medium">{formatCurrency(parseFloat(formData.bid_amount))}</p>
            </div>
            <div className="p-4 bg-surface rounded-lg">
              <p className="text-sm text-text-muted">Submission Date</p>
              <p className="font-medium">{new Date().toLocaleString('en-ZA')}</p>
            </div>
            <div className="p-4 bg-surface rounded-lg">
              <p className="text-sm text-text-muted">Status</p>
              <span className="badge badge-primary">Submitted</span>
            </div>
          </div>
          <p className="text-sm text-text-muted mb-6">
            You will be notified when the evaluation is complete. You can check the status of your bid in the My Bids section.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(bidReference);
                alert('Bid reference copied!');
              }}
              className="btn btn-outline"
            >
              Copy Reference
            </button>
            <Link to="/supplier/bids" className="btn-primary">
              View My Bids
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/supplier/tenders" className="btn btn-ghost">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="flex-1">
          <p className="text-sm text-text-muted">{tender.reference_number}</p>
          <h1 className="text-2xl font-bold">Submit Bid: {tender.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Bid Amount</h3>
                </div>
                <div className="card-body">
                  <div className="flex items-center gap-4">
                    <DollarSign className="w-8 h-8 text-success" />
                    <div className="flex-1">
                      <label className="label">Your Bid Amount (ZAR)</label>
                      <input
                        type="number"
                        value={formData.bid_amount}
                        onChange={(e) => setFormData({ ...formData, bid_amount: e.target.value })}
                        className="input text-2xl font-bold"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-sm text-text-muted mt-2">
                    Estimated Value: {formatCurrency(tender.estimated_value)}
                  </p>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Technical Proposal</h3>
                </div>
                <div className="card-body space-y-4">
                  <div>
                    <label className="label">Technical Approach *</label>
                    <textarea
                      value={formData.technical_proposal}
                      onChange={(e) => setFormData({ ...formData, technical_proposal: e.target.value })}
                      className="input"
                      rows={6}
                      placeholder="Describe your technical approach, methodology, and how you will meet the tender requirements..."
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Detailed Methodology</label>
                    <textarea
                      value={formData.methodology}
                      onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                      className="input"
                      rows={4}
                      placeholder="Provide detailed methodology, processes, and quality assurance measures..."
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Implementation Plan</h3>
                </div>
                <div className="card-body space-y-4">
                  <div>
                    <label className="label">Timeline Proposal *</label>
                    <textarea
                      value={formData.timeline_proposal}
                      onChange={(e) => setFormData({ ...formData, timeline_proposal: e.target.value })}
                      className="input"
                      rows={4}
                      placeholder="Provide your proposed timeline with milestones and deliverables..."
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Team & Resources</label>
                    <textarea
                      value={formData.team_proposal}
                      onChange={(e) => setFormData({ ...formData, team_proposal: e.target.value })}
                      className="input"
                      rows={4}
                      placeholder="Describe your team composition, qualifications, and key personnel..."
                    />
                  </div>
                </div>
              </div>

              <div className="alert alert-warning">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <p className="font-medium">Important Notice</p>
                  <p className="text-sm">
                    By submitting this bid, you confirm that all information provided is accurate and complete.
                    False or misleading information may result in disqualification.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Link to="/supplier/tenders" className="btn btn-ghost flex-1">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting || !formData.bid_amount || !formData.technical_proposal || !formData.timeline_proposal}
                  className="btn-success flex-1"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Bid'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card sticky top-4">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Tender Details</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-sm text-text-muted">Reference</p>
                <p className="font-medium">{tender.reference_number}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Department</p>
                <p className="font-medium">{tender.department?.name}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Estimated Value</p>
                <p className="font-medium text-lg">{formatCurrency(tender.estimated_value)}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Tender Type</p>
                <p className="font-medium capitalize">{tender.tender_type?.replace('_', ' ')}</p>
              </div>
              {tender.category && (
                <div>
                  <p className="text-sm text-text-muted">Category</p>
                  <p className="font-medium">{tender.category.name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-text-muted">Closing Date</p>
                <p className="font-medium text-danger">
                  {new Date(tender.closing_date).toLocaleString('en-ZA')}
                </p>
              </div>
              {tender.delivery_province && (
                <div>
                  <p className="text-sm text-text-muted">Delivery Province</p>
                  <p className="font-medium">{tender.delivery_province}</p>
                </div>
              )}
              {tender.min_bbbee_level && (
                <div>
                  <p className="text-sm text-text-muted">Min B-BBEE Level</p>
                  <p className="font-medium">Level {tender.min_bbbee_level}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Your Company</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-sm text-text-muted">Company Name</p>
                <p className="font-medium">{supplier.company_name}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">B-BBEE Level</p>
                <p className="font-medium">{supplier.bbbee_level ? `Level ${supplier.bbbee_level}` : 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Verification Status</p>
                <span className={`badge ${supplier.is_verified ? 'badge-success' : 'badge-warning'}`}>
                  {supplier.is_verified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
