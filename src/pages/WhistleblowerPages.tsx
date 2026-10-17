import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Shield,
  AlertTriangle,
  FileText,
  Lock,
  Eye,
  Send,
  CheckCircle,
  Search,
  Upload,
} from 'lucide-react';

export function WhistleblowerReportPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [formData, setFormData] = useState({
    report_category: '',
    report_subject: '',
    incident_description: '',
    incident_date: '',
    incident_location: '',
    involved_parties: '',
    tender_reference: '',
    contract_reference: '',
    department: '',
    amount_involved: '',
    officials_involved: '',
    suppliers_mentioned: '',
    evidence_description: '',
    protection_requested: false,
  });

  const categories = [
    { value: 'bid_rigging', label: 'Bid Rigging/Collusion' },
    { value: 'corruption', label: 'Corruption/Bribery' },
    { value: 'fraud', label: 'Fraud' },
    { value: 'tender_manipulation', label: 'Tender Manipulation' },
    { value: 'conflict_of_interest', label: 'Conflict of Interest' },
    { value: 'price_fixing', label: 'Price Fixing' },
    { value: 'misappropriation', label: 'Misappropriation of Funds' },
    { value: 'other', label: 'Other' },
  ];

  const departments = [
    'National Treasury',
    'Department of Public Works and Infrastructure',
    'Department of Health',
    'Department of Education',
    'Department of Transport',
    'Department of Water and Sanitation',
    'Department of Energy',
    'South African Police Service',
    'Department of Defence',
    'Department of Home Affairs',
    'Other',
  ];

  async function generateAccessCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'ACC-';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) code += '-';
    }
    return code;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const reportRef = `WB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      const newAccessCode = await generateAccessCode();

      const { error } = await supabase.from('whistleblower_reports').insert({
        report_reference: reportRef,
        access_code: newAccessCode,
        report_category: formData.report_category,
        report_subject: formData.report_subject,
        incident_description: formData.incident_description,
        incident_date: formData.incident_date || null,
        incident_location: formData.incident_location || null,
        involved_parties: formData.involved_parties || null,
        tender_reference: formData.tender_reference || null,
        contract_reference: formData.contract_reference || null,
        department: formData.department || null,
        amount_involved: parseFloat(formData.amount_involved) || null,
        officials_involved: formData.officials_involved ? formData.officials_involved.split(',').map(s => s.trim()) : [],
        suppliers_mentioned: formData.suppliers_mentioned ? formData.suppliers_mentioned.split(',').map(s => s.trim()) : [],
        evidence_description: formData.evidence_description || null,
        protection_requested: formData.protection_requested,
        status: 'pending',
        priority: 'medium',
      });

      if (error) throw error;

      setAccessCode(newAccessCode);
      setSuccess(true);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Report Submitted Successfully</h2>
          <p className="text-text-muted mb-6">
            Your anonymous report has been received. Please save your access code to check the status later.
          </p>
          <div className="bg-surface rounded-lg p-6 mb-6">
            <p className="text-sm text-text-muted mb-2">Your Access Code</p>
            <p className="text-3xl font-mono font-bold text-primary">{accessCode}</p>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(accessCode);
                alert('Access code copied to clipboard!');
              }}
              className="btn btn-outline"
            >
              Copy Code
            </button>
            <button
              onClick={() => navigate('/public')}
              className="btn-primary"
            >
              Return to Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-danger" />
        </div>
        <h1 className="text-2xl font-bold">Anonymous Whistleblower Report</h1>
        <p className="text-text-muted mt-2">
          Report corruption, fraud, or procurement irregularities. Your identity will be protected.
        </p>
      </div>

      <div className="alert alert-warning">
        <Shield className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="font-medium">Protected Disclosure</p>
          <p className="text-sm mt-1">
            Under the Protected Disclosures Act, whistleblowers are protected from victimisation.
            Your report is completely anonymous.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Step 1: Category and Subject */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Report Details</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Category of Concern *</label>
                <select
                  value={formData.report_category}
                  onChange={(e) => setFormData({ ...formData, report_category: e.target.value })}
                  className="select"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Subject/Title *</label>
                <input
                  type="text"
                  value={formData.report_subject}
                  onChange={(e) => setFormData({ ...formData, report_subject: e.target.value })}
                  className="input"
                  placeholder="Brief subject of your report"
                  required
                />
              </div>
              <div>
                <label className="label">Detailed Description *</label>
                <textarea
                  value={formData.incident_description}
                  onChange={(e) => setFormData({ ...formData, incident_description: e.target.value })}
                  className="input"
                  rows={5}
                  placeholder="Provide a detailed description of the incident, including what happened, when, and who was involved"
                  required
                />
              </div>
            </div>
          </div>

          {/* Step 2: Incident Details */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Incident Information</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Date of Incident</label>
                  <input
                    type="date"
                    value={formData.incident_date}
                    onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input
                    type="text"
                    value={formData.incident_location}
                    onChange={(e) => setFormData({ ...formData, incident_location: e.target.value })}
                    className="input"
                    placeholder="Province or municipality"
                  />
                </div>
              </div>
              <div>
                <label className="label">Related Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="select"
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Tender Reference (if applicable)</label>
                  <input
                    type="text"
                    value={formData.tender_reference}
                    onChange={(e) => setFormData({ ...formData, tender_reference: e.target.value })}
                    className="input"
                    placeholder="e.g., NT/2026/03251"
                  />
                </div>
                <div>
                  <label className="label">Contract Reference (if applicable)</label>
                  <input
                    type="text"
                    value={formData.contract_reference}
                    onChange={(e) => setFormData({ ...formData, contract_reference: e.target.value })}
                    className="input"
                    placeholder="e.g., C-2025-00156"
                  />
                </div>
              </div>
              <div>
                <label className="label">Estimated Amount Involved (ZAR)</label>
                <input
                  type="number"
                  value={formData.amount_involved}
                  onChange={(e) => setFormData({ ...formData, amount_involved: e.target.value })}
                  className="input"
                  placeholder="e.g., 1000000"
                />
              </div>
            </div>
          </div>

          {/* Step 3: People Involved */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">People Involved</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Government Officials Involved</label>
                <textarea
                  value={formData.officials_involved}
                  onChange={(e) => setFormData({ ...formData, officials_involved: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Names and positions of officials involved (comma-separated)"
                />
              </div>
              <div>
                <label className="label">Suppliers/Companies Mentioned</label>
                <textarea
                  value={formData.suppliers_mentioned}
                  onChange={(e) => setFormData({ ...formData, suppliers_mentioned: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Names of companies or suppliers involved (comma-separated)"
                />
              </div>
            </div>
          </div>

          {/* Step 4: Evidence */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Evidence</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Description of Evidence</label>
                <textarea
                  value={formData.evidence_description}
                  onChange={(e) => setFormData({ ...formData, evidence_description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Describe any evidence you have (documents, emails, recordings, etc.)"
                />
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="protection"
                  checked={formData.protection_requested}
                  onChange={(e) => setFormData({ ...formData, protection_requested: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="protection" className="text-sm">
                  I request whistleblower protection under the Protected Disclosures Act
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/public')}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-danger"
            >
              {loading ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Anonymous Report
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function ReportTrackingPage() {
  const [accessCode, setAccessCode] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch() {
    if (!accessCode.trim()) {
      setError('Please enter an access code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('whistleblower_reports')
        .select('*')
        .eq('access_code', accessCode.trim())
        .single();

      if (fetchError || !data) {
        setError('Invalid access code. Please check and try again.');
        setReport(null);
      } else {
        setReport(data);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold">Track Your Report</h1>
        <p className="text-text-muted mt-2">
          Enter your access code to check the status of your anonymous report
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="input pl-10 font-mono"
                placeholder="Enter your access code (e.g., ACC-7X9K-M3LQ-P4R2)"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>
          {error && (
            <p className="text-sm text-danger mt-2">{error}</p>
          )}
        </div>
      </div>

      {report && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Report Status</h3>
              <span className="badge badge-secondary">{report.report_reference}</span>
            </div>
          </div>
          <div className="card-body space-y-6">
            <div>
              <p className="text-sm text-text-muted">Subject</p>
              <p className="font-medium">{report.report_subject}</p>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-text-muted">Status</p>
                <span className={`badge badge-lg ${
                  report.status === 'pending' ? 'badge-warning' :
                  report.status === 'investigating' ? 'badge-primary' :
                  report.status === 'resolved' ? 'badge-success' :
                  'badge-secondary'
                }`}>
                  {report.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-text-muted">Priority</p>
                <span className={`badge ${
                  report.priority === 'critical' ? 'badge-danger' :
                  report.priority === 'high' ? 'badge-warning' :
                  'badge-secondary'
                }`}>
                  {report.priority}
                </span>
              </div>
              <div>
                <p className="text-sm text-text-muted">Submitted</p>
                <p className="font-medium">{new Date(report.submitted_at).toLocaleDateString('en-ZA')}</p>
              </div>
            </div>

            {report.investigation_status && (
              <div className="p-4 bg-surface rounded-lg">
                <p className="text-sm font-medium">Investigation Update</p>
                <p className="text-sm text-text-muted mt-1">{report.investigation_status}</p>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <h4 className="font-medium mb-3">Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary mt-1.5"></div>
                  <div>
                    <p className="font-medium">Report Submitted</p>
                    <p className="text-sm text-text-muted">
                      {new Date(report.submitted_at).toLocaleString('en-ZA')}
                    </p>
                  </div>
                </div>
                {report.reviewed_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary mt-1.5"></div>
                    <div>
                      <p className="font-medium">Under Review</p>
                      <p className="text-sm text-text-muted">
                        {new Date(report.reviewed_at).toLocaleString('en-ZA')}
                      </p>
                    </div>
                  </div>
                )}
                {report.resolved_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-success mt-1.5"></div>
                    <div>
                      <p className="font-medium">Resolved</p>
                      <p className="text-sm text-text-muted">
                        {new Date(report.resolved_at).toLocaleString('en-ZA')}
                      </p>
                      {report.outcome && (
                        <p className="text-sm mt-1">{report.outcome}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PublicComplaintPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    reporter_name: '',
    reporter_email: '',
    reporter_phone: '',
    report_type: '',
    report_category: '',
    subject: '',
    description: '',
    tender_reference: '',
    department: '',
  });

  const reportTypes = [
    { value: 'complaint', label: 'Complaint' },
    { value: 'inquiry', label: 'Inquiry' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'feedback', label: 'Feedback' },
  ];

  const reportCategories = [
    { value: 'procurement_process', label: 'Procurement Process' },
    { value: 'tender_clarity', label: 'Tender Specifications Clarity' },
    { value: 'contract_award', label: 'Contract Award Concerns' },
    { value: 'project_quality', label: 'Project Quality Issues' },
    { value: 'payment_issues', label: 'Payment Issues' },
    { value: 'behavior', label: 'Official Behavior/Conduct' },
    { value: 'other', label: 'Other' },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const reportRef = `PBLC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      const { error } = await supabase.from('public_reports').insert({
        report_reference: reportRef,
        reporter_name: formData.reporter_name || null,
        reporter_email: formData.reporter_email || null,
        reporter_phone: formData.reporter_phone || null,
        report_type: formData.report_type,
        report_category: formData.report_category,
        subject: formData.subject,
        description: formData.description,
        status: 'pending',
        priority: 'medium',
      });

      if (error) throw error;
      setSuccess(true);
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Complaint Submitted</h2>
          <p className="text-text-muted mb-6">
            Thank you for your submission. We will review your complaint and respond accordingly.
          </p>
          <button onClick={() => navigate('/public')} className="btn-primary">
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold">Submit a Complaint</h1>
        <p className="text-text-muted mt-2">
          Report concerns about procurement processes or contracts
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-body space-y-4">
            <p className="text-sm text-text-muted">Your contact details (optional)</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  value={formData.reporter_name}
                  onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                  className="input"
                  placeholder="Your name (optional)"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.reporter_email}
                  onChange={(e) => setFormData({ ...formData, reporter_email: e.target.value })}
                  className="input"
                  placeholder="Your email (optional)"
                />
              </div>
            </div>

            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                value={formData.reporter_phone}
                onChange={(e) => setFormData({ ...formData, reporter_phone: e.target.value })}
                className="input"
                placeholder="Your phone number (optional)"
              />
            </div>

            <hr className="border-border" />

            <p className="text-sm text-text-muted">Complaint details</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Report Type</label>
                <select
                  value={formData.report_type}
                  onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                  className="select"
                  required
                >
                  <option value="">Select type</option>
                  {reportTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  value={formData.report_category}
                  onChange={(e) => setFormData({ ...formData, report_category: e.target.value })}
                  className="select"
                  required
                >
                  <option value="">Select category</option>
                  {reportCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="input"
                placeholder="Brief subject of your complaint"
                required
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={5}
                placeholder="Provide detailed information about your complaint"
                required
              />
            </div>

            <div>
              <label className="label">Related Tender Reference (if applicable)</label>
              <input
                type="text"
                value={formData.tender_reference}
                onChange={(e) => setFormData({ ...formData, tender_reference: e.target.value })}
                className="input"
                placeholder="e.g., NT/2026/03251"
              />
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <button
                type="button"
                onClick={() => navigate('/public')}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
