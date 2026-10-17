-- Bid Status Enum
CREATE TYPE bid_status AS ENUM (
  'draft', 'submitted', 'opened', 'under_evaluation', 'responsive', 'non_responsive', 'awarded', 'rejected', 'withdrawn'
);

-- Bids table
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID REFERENCES tenders(id) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  bid_reference TEXT NOT NULL UNIQUE,
  status bid_status DEFAULT 'draft',
  
  -- Pricing
  bid_amount DECIMAL(15,2) NOT NULL,
  total_bid_amount DECIMAL(15,2),
  price_breakdown JSONB DEFAULT '{}',
  
  -- Technical Proposal
  technical_proposal TEXT,
  methodology TEXT,
  timeline_proposal TEXT,
  team_proposal TEXT,
  
  -- Compliance
  bbbee_certificate_url TEXT,
  tax_clearance_url TEXT,
  cidb_certificate_url TEXT,
  compliance_docs JSONB DEFAULT '[]',
  
  -- Documents
  bid_documents JSONB DEFAULT '[]',
  
  -- Submission
  submission_date TIMESTAMPTZ,
  submission_ip TEXT,
  
  -- Evaluation Scores
  technical_score DECIMAL(5,2),
  financial_score DECIMAL(5,2),
  bbbee_score DECIMAL(5,2),
  total_score DECIMAL(5,2),
  rank INTEGER,
  
  -- Recommendations
  is_recommended BOOLEAN DEFAULT FALSE,
  recommendation_notes TEXT,
  
  -- Audit
  opened_by UUID REFERENCES users(id),
  evaluated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bid Documents table
CREATE TABLE bid_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID REFERENCES bids(id) NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id),
  verification_status TEXT DEFAULT 'pending',
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ
);

-- Evaluation Criteria table
CREATE TABLE evaluation_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID REFERENCES tenders(id) NOT NULL,
  criterion_name TEXT NOT NULL,
  criterion_type TEXT NOT NULL CHECK (criterion_type IN ('technical', 'financial', 'bbbee', 'compliance')),
  description TEXT,
  weight DECIMAL(5,2) NOT NULL CHECK (weight BETWEEN 0 AND 100),
  max_score INTEGER DEFAULT 100,
  evaluation_guidelines TEXT,
  is_mandatory BOOLEAN DEFAULT FALSE,
  passing_score DECIMAL(5,2),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluations table
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID REFERENCES bids(id) NOT NULL,
  evaluator_id UUID REFERENCES users(id) NOT NULL,
  criterion_id UUID REFERENCES evaluation_criteria(id),
  
  -- Scores
  score DECIMAL(5,2) NOT NULL,
  weighted_score DECIMAL(5,2),
  max_possible_score DECIMAL(5,2),
  
  -- Notes
  comments TEXT,
  strengths TEXT,
  weaknesses TEXT,
  
  -- Status
  evaluation_status TEXT DEFAULT 'completed',
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract Status Enum
CREATE TYPE contract_status AS ENUM (
  'draft', 'pending_signature', 'active', 'suspended', 'completed', 'terminated', 'cancelled'
);

-- Contract Awards table
CREATE TABLE contract_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL UNIQUE,
  tender_id UUID REFERENCES tenders(id) NOT NULL,
  winning_bid_id UUID REFERENCES bids(id) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  department_id UUID REFERENCES departments(id) NOT NULL,
  
  -- Contract Details
  contract_title TEXT NOT NULL,
  contract_value DECIMAL(15,2) NOT NULL,
  contract_start_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,
  status contract_status DEFAULT 'draft',
  
  -- Variations
  variation_allowed BOOLEAN DEFAULT TRUE,
  variation_limit DECIMAL(5,2) DEFAULT 20,
  total_variations DECIMAL(15,2) DEFAULT 0,
  
  -- Payment Terms
  payment_terms TEXT,
  payment_schedule JSONB DEFAULT '[]',
  
  -- Performance
  total_paid DECIMAL(15,2) DEFAULT 0,
  retention_amount DECIMAL(15,2),
  performance_bond DECIMAL(15,2),
  
  -- Contact Persons
  department_contact TEXT,
  supplier_contact TEXT,
  
  -- Approval
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Documents
  contract_document_url TEXT,
  supporting_documents JSONB DEFAULT '[]',
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_awards ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "select_bids_authenticated" ON bids FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_bids_suppliers" ON bids FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_bids_owners" ON bids FOR UPDATE TO authenticated USING (true);

CREATE POLICY "select_evaluations_authenticated" ON evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_evaluations_evaluators" ON evaluations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "select_contracts_all" ON contract_awards FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_contracts_procurement" ON contract_awards FOR INSERT TO authenticated WITH CHECK (true);