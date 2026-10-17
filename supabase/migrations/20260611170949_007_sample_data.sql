-- Create secure password hashing function
CREATE OR REPLACE FUNCTION hash_password(password TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN encode(sha256(password::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Insert Demo Users
INSERT INTO users (email, password_hash, first_name, last_name, role_id, department_id, employee_id, phone, is_active, email_verified) VALUES
('admin@sttms.gov.za', hash_password('admin123'), 'System', 'Administrator', (SELECT id FROM roles WHERE name = 'admin'), (SELECT id FROM departments WHERE code = 'NT'), 'EMP-001', '+27 12 394 0000', true, true),
('procurement@treasury.gov.za', hash_password('procurement123'), 'Thandi', 'Mokoena', (SELECT id FROM roles WHERE name = 'procurement_officer'), (SELECT id FROM departments WHERE code = 'NT'), 'EMP-002', '+27 12 394 0001', true, true),
('procurement2@dpwi.gov.za', hash_password('procurement123'), 'Johan', 'van der Merwe', (SELECT id FROM roles WHERE name = 'procurement_officer'), (SELECT id FROM departments WHERE code = 'DPWI'), 'EMP-003', '+27 12 394 0002', true, true),
('auditor@auditor.gov.za', hash_password('auditor123'), 'Sibusiso', 'Mahlangu', (SELECT id FROM roles WHERE name = 'auditor'), (SELECT id FROM departments WHERE code = 'NT'), 'EMP-004', '+27 12 394 0003', true, true),
('supplier@construction.co.za', hash_password('supplier123'), 'Moses', 'Ndaba', (SELECT id FROM roles WHERE name = 'supplier'), NULL, NULL, '+27 11 555 0001', true, true);

-- Insert Suppliers
INSERT INTO suppliers (user_id, company_name, company_registration_number, tax_number, bbbee_level, cidb_rating, cidb_registration_number, business_type, years_in_business, contact_person, contact_email, contact_phone, physical_address, is_verified, verification_date, specialties) VALUES
((SELECT id FROM users WHERE email = 'supplier@construction.co.za'), 'Mponeng Construction (Pty) Ltd', '2018/123456/07', '9234567890', 2, '4CE', 'CIDB-12345', 'Construction', 12, 'Moses Ndaba', 'moses@mponeng.co.za', '+27 11 555 0001', '123 Main Street, Johannesburg, Gauteng', true, NOW(), '{"Construction", "Civil Works", "Renovations"}'),
(NULL, 'Mbokodo Infrastructure Solutions', '2019/234567/08', '9345678901', 1, '5CE', 'CIDB-23456', 'Infrastructure', 8, 'Nomsa Dlamini', 'nomsa@mbokodo.co.za', '+27 12 333 0002', '456 Empire Road, Pretoria, Gauteng', true, NOW(), '{"Roads", "Bridges", "Bulk Services"}'),
(NULL, 'TechSavvy Solutions SA', '2020/345678/09', '9456789012', 1, 'N/A', 'N/A', 'ICT', 6, 'David Khumalo', 'david@techsavvy.co.za', '+27 21 444 0003', '789 Long Street, Cape Town, Western Cape', true, NOW(), '{"ICT", "Software Development", "Networking"}'),
(NULL, 'KZN Civil and Building Contractors', '2017/456789/08', '9567890123', 2, '3GB', 'CIDB-34567', 'Construction', 15, 'Sipho Ndlovu', 'sipho@kzncivil.co.za', '+27 31 555 0004', '321 Florida Road, Durban, KwaZulu-Natal', true, NOW(), '{"Building", "Civil Works", "Renovations"}'),
(NULL, 'Mpumalanga Stoneworks', '2018/567890/07', '9678901234', 3, '2GB', 'CIDB-45678', 'Construction', 10, 'Grace Mokoena', 'grace@stoneworks.co.za', '+27 13 666 0005', '567 Samora Machel, Nelspruit, Mpumalanga', true, NOW(), '{"Stoneworks", "Paving", "Landscaping"}');

-- Update department details
UPDATE departments SET 
  address = '240 Madiba Street, Pretoria, 0001',
  province = 'Gauteng',
  head_of_department = 'Dr. D. T. Kganyago'
WHERE code = 'NT';

UPDATE departments SET 
  address = '142 Madiba Street, Pretoria, 0001',
  province = 'Gauteng',
  head_of_department = 'Mr. M. Sibiya'
WHERE code = 'DPWI';

-- Insert Tender Sample Data
INSERT INTO tenders (
  reference_number, title, description, department_id, category_id, procurement_officer_id, 
  tender_type, status, estimated_value, publication_date, closing_date, 
  delivery_province, min_bbbee_level, prefer_local, created_by
) VALUES
('NT/2026/03251', 'Construction of New Primary School in Soweto', 
 'Construction of a new primary school facility comprising 24 classrooms, administration block, library, computer room, ablution facilities, kitchen, hall, sports fields with associated civil works.', 
 (SELECT id FROM departments WHERE code = 'DOE'), 
 (SELECT id FROM procurement_categories WHERE code = 'CON-INF'),
 (SELECT id FROM users WHERE employee_id = 'EMP-002'),
 'open', 'published', 45000000.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '14 days',
 'Gauteng', 2, true, (SELECT id FROM users WHERE employee_id = 'EMP-002')),

('NT/2026/03252', 'Supply of Office Furniture for Government Building', 
 'Supply and installation of office furniture including 500 desks, 500 chairs, 100 filing cabinets, and 50 meeting room tables.', 
 (SELECT id FROM departments WHERE code = 'DPWI'),
 (SELECT id FROM procurement_categories WHERE code = 'OFFICE'),
 (SELECT id FROM users WHERE employee_id = 'EMP-003'),
 'open', 'published', 8500000.00, NOW() - INTERVAL '21 days', NOW() + INTERVAL '7 days',
 'Gauteng', 2, true, (SELECT id FROM users WHERE employee_id = 'EMP-003')),

('DPWI/2026/00145', 'Road Rehabilitation Project - N1 Highway Section', 
 'Rehabilitation of 25km section of N1 highway including resurfacing, bridge repairs, drainage upgrades, and road marking.',
 (SELECT id FROM departments WHERE code = 'DOT'),
 (SELECT id FROM procurement_categories WHERE code = 'CON-INF'),
 (SELECT id FROM users WHERE employee_id = 'EMP-003'),
 'open', 'published', 125000000.00, NOW() - INTERVAL '45 days', NOW() + INTERVAL '21 days',
 'Gauteng', 1, true, (SELECT id FROM users WHERE employee_id = 'EMP-003')),

('NT/2026/00333', 'ICT Infrastructure Upgrade - Network Equipment', 
 'Supply, installation and configuration of network equipment including switches, routers, firewalls, and wireless access points for 50 government offices.',
 (SELECT id FROM departments WHERE code = 'NT'),
 (SELECT id FROM procurement_categories WHERE code = 'ICT'),
 (SELECT id FROM users WHERE employee_id = 'EMP-002'),
 'open', 'published', 15000000.00, NOW() - INTERVAL '14 days', NOW() + INTERVAL '30 days',
 'Gauteng', 1, true, (SELECT id FROM users WHERE employee_id = 'EMP-002')),

('DWS/2026/00126', 'Water Treatment Plant Maintenance', 
 'Annual maintenance services for water treatment plant including equipment checks, repairs, chemical management, and safety compliance.',
 (SELECT id FROM departments WHERE code = 'DWS'),
 (SELECT id FROM procurement_categories WHERE code = 'WAT-SAN'),
 (SELECT id FROM users WHERE employee_id = 'EMP-002'),
 'restricted', 'published', 3500000.00, NOW() - INTERVAL '28 days', NOW() - INTERVAL '2 days',
 'Mpumalanga', 2, true, (SELECT id FROM users WHERE employee_id = 'EMP-002')),

('DHS/2026/00337', 'Medical Equipment Supply - Rural Clinics', 
 'Supply of medical equipment for 20 rural clinics including patient monitors, diagnostic equipment, sterilization units, and emergency medical kits.',
 (SELECT id FROM departments WHERE code = 'DOH'),
 (SELECT id FROM procurement_categories WHERE code = 'MED-HEALTH'),
 (SELECT id FROM users WHERE employee_id = 'EMP-002'),
 'open', 'published', 22000000.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '25 days',
 'KwaZulu-Natal', 1, true, (SELECT id FROM users WHERE employee_id = 'EMP-002'));

-- Insert bids for tenders
INSERT INTO bids (
  tender_id, supplier_id, bid_reference, status, bid_amount, 
  technical_proposal, methodology, submission_date, 
  bbbee_certificate_url, tax_clearance_url
) VALUES
((SELECT id FROM tenders WHERE reference_number = 'NT/2026/03251'),
 (SELECT id FROM suppliers WHERE company_registration_number = '2018/123456/07'),
 'BID-NT/2026/03251-001', 'submitted', 42500000.00,
 'Comprehensive proposal for school construction with innovative green building solutions...',
 'Phase 1: Site preparation (2 months), Phase 2: Foundation works (3 months), Phase 3: Structure (4 months)...',
 NOW() - INTERVAL '5 days',
 '/docs/bbbee-cert-001.pdf', '/docs/tax-clearance-001.pdf'),

((SELECT id FROM tenders WHERE reference_number = 'NT/2026/03251'),
 (SELECT id FROM suppliers WHERE company_registration_number = '2019/234567/08'),
 'BID-NT/2026/03251-002', 'submitted', 44800000.00,
 'Full-service infrastructure solution for educational facility...',
 'Stage 1: Planning & mobilization, Stage 2: Civil works...',
 NOW() - INTERVAL '3 days',
 '/docs/bbbee-cert-002.pdf', '/docs/tax-clearance-002.pdf'),

((SELECT id FROM tenders WHERE reference_number = 'NT/2026/03251'),
 (SELECT id FROM suppliers WHERE company_registration_number = '2017/456789/08'),
 'BID-NT/2026/03251-003', 'submitted', 46200000.00,
 'Quality-focused construction proposal with extensive experience in school projects...',
 'Month 1-2: Groundworks, Month 3-6: Construction...',
 NOW() - INTERVAL '2 days',
 '/docs/bbbee-cert-003.pdf', '/docs/tax-clearance-003.pdf');

-- Insert contract awards for completed tender
INSERT INTO contract_awards (
  contract_number, tender_id, winning_bid_id, supplier_id, department_id,
  contract_title, contract_value, contract_start_date, contract_end_date,
  status, approved_by, approved_at, performance_bond, retention_amount
) VALUES
('C-2025-00156', 
 (SELECT id FROM tenders WHERE reference_number = 'DWS/2026/00126'),
 (SELECT id FROM bids WHERE bid_reference = 'BID-NT/2026/03251-001'),
 (SELECT id FROM suppliers WHERE company_registration_number = '2018/123456/07'),
 (SELECT id FROM departments WHERE code = 'DWS'),
 'Water Treatment Plant Maintenance - 2025/26', 3200000.00,
 CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '305 days',
 'active', (SELECT id FROM users WHERE employee_id = 'EMP-002'), NOW() - INTERVAL '60 days', 160000.00, 64000.00);

-- Insert project monitoring entry
INSERT INTO project_monitoring (
  contract_id, project_name, project_description,
  budget_allocated, budget_spent, budget_remaining,
  planned_start_date, actual_start_date, planned_end_date,
  status, completion_percentage, project_province,
  project_manager_supplier, project_manager_department,
  total_milestones, completed_milestones, delayed_milestones,
  risk_level, created_by
) VALUES
((SELECT id FROM contract_awards WHERE contract_number = 'C-2025-00156'),
 'Water Treatment Plant Maintenance - Mpumalanga',
 'Annual maintenance services for Nelspruit Water Treatment Plant including equipment servicing, safety checks, and performance optimization.',
 3200000.00, 1280000.00, 1920000.00,
 CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '55 days', CURRENT_DATE + INTERVAL '305 days',
 'in_progress', 28.00, 'Mpumalanga',
 'Grace Mokoena', 'Thandi Mokoena',
 8, 4, 1, 'low', (SELECT id FROM users WHERE employee_id = 'EMP-002'));