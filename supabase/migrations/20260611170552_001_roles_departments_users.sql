-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', 'System Administrator - Full system access'),
('procurement_officer', 'Procurement Officer - Manages tenders and contracts'),
('supplier', 'Supplier - Submits bids and manages company profile'),
('auditor', 'Auditor - Reviews activities and investigates alerts'),
('public', 'Public User - Limited read access');

-- Departments table (South African Government Departments)
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  budget_allocation DECIMAL(15,2) DEFAULT 0,
  procurement_threshold DECIMAL(15,2) DEFAULT 500000,
  head_of_department TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  province TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert South African Government Departments
INSERT INTO departments (name, code, description, budget_allocation, province) VALUES
('National Treasury', 'NT', 'National Treasury of South Africa', 2500000000.00, 'Gauteng'),
('Department of Public Works and Infrastructure', 'DPWI', 'Public Works and Infrastructure', 1800000000.00, 'Gauteng'),
('Department of Health', 'DOH', 'National Department of Health', 3200000000.00, 'Gauteng'),
('Department of Education', 'DOE', 'Basic Education Department', 2800000000.00, 'Gauteng'),
('Department of Transport', 'DOT', 'National Department of Transport', 1500000000.00, 'Gauteng'),
('Department of Water and Sanitation', 'DWS', 'Water and Sanitation Department', 2200000000.00, 'Gauteng'),
('Department of Energy', 'DOE-EN', 'Department of Mineral Resources and Energy', 1900000000.00, 'Gauteng'),
('South African Police Service', 'SAPS', 'South African Police Service', 2100000000.00, 'Gauteng'),
('Department of Defence', 'DOD', 'Department of Defence', 2400000000.00, 'Gauteng'),
('Department of Home Affairs', 'DHA', 'Department of Home Affairs', 850000000.00, 'Gauteng'),
('Gauteng Provincial Treasury', 'GPT', 'Gauteng Provincial Treasury', 1200000000.00, 'Gauteng'),
('Western Cape Government', 'WCG', 'Western Cape Provincial Government', 980000000.00, 'Western Cape'),
('KwaZulu-Natal Provincial Government', 'KZN', 'KZN Provincial Government', 1450000000.00, 'KwaZulu-Natal'),
('City of Johannesburg', 'COJ', 'City of Johannesburg Metropolitan', 750000000.00, 'Gauteng'),
('City of Cape Town', 'CCT', 'City of Cape Town Metropolitan', 680000000.00, 'Western Cape');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role_id UUID REFERENCES roles(id) NOT NULL,
  department_id UUID REFERENCES departments(id),
  employee_id TEXT UNIQUE,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles
CREATE POLICY "select_roles_authenticated" ON roles FOR SELECT
  TO authenticated USING (true);

-- RLS Policies for departments
CREATE POLICY "select_departments_authenticated" ON departments FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_departments_admin" ON departments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name = 'admin')
  );
CREATE POLICY "update_departments_admin" ON departments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name = 'admin')
  );

-- RLS Policies for users
CREATE POLICY "select_own_user" ON users FOR SELECT
  TO authenticated USING (auth.uid() = id);
CREATE POLICY "select_all_users_admin" ON users FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name = 'admin')
  );
CREATE POLICY "insert_users_admin" ON users FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name = 'admin')
  );
CREATE POLICY "update_own_user" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id);
CREATE POLICY "update_users_admin" ON users FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name = 'admin')
  );