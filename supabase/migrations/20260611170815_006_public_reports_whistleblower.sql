-- Public Reports Enum
CREATE TYPE report_status AS ENUM ('pending', 'under_review', 'investigating', 'resolved', 'rejected');

-- Public Complaints/Reports table
CREATE TABLE public_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_reference TEXT NOT NULL UNIQUE,
  
  -- Reporter Info (optional for public)
  reporter_name TEXT,
  reporter_email TEXT,
  reporter_phone TEXT,
  
  -- Report Details
  report_type TEXT NOT NULL,
  report_category TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Related Entity
  tender_id UUID REFERENCES tenders(id),
  contract_id UUID REFERENCES contract_awards(id),
  department_id UUID REFERENCES departments(id),
  supplier_id UUID REFERENCES suppliers(id),
  
  -- Status
  status report_status DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  
  -- Documents
  attachments JSONB DEFAULT '[]',
  
  -- Response
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  
  -- Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Resolution
  resolution_notes TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolution_type TEXT,
  corrective_action_taken TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Whistleblower Reports table (anonymous)
CREATE TABLE whistleblower_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_reference TEXT NOT NULL UNIQUE,
  access_code TEXT NOT NULL UNIQUE,
  
  -- Report Details
  report_category TEXT NOT NULL,
  report_subject TEXT NOT NULL,
  incident_description TEXT NOT NULL,
  
  -- When and Where
  incident_date DATE,
  incident_location TEXT,
  involved_parties TEXT,
  
  -- Related Information
  tender_reference TEXT,
  contract_reference TEXT,
  department TEXT,
  amount_involved DECIMAL(15,2),
  officials_involved TEXT[],
  suppliers_mentioned TEXT[],
  
  -- Evidence
  evidence_attachments JSONB DEFAULT '[]',
  evidence_description TEXT,
  
  -- Status
  status report_status DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  
  -- Investigation
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  investigation_status TEXT,
  investigation_notes TEXT,
  
  -- Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  is_credible BOOLEAN,
  credibility_assessment TEXT,
  
  -- Resolution
  resolution_notes TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  outcome TEXT,
  actions_taken TEXT,
  
  -- Protection Status
  protection_requested BOOLEAN DEFAULT FALSE,
  protection_granted BOOLEAN DEFAULT FALSE,
  protection_details TEXT,
  
  -- Anonymous Communication
  secure_messaging JSONB DEFAULT '[]',
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  last_status_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  
  -- Feedback Details
  feedback_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  
  -- Page/Feature Context
  page_url TEXT,
  feature_area TEXT,
  
  -- Status
  status TEXT DEFAULT 'new',
  
  -- Response
  responded_by UUID REFERENCES users(id),
  responded_at TIMESTAMPTZ,
  response TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Settings table
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT DEFAULT 'string',
  description TEXT,
  
  is_public BOOLEAN DEFAULT FALSE,
  
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('system_name', 'STTMS', 'string', 'System Name', true),
('system_full_name', 'Smart Tender Transparency and Monitoring System', 'string', 'Full System Name', true),
('currency', 'ZAR', 'string', 'System Currency', true),
('timezone', 'Africa/Johannesburg', 'string', 'System Timezone', true),
('date_format', 'DD/MM/YYYY', 'string', 'Date Format', true),
('tender_auto_close', 'true', 'boolean', 'Automatically close tenders at deadline', false),
('min_bid_bbbee_level', '1', 'integer', 'Minimum B-BBEE Level for Bids', true),
('alert_auto_assign', 'true', 'boolean', 'Automatically assign risk alerts', false),
('max_failed_logins', '5', 'integer', 'Maximum failed login attempts', false),
('session_timeout', '30', 'integer', 'Session timeout in minutes', false);

-- Dashboard Statistics cache table
CREATE TABLE dashboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_key TEXT NOT NULL UNIQUE,
  stat_value DECIMAL(15,2),
  stat_count INTEGER,
  stat_json JSONB,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE whistleblower_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_stats ENABLE ROW LEVEL SECURITY;

-- Policies for public reports
CREATE POLICY "select_own_reports" ON public_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_reports_public" ON public_reports FOR INSERT TO PUBLIC WITH CHECK (true);

-- Policies for whistleblower reports
CREATE POLICY "select_anonymous_reports" ON whistleblower_reports FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()));
CREATE POLICY "insert_whistleblower_reports" ON whistleblower_reports FOR INSERT TO PUBLIC WITH CHECK (true);

-- Policies for settings
CREATE POLICY "select_public_settings" ON system_settings FOR SELECT TO authenticated USING (is_public = true);
CREATE POLICY "select_all_settings_admin" ON system_settings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name = 'admin'));
CREATE POLICY "update_settings_admin" ON system_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name = 'admin'));