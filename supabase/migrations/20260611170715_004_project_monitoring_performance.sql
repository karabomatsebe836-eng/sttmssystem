-- Project Status Enum
CREATE TYPE project_status AS ENUM (
  'not_started', 'in_progress', 'on_hold', 'at_risk', 'delayed', 'completed', 'terminated'
);

-- Milestone Status Enum
CREATE TYPE milestone_status AS ENUM (
  'pending', 'in_progress', 'completed', 'delayed', 'cancelled'
);

-- Project Monitoring table
CREATE TABLE project_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contract_awards(id) NOT NULL,
  project_name TEXT NOT NULL,
  project_description TEXT,
  
  -- Budget Tracking
  budget_allocated DECIMAL(15,2) NOT NULL,
  budget_spent DECIMAL(15,2) DEFAULT 0,
  budget_remaining DECIMAL(15,2),
  contingency_budget DECIMAL(15,2) DEFAULT 0,
  
  -- Dates
  planned_start_date DATE,
  actual_start_date DATE,
  planned_end_date DATE,
  projected_end_date DATE,
  actual_end_date DATE,
  
  -- Progress
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  status project_status DEFAULT 'not_started',
  days_behind INTEGER DEFAULT 0,
  days_ahead INTEGER DEFAULT 0,
  
  -- Location
  project_province TEXT,
  project_municipality TEXT,
  project_address TEXT,
  gps_coordinates TEXT,
  
  -- People
  project_manager_supplier TEXT,
  project_manager_department TEXT,
  project_manager_phone TEXT,
  
  -- Statistics
  total_milestones INTEGER DEFAULT 0,
  completed_milestones INTEGER DEFAULT 0,
  delayed_milestones INTEGER DEFAULT 0,
  
  -- Documents
  project_documents JSONB DEFAULT '[]',
  
  -- Risk Assessment
  risk_level TEXT DEFAULT 'low',
  risk_notes TEXT,
  
  -- Audit
  last_inspection_date DATE,
  next_inspection_date DATE,
  inspection_notes TEXT,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Milestones table
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES project_monitoring(id) NOT NULL,
  milestone_name TEXT NOT NULL,
  description TEXT,
  
  -- Dates
  planned_start_date DATE,
  actual_start_date DATE,
  planned_end_date DATE,
  actual_end_date DATE,
  
  -- Progress
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  status milestone_status DEFAULT 'pending',
  
  -- Budget
  budget_amount DECIMAL(15,2),
  spent_amount DECIMAL(15,2) DEFAULT 0,
  
  -- Dependencies
  depends_on UUID REFERENCES project_milestones(id),
  
  -- Notes
  notes TEXT,
  delay_reason TEXT,
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor Performance table
CREATE TABLE contractor_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contract_awards(id) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  project_id UUID REFERENCES project_monitoring(id),
  
  -- Scores (1-100)
  quality_score DECIMAL(5,2) DEFAULT 0,
  timeliness_score DECIMAL(5,2) DEFAULT 0,
  compliance_score DECIMAL(5,2) DEFAULT 0,
  communication_score DECIMAL(5,2) DEFAULT 0,
  budget_management_score DECIMAL(5,2) DEFAULT 0,
  health_safety_score DECIMAL(5,2) DEFAULT 0,
  overall_rating DECIMAL(5,2) DEFAULT 0,
  
  -- Additional Metrics
  deliverables_on_time DECIMAL(5,2) DEFAULT 0,
  defect_rate DECIMAL(5,2) DEFAULT 0,
  variation_requests INTEGER DEFAULT 0,
  
  -- Reviews
  review_period TEXT,
  review_date DATE DEFAULT CURRENT_DATE,
  reviewed_by UUID REFERENCES users(id),
  
  -- Notes
  strengths TEXT,
  weaknesses TEXT,
  recommendations TEXT,
  review_comments TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor Performance History (snapshots)
CREATE TABLE contractor_performance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  performance_id UUID REFERENCES contractor_performance(id),
  
  review_date DATE NOT NULL,
  review_period TEXT,
  
  overall_rating DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  timeliness_score DECIMAL(5,2),
  compliance_score DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE project_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_performance_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "select_projects_all" ON project_monitoring FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_projects_procurement" ON project_monitoring FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_projects_procurement" ON project_monitoring FOR UPDATE TO authenticated USING (true);

CREATE POLICY "select_performance_all" ON contractor_performance FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_performance_auditors" ON contractor_performance FOR INSERT TO authenticated WITH CHECK (true);