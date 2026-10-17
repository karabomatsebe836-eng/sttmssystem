-- Audit Log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  user_email TEXT,
  user_role TEXT,
  
  -- Action Details
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_reference TEXT,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  
  -- Additional Context
  department_id UUID REFERENCES departments(id),
  tender_id UUID REFERENCES tenders(id),
  supplier_id UUID REFERENCES suppliers(id),
  contract_id UUID REFERENCES contract_awards(id),
  
  -- Metadata
  severity TEXT DEFAULT 'info',
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Risk Alert Status Enum
CREATE TYPE alert_status AS ENUM ('new', 'under_review', 'investigating', 'confirmed', 'false_positive', 'resolved', 'escalated');

-- Risk Level Enum
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Risk Alerts table
CREATE TABLE risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_reference TEXT NOT NULL UNIQUE,
  
  -- Detection
  detection_type TEXT NOT NULL,
  risk_level risk_level DEFAULT 'low',
  status alert_status DEFAULT 'new',
  
  -- Context
  tender_id UUID REFERENCES tenders(id),
  supplier_id UUID REFERENCES suppliers(id),
  contract_id UUID REFERENCES contract_awards(id),
  department_id UUID REFERENCES departments(id),
  user_id UUID REFERENCES users(id),
  
  -- Alert Details
  alert_title TEXT NOT NULL,
  alert_description TEXT NOT NULL,
  detection_data JSONB DEFAULT '{}',
  risk_factors TEXT[],
  risk_score DECIMAL(5,2) DEFAULT 0,
  
  -- Values
  amount_involved DECIMAL(15,2),
  expected_amount DECIMAL(15,2),
  actual_amount DECIMAL(15,2),
  deviation_percentage DECIMAL(5,2),
  
  -- AI Detection
  ai_model_version TEXT,
  ai_confidence_score DECIMAL(5,2),
  ai_recommendation TEXT,
  
  -- Investigation
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  investigation_notes TEXT,
  investigation_findings TEXT,
  evidence JSONB DEFAULT '[]',
  
  -- Resolution
  resolution_notes TEXT,
  resolution_action TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  
  -- Escalation
  escalated_to UUID REFERENCES users(id),
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,
  
  -- Timestamps
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk Patterns (for AI detection rules)
CREATE TABLE risk_detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_code TEXT NOT NULL UNIQUE,
  rule_type TEXT NOT NULL,
  description TEXT,
  detection_query TEXT,
  threshold_value DECIMAL(10,4),
  threshold_operator TEXT,
  severity_weight DECIMAL(5,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default detection rules
INSERT INTO risk_detection_rules (rule_name, rule_code, rule_type, description, threshold_value, severity_weight) VALUES
('Repeated Winner Pattern', 'REPEATED_WINNER', 'pattern', 'Same supplier wins multiple tenders within short period', 3, 7),
('Single Bid Alert', 'SINGLE_BID', 'pattern', 'Tender receives only one bid', 1, 5),
('Bid Price Clustering', 'BID_CLUSTERING', 'anomaly', 'Similar bid amounts across different bidders', 0.1, 6),
('Price Inflated', 'PRICE_INFLATION', 'anomaly', 'Contract price significantly higher than original bid', 0.25, 8),
('Budget Overrun', 'BUDGET_OVERRUN', 'anomaly', 'Project expenditure exceeds budget significantly', 0.15, 6),
('Conflict of Interest', 'CONFLICT_INTEREST', 'flag', 'Potential conflict of interest detected', 1, 9),
('Rapid Tender Process', 'RAPID_PROCESS', 'anomaly', 'Abnormally fast tender process', 3, 5);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_detection_rules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "select_audit_logs_all" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_audit_logs_system" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "select_alerts_all" ON risk_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_alerts_system" ON risk_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_alerts_investigators" ON risk_alerts FOR UPDATE TO authenticated USING (true);