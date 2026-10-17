export type UserRole = 'admin' | 'procurement_officer' | 'supplier' | 'auditor' | 'public';

export interface Role {
  id: string;
  name: UserRole;
  description: string;
  permissions: string[];
}

export interface User {
  id: string;
  auth_user_id?: string;
  email: string;
  first_name: string;
  last_name: string;
  role_id: string;
  role?: Role;
  department_id?: string;
  department?: Department;
  employee_id?: string;
  phone?: string;
  is_active: boolean;
  email_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  budget_allocation: number;
  procurement_threshold: number;
  head_of_department?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  province?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  user_id?: string;
  company_name: string;
  company_registration_number: string;
  tax_number?: string;
  bbbee_level?: number;
  cidb_rating?: string;
  cidb_registration_number?: string;
  business_type?: string;
  years_in_business?: number;
  contact_person?: string;
  contact_email: string;
  contact_phone: string;
  physical_address: string;
  postal_address?: string;
  website?: string;
  is_verified: boolean;
  is_active: boolean;
  verification_date?: string;
  verified_by?: string;
  verification_docs: string[];
  specialties: string[];
  total_contracts_awarded: number;
  total_contract_value: number;
  created_at: string;
  updated_at: string;
}

export interface ProcurementCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
}

export type TenderStatus = 'draft' | 'published' | 'closed' | 'under_evaluation' | 'awarded' | 'cancelled' | 'archived';
export type TenderType = 'open' | 'restricted' | 'selective' | 'negotiated' | 'emergency' | 'framework';

export interface Tender {
  id: string;
  reference_number: string;
  title: string;
  description: string;
  department_id: string;
  department?: Department;
  category_id?: string;
  category?: ProcurementCategory;
  procurement_officer_id: string;
  procurement_officer?: User;
  tender_type: TenderType;
  status: TenderStatus;
  estimated_value: number;
  budget_source?: string;
  publication_date?: string;
  closing_date?: string;
  opening_date?: string;
  award_date?: string;
  completion_date?: string;
  eligibility_criteria?: string;
  technical_specifications?: string;
  mandatory_requirements?: string;
  scoring_criteria: Record<string, unknown>;
  tender_documents: TenderDocument[];
  delivery_province?: string;
  delivery_municipality?: string;
  delivery_address?: string;
  min_bbbee_level?: number;
  prefer_local: boolean;
  local_content_requirement?: number;
  views_count: number;
  downloads_count: number;
  bids_count: number;
  created_by?: string;
  modified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TenderDocument {
  name: string;
  url: string;
  size?: number;
  uploaded_at?: string;
}

export type BidStatus = 'draft' | 'submitted' | 'opened' | 'under_evaluation' | 'responsive' | 'non_responsive' | 'awarded' | 'rejected' | 'withdrawn';

export interface Bid {
  id: string;
  tender_id: string;
  tender?: Tender;
  supplier_id: string;
  supplier?: Supplier;
  bid_reference: string;
  status: BidStatus;
  bid_amount: number;
  total_bid_amount?: number;
  price_breakdown: Record<string, number>;
  technical_proposal?: string;
  methodology?: string;
  timeline_proposal?: string;
  team_proposal?: string;
  bbbee_certificate_url?: string;
  tax_clearance_url?: string;
  cidb_certificate_url?: string;
  compliance_docs: string[];
  bid_documents: BidDocument[];
  submission_date?: string;
  submission_ip?: string;
  technical_score?: number;
  financial_score?: number;
  bbbee_score?: number;
  total_score?: number;
  rank?: number;
  is_recommended: boolean;
  recommendation_notes?: string;
  opened_by?: string;
  evaluated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BidDocument {
  id: string;
  bid_id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  file_size?: number;
  uploaded_at: string;
  verification_status: string;
}

export interface EvaluationCriteria {
  id: string;
  tender_id: string;
  criterion_name: string;
  criterion_type: 'technical' | 'financial' | 'bbbee' | 'compliance';
  description?: string;
  weight: number;
  max_score: number;
  evaluation_guidelines?: string;
  is_mandatory: boolean;
  passing_score?: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  id: string;
  bid_id: string;
  evaluator_id: string;
  criterion_id?: string;
  score: number;
  weighted_score?: number;
  max_possible_score?: number;
  comments?: string;
  strengths?: string;
  weaknesses?: string;
  evaluation_status: string;
  evaluated_at: string;
  created_at: string;
}

export type ContractStatus = 'draft' | 'pending_signature' | 'active' | 'suspended' | 'completed' | 'terminated' | 'cancelled';

export interface ContractAward {
  id: string;
  contract_number: string;
  tender_id: string;
  tender?: Tender;
  winning_bid_id: string;
  winning_bid?: Bid;
  supplier_id: string;
  supplier?: Supplier;
  department_id: string;
  department?: Department;
  contract_title: string;
  contract_value: number;
  contract_start_date: string;
  contract_end_date: string;
  status: ContractStatus;
  variation_allowed: boolean;
  variation_limit: number;
  total_variations: number;
  payment_terms?: string;
  payment_schedule: PaymentSchedule[];
  total_paid: number;
  retention_amount?: number;
  performance_bond?: number;
  department_contact?: string;
  supplier_contact?: string;
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  contract_document_url?: string;
  supporting_documents: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentSchedule {
  milestone: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
}

export type ProjectStatus = 'not_started' | 'in_progress' | 'on_hold' | 'at_risk' | 'delayed' | 'completed' | 'terminated';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';

export interface ProjectMonitoring {
  id: string;
  contract_id: string;
  contract?: ContractAward;
  project_name: string;
  project_description?: string;
  budget_allocated: number;
  budget_spent: number;
  budget_remaining: number;
  contingency_budget: number;
  planned_start_date?: string;
  actual_start_date?: string;
  planned_end_date?: string;
  projected_end_date?: string;
  actual_end_date?: string;
  completion_percentage: number;
  status: ProjectStatus;
  days_behind: number;
  days_ahead: number;
  project_province?: string;
  project_municipality?: string;
  project_address?: string;
  gps_coordinates?: string;
  project_manager_supplier?: string;
  project_manager_department?: string;
  project_manager_phone?: string;
  total_milestones: number;
  completed_milestones: number;
  delayed_milestones: number;
  project_documents: string[];
  risk_level: string;
  risk_notes?: string;
  last_inspection_date?: string;
  next_inspection_date?: string;
  inspection_notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  project?: ProjectMonitoring;
  milestone_name: string;
  description?: string;
  planned_start_date?: string;
  actual_start_date?: string;
  planned_end_date?: string;
  actual_end_date?: string;
  completion_percentage: number;
  status: MilestoneStatus;
  budget_amount?: number;
  spent_amount: number;
  depends_on?: string;
  notes?: string;
  delay_reason?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContractorPerformance {
  id: string;
  contract_id: string;
  contract?: ContractAward;
  supplier_id: string;
  supplier?: Supplier;
  project_id?: string;
  project?: ProjectMonitoring;
  quality_score: number;
  timeliness_score: number;
  compliance_score: number;
  communication_score: number;
  budget_management_score: number;
  health_safety_score: number;
  overall_rating: number;
  deliverables_on_time: number;
  defect_rate: number;
  variation_requests: number;
  review_period?: string;
  review_date: string;
  reviewed_by?: string;
  strengths?: string;
  weaknesses?: string;
  recommendations?: string;
  review_comments?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_reference?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  changed_fields?: string[];
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  department_id?: string;
  tender_id?: string;
  supplier_id?: string;
  contract_id?: string;
  severity: string;
  description?: string;
  created_at: string;
}

export type AlertStatus = 'new' | 'under_review' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved' | 'escalated';
export type RiskLevelType = 'low' | 'medium' | 'high' | 'critical';

export interface RiskAlert {
  id: string;
  alert_reference: string;
  detection_type: string;
  risk_level: RiskLevelType;
  status: AlertStatus;
  tender_id?: string;
  tender?: Tender;
  supplier_id?: string;
  supplier?: Supplier;
  contract_id?: string;
  contract?: ContractAward;
  department_id?: string;
  department?: Department;
  user_id?: string;
  alert_title: string;
  alert_description: string;
  detection_data: Record<string, unknown>;
  risk_factors: string[];
  risk_score: number;
  amount_involved?: number;
  expected_amount?: number;
  actual_amount?: number;
  deviation_percentage?: number;
  ai_model_version?: string;
  ai_confidence_score?: number;
  ai_recommendation?: string;
  assigned_to?: string;
  assigned_at?: string;
  investigation_notes?: string;
  investigation_findings?: string;
  evidence: string[];
  resolution_notes?: string;
  resolution_action?: string;
  resolved_by?: string;
  resolved_at?: string;
  escalated_to?: string;
  escalated_at?: string;
  escalation_reason?: string;
  detected_at: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export type ReportStatus = 'pending' | 'under_review' | 'investigating' | 'resolved' | 'rejected';

export interface PublicReport {
  id: string;
  report_reference: string;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
  report_type: string;
  report_category: string;
  subject: string;
  description: string;
  tender_id?: string;
  tender?: Tender;
  contract_id?: string;
  contract?: ContractAward;
  department_id?: string;
  department?: Department;
  supplier_id?: string;
  supplier?: Supplier;
  status: ReportStatus;
  priority: string;
  attachments: string[];
  assigned_to?: string;
  assigned_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_type?: string;
  corrective_action_taken?: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface WhistleblowerReport {
  id: string;
  report_reference: string;
  access_code: string;
  report_category: string;
  report_subject: string;
  incident_description: string;
  incident_date?: string;
  incident_location?: string;
  involved_parties?: string;
  tender_reference?: string;
  contract_reference?: string;
  department?: string;
  amount_involved?: number;
  officials_involved: string[];
  suppliers_mentioned: string[];
  evidence_attachments: string[];
  evidence_description?: string;
  status: ReportStatus;
  priority: string;
  assigned_to?: string;
  assigned_at?: string;
  investigation_status?: string;
  investigation_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  is_credible?: boolean;
  credibility_assessment?: string;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  outcome?: string;
  actions_taken?: string;
  protection_requested: boolean;
  protection_granted: boolean;
  protection_details?: string;
  secure_messaging: string[];
  submitted_at: string;
  last_status_check?: string;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  user_id?: string;
  feedback_type: string;
  subject: string;
  message: string;
  rating?: number;
  page_url?: string;
  feature_area?: string;
  status: string;
  responded_by?: string;
  responded_at?: string;
  response?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_tenders: number;
  published_tenders: number;
  closed_tenders: number;
  awarded_tenders: number;
  total_procurement_value: number;
  total_awarded_value: number;
  active_contracts: number;
  completed_projects: number;
  active_projects: number;
  total_payments: number;
  total_suppliers: number;
  verified_suppliers: number;
  pending_bids: number;
  risk_alerts_new: number;
  risk_alerts_high: number;
  risk_alerts_resolved: number;
  public_reports_pending: number;
  whistleblower_reports_pending: number;
}
