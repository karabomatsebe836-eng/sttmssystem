-- Suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  company_name TEXT NOT NULL,
  company_registration_number TEXT NOT NULL UNIQUE,
  tax_number TEXT,
  bbbee_level INTEGER CHECK (bbbee_level BETWEEN 1 AND 8),
  cidb_rating TEXT,
  cidb_registration_number TEXT,
  business_type TEXT,
  years_in_business INTEGER,
  contact_person TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  physical_address TEXT NOT NULL,
  postal_address TEXT,
  website TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_branch_code TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  verification_date TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  verification_docs JSONB DEFAULT '[]',
  specialties TEXT[] DEFAULT '{}',
  total_contracts_awarded INTEGER DEFAULT 0,
  total_contract_value DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procurement Categories (Central Supplier Database categories)
CREATE TABLE procurement_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES procurement_categories(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert procurement categories
INSERT INTO procurement_categories (name, code, description) VALUES
('Construction and Infrastructure', 'CON-INF', 'Construction, civil engineering, and infrastructure projects'),
('Information and Communication Technology', 'ICT', 'IT equipment, software, and telecommunications'),
('Professional Services', 'PROF-SERV', 'Consulting, advisory, and professional services'),
('Medical and Healthcare', 'MED-HEALTH', 'Medical equipment, supplies, and healthcare services'),
('Transport and Logistics', 'TRANSP-LOG', 'Vehicles, transport services, and logistics'),
('Office Equipment and Supplies', 'OFFICE', 'Office furniture, equipment, and consumables'),
('Security Services', 'SEC-SERV', 'Security services and equipment'),
('Cleaning and Hygiene', 'CLEAN-HYG', 'Cleaning services and hygiene products'),
('Water and Sanitation', 'WAT-SAN', 'Water infrastructure and sanitation services'),
('Energy and Power', 'ENERGY', 'Energy, power generation, and electrical services');

-- Tender Status Enum
CREATE TYPE tender_status AS ENUM (
  'draft', 'published', 'closed', 'under_evaluation', 'awarded', 'cancelled', 'archived'
);

-- Tender Type Enum
CREATE TYPE tender_type AS ENUM (
  'open', 'restricted', 'selective', 'negotiated', 'emergency', 'framework'
);

-- Tenders table
CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) NOT NULL,
  category_id UUID REFERENCES procurement_categories(id),
  procurement_officer_id UUID REFERENCES users(id) NOT NULL,
  tender_type tender_type DEFAULT 'open',
  status tender_status DEFAULT 'draft',
  
  -- Budget and Pricing
  estimated_value DECIMAL(15,2) NOT NULL,
  budget_source TEXT,
  
  -- Dates
  publication_date TIMESTAMPTZ,
  closing_date TIMESTAMPTZ,
  opening_date TIMESTAMPTZ,
  award_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  
  -- Requirements
  eligibility_criteria TEXT,
  technical_specifications TEXT,
  mandatory_requirements TEXT,
  scoring_criteria JSONB DEFAULT '{}',
  
  -- Documents
  tender_documents JSONB DEFAULT '[]',
  
  -- Location
  delivery_province TEXT,
  delivery_municipality TEXT,
  delivery_address TEXT,
  
  -- B-BBEE Requirements
  min_bbbee_level INTEGER,
  prefer_local BOOLEAN DEFAULT TRUE,
  local_content_requirement DECIMAL(5,2),
  
  -- Statistics
  views_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  bids_count INTEGER DEFAULT 0,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  modified_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "select_categories_all" ON procurement_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "select_suppliers_authenticated" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_own_supplier" ON suppliers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "insert_suppliers_authenticated" ON suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_own_supplier" ON suppliers FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "select_tenders_all" ON tenders FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_tenders_procurement" ON tenders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_tenders_procurement" ON tenders FOR UPDATE TO authenticated USING (true);