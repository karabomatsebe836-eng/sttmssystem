import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Trash2,
  Loader2,
  ShieldAlert,
  Brain,
  RefreshCw,
} from 'lucide-react';

interface SupplierDocument {
  id: string;
  document_category: string;
  document_type: string;
  document_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  verification_status: string;
  verification_notes: string | null;
  ai_confidence_score: number | null;
  ai_flags: string[];
  uploaded_at: string;
  verified_at: string | null;
}

interface SupplierInfo {
  id: string;
  company_name: string;
  document_verification_status: string;
  can_bid: boolean;
  is_verified: boolean;
}

const DOCUMENT_CATEGORIES: {
  category: string;
  label: string;
  description: string;
  docTypes: { type: string; label: string; mandatory?: boolean }[];
}[] = [
  {
    category: 'company_registration',
    label: 'Company Registration & Legal Documents',
    description: 'CIPC certificates, director IDs, board resolution, and proof of address.',
    docTypes: [
      { type: 'CIPC Registration Certificate (COR14.3)', label: 'CIPC Registration Certificate (COR14.3)', mandatory: true },
      { type: 'Notice of Incorporation (COR14.1)', label: 'Notice of Incorporation (COR14.1)' },
      { type: 'Director ID Copies', label: 'Certified Director ID Copies', mandatory: true },
      { type: 'Board Resolution', label: 'Board Resolution (authorising signatory)' },
      { type: 'Proof of Business Address', label: 'Proof of Business Address (utility bill / affidavit)' },
    ],
  },
  {
    category: 'tax_compliance',
    label: 'Tax & Compliance Documents',
    description: 'SARS tax compliance, CSD registration, and B-BBEE status.',
    docTypes: [
      { type: 'SARS Tax Compliance Status (TCS) PIN', label: 'SARS Tax Compliance Status (TCS) PIN', mandatory: true },
      { type: 'Tax Clearance Certificate', label: 'Tax Clearance Certificate' },
      { type: 'CSD Registration Summary Report', label: 'CSD Registration Summary Report (MAAA number)', mandatory: true },
      { type: 'B-BBEE Certificate', label: 'B-BBEE Certificate (SANAS-accredited)' },
      { type: 'B-BBEE Sworn Affidavit', label: 'B-BBEE Sworn Affidavit (EMEs / QSEs)' },
    ],
  },
  {
    category: 'sbd_forms',
    label: 'Standard Bidding Documents (SBD Forms)',
    description: 'Completed, signed, and submitted SBD forms as required per tender.',
    docTypes: [
      { type: 'SBD 1 - Invitation to Bid', label: 'SBD 1: Invitation to Bid' },
      { type: 'SBD 3.3 - Pricing Schedule', label: 'SBD 3.3: Pricing Schedule' },
      { type: 'SBD 4 - Declaration of Interest', label: 'SBD 4: Declaration of Interest' },
      { type: 'SBD 6.1 - Preference Points Claim Form', label: 'SBD 6.1: Preference Points Claim Form' },
      { type: 'SBD 8 - Past Supply Chain Practices', label: 'SBD 8: Declaration of Past SCM Practices' },
      { type: 'SBD 9 - Independent Bid Determination', label: 'SBD 9: Certificate of Independent Bid Determination', mandatory: true },
    ],
  },
  {
    category: 'technical',
    label: 'Technical & Sector-Specific Documents',
    description: 'Company profile, staff CVs, and industry-specific compliance certificates.',
    docTypes: [
      { type: 'Company Profile', label: 'Company Profile & Track Record', mandatory: true },
      { type: 'Staff CVs & Qualifications', label: 'Staff CVs & Qualifications' },
      { type: 'CIDB Grading Certificate', label: 'CIDB Grading Certificate (Construction)' },
      { type: 'COIDA Letter of Good Standing', label: 'COIDA Letter of Good Standing' },
      { type: 'PSIRA Registration', label: 'PSIRA Registration (Security)' },
      { type: 'NHBRC Registration', label: 'NHBRC Registration (Housing/Building)' },
      { type: 'Industry-Specific Compliance', label: 'Other Industry-Specific Compliance' },
    ],
  },
];

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  verified: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Verified' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Pending AI Review' },
  rejected: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10', label: 'Rejected' },
  corruption_flagged: { icon: ShieldAlert, color: 'text-danger', bg: 'bg-danger/10', label: 'Corruption Flag' },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export function SupplierDocumentsPage() {
  const { user } = useAuth();
  const [supplier, setSupplier] = useState<SupplierInfo | null>(null);
  const [documents, setDocuments] = useState<SupplierDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, company_name, document_verification_status, can_bid, is_verified')
        .eq('user_id', user.id)
        .maybeSingle();

      if (supplierError) throw supplierError;
      setSupplier(supplierData);

      if (supplierData) {
        const { data: docs, error: docsError } = await supabase
          .from('supplier_documents')
          .select('*')
          .eq('supplier_id', supplierData.id)
          .order('uploaded_at', { ascending: false });

        if (docsError) throw docsError;
        setDocuments(docs || []);
      }
    } catch (err) {
      console.error('Error fetching supplier documents:', err);
      setError('Could not load your documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    category: string,
    docType: string
  ) {
    const file = e.target.files?.[0];
    if (!file || !supplier) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const filePath = `${supplier.id}/${category}/${docType.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('supplier-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('supplier_documents').insert({
        supplier_id: supplier.id,
        user_id: user?.id,
        document_category: category,
        document_type: docType,
        document_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        verification_status: 'pending',
      });

      if (insertError) throw insertError;

      setSuccess(`${docType} uploaded successfully. AI verification is now running.`);
      await fetchData();

      const { data: newDoc } = await supabase
        .from('supplier_documents')
        .select('id')
        .eq('supplier_id', supplier.id)
        .eq('document_type', docType)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (newDoc) {
        await runVerification(newDoc.id);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function runVerification(docId: string) {
    setVerifying(docId);
    try {
      const { data, error: verifyError } = await supabase.functions.invoke('verify-supplier-documents', {
        body: { document_id: docId },
      });

      if (verifyError || !data?.success) {
        setError('AI verification could not complete. Please try again.');
        return;
      }

      await fetchData();

      if (data.verification?.status === 'corruption_flagged') {
        setError(`AI flagged this document as a potential corruption attempt: ${data.verification.notes}`);
      } else if (data.verification?.status === 'verified') {
        setSuccess('Document verified successfully by AI.');
      } else if (data.verification?.status === 'rejected') {
        setError(`Document rejected: ${data.verification.notes}`);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('AI verification failed. Please try again.');
    } finally {
      setVerifying(null);
    }
  }

  async function handleDelete(doc: SupplierDocument) {
    if (!confirm(`Delete "${doc.document_name}"? You can re-upload a replacement afterwards.`)) return;
    try {
      await supabase.storage.from('supplier-documents').remove([doc.file_path]);
      await supabase.from('supplier_documents').delete().eq('id', doc.id);
      await fetchData();
      setSuccess('Document deleted.');
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete document.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="card text-center py-12">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Supplier Profile Required</h2>
        <p className="text-text-muted">Please complete your supplier profile before uploading documents.</p>
      </div>
    );
  }

  const overallStatus = supplier.document_verification_status || 'pending';
  const statusConfig = STATUS_CONFIG[overallStatus] || STATUS_CONFIG['pending'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supplier Documents</h1>
          <p className="text-text-muted mt-1">
            Upload, verify, and manage your compliance documents. AI verification runs automatically.
          </p>
        </div>
      </div>

      {/* Verification Status Banner */}
      <div className={`card border-l-4 ${overallStatus === 'verified' ? 'border-l-success' : overallStatus === 'corruption_flagged' ? 'border-l-danger' : 'border-l-warning'}`}>
        <div className="card-body">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${statusConfig.bg}`}>
              <statusConfig.icon className={`w-8 h-8 ${statusConfig.color}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Overall Verification: {statusConfig.label}</h3>
              <p className="text-sm text-text-muted mt-1">
                {overallStatus === 'verified' && supplier.can_bid
                  ? 'All documents verified. You can now view and bid for tenders.'
                  : overallStatus === 'corruption_flagged'
                  ? 'One or more documents were flagged as suspicious. You cannot bid until this is resolved. A risk alert has been generated for review.'
                  : overallStatus === 'rejected'
                  ? 'One or more documents were rejected. Please re-upload valid versions.'
                  : 'Documents are pending AI verification. You cannot bid until all required documents are verified.'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`badge ${supplier.can_bid ? 'badge-success' : 'badge-danger'}`}>
                {supplier.can_bid ? 'Bidding Enabled' : 'Bidding Blocked'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-danger flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="alert-success flex items-start gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Document Categories */}
      {DOCUMENT_CATEGORIES.map((cat) => {
        const categoryDocs = documents.filter((d) => d.document_category === cat.category);

        return (
          <div key={cat.category} className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{cat.label}</h3>
                  <p className="text-sm text-text-muted mt-1">{cat.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-muted">
                    {categoryDocs.length} uploaded
                  </p>
                </div>
              </div>
            </div>
            <div className="card-body space-y-3">
              {cat.docTypes.map((docType) => {
                const existingDoc = categoryDocs.find((d) => d.document_type === docType.type);
                const docStatus = existingDoc?.verification_status || 'not_uploaded';
                const docConfig = STATUS_CONFIG[docStatus] || null;

                return (
                  <div
                    key={docType.type}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      existingDoc ? 'border-border' : 'border-dashed border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${docConfig ? docConfig.bg : 'bg-surface'}`}>
                        {docConfig ? (
                          <docConfig.icon className={`w-5 h-5 ${docConfig.color}`} />
                        ) : (
                          <FileText className="w-5 h-5 text-text-muted" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {docType.label}
                          {docType.mandatory && (
                            <span className="text-danger ml-1">*</span>
                          )}
                        </p>
                        {existingDoc ? (
                          <p className="text-sm text-text-muted truncate">
                            {existingDoc.document_name} · {formatBytes(existingDoc.file_size || 0)}
                            {existingDoc.ai_confidence_score !== null && (
                              <span className="ml-2">AI Confidence: {existingDoc.ai_confidence_score}%</span>
                            )}
                          </p>
                        ) : (
                          <p className="text-sm text-text-muted">Not uploaded</p>
                        )}
                        {existingDoc?.verification_notes && (
                          <p className={`text-xs mt-1 ${docConfig?.color || 'text-text-muted'}`}>
                            {existingDoc.verification_notes}
                          </p>
                        )}
                        {existingDoc?.ai_flags && existingDoc.ai_flags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {existingDoc.ai_flags.map((flag) => (
                              <span key={flag} className="badge badge-danger text-xs">
                                {flag.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {existingDoc && verifying === existingDoc.id && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                      {existingDoc && (
                        <button
                          onClick={() => runVerification(existingDoc.id)}
                          disabled={verifying === existingDoc.id}
                          className="btn btn-ghost btn-sm"
                          title="Re-run AI verification"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      {existingDoc && (
                        <button
                          onClick={() => handleDelete(existingDoc)}
                          className="btn btn-ghost btn-sm text-danger"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <label className="btn btn-sm btn-outline cursor-pointer">
                        <Upload className="w-4 h-4" />
                        {existingDoc ? 'Replace' : 'Upload'}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => handleUpload(e, cat.category, docType.type)}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* AI Verification Info */}
      <div className="card bg-primary/5 border-l-4 border-l-primary">
        <div className="card-body">
          <div className="flex items-start gap-3">
            <Brain className="w-6 h-6 text-primary flex-shrink-0" />
            <div>
              <h4 className="font-semibold">How AI Document Verification Works</h4>
              <p className="text-sm text-text-muted mt-1">
                When you upload a document, the AI verification system checks file type, size, naming patterns,
                and content consistency against expected document standards. Documents that show signs of
                tampering, suspicious filenames, or invalid formats are flagged as corruption attempts and
                automatically generate a risk alert for auditors. Only suppliers with all documents verified
                can bid for tenders. Mandatory documents (marked with *) must all pass verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
