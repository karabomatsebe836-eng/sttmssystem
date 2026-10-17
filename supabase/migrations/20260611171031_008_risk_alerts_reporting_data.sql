-- Insert sample risk alerts
INSERT INTO risk_alerts (
  alert_reference, detection_type, risk_level, status,
  tender_id, supplier_id, contract_id, department_id,
  alert_title, alert_description, detection_data, risk_factors, risk_score,
  amount_involved, deviation_percentage,
  ai_confidence_score, ai_recommendation,
  assigned_to, assigned_at
) VALUES
('ALT-2026-001', 'REPEATED_WINNER', 'medium', 'under_review',
 (SELECT id FROM tenders WHERE reference_number = 'NT/2026/03251'),
 (SELECT id FROM suppliers WHERE company_registration_number = '2018/123456/07'),
 NULL, (SELECT id FROM departments WHERE code = 'DOE'),
 'Repeated Winner Pattern Detected',
 'Supplier has won 4 out of 5 tenders from this department in the past 12 months',
 '{"wins_in_period": 4, "total_tenders": 5, "period_months": 12, "win_rate": 0.80}',
 '{"High win rate", "Same awarding authority", "Short time period"}', 72,
 72000000.00, NULL,
 0.85, 'Investigate procurement process for potential bias or unfair practices',
 (SELECT id FROM users WHERE employee_id = 'EMP-004'), NOW() - INTERVAL '2 days'),

('ALT-2026-002', 'SINGLE_BID', 'medium', 'new',
 (SELECT id FROM tenders WHERE reference_number = 'DWS/2026/00126'),
 NULL, NULL, (SELECT id FROM departments WHERE code = 'DWS'),
 'Single Bid Received',
 'Tender received only one bid submission which may indicate limited competition or tailored specifications',
 '{"bids_received": 1, "days_open": 28, "estimated_value": 3500000}',
 '{"Lack of competition", "Possible tailored specs"}', 65,
 3500000.00, NULL,
 0.78, 'Review tender specifications for potential restrictive requirements',
 NULL, NULL),

('ALT-2026-003', 'BUDGET_OVERRUN', 'high', 'investigating',
 NULL, NULL, (SELECT id FROM contract_awards WHERE contract_number = 'C-2025-00156'),
 (SELECT id FROM departments WHERE code = 'DWS'),
 'Budget Overrun Detected',
 'Project expenditure is trending 18% above allocated budget',
 '{"budget_allocated": 3200000, "current_spent": 1280000, "projected_final": 3776000}',
 '{"Exceeding threshold", "Early stage overrun"}', 78,
 576000.00, 18.0,
 0.92, 'Immediate review of expenditure and scope required',
 (SELECT id FROM users WHERE employee_id = 'EMP-004'), NOW() - INTERVAL '1 day'),

('ALT-2026-004', 'PRICE_INFLATION', 'high', 'new',
 (SELECT id FROM tenders WHERE reference_number = 'NT/2026/03251'),
 (SELECT id FROM suppliers WHERE company_registration_number = '2017/456789/08'),
 NULL, (SELECT id FROM departments WHERE code = 'DOE'),
 'Anomalous Bid Price Detected',
 'Bid price deviates significantly from other bidders and market estimates',
 '{"bid_amount": 46200000, "average_bid": 44500000, "deviation": 0.038, "market_estimate": 43000000}',
 '{"Above market average", "Outlier in bid cluster"}', 71,
 46200000.00, 3.8,
 0.75, 'Detailed cost breakdown analysis recommended',
 NULL, NULL),

('ALT-2026-005', 'RAPID_PROCESS', 'low', 'resolved',
 (SELECT id FROM tenders WHERE reference_number = 'NT/2026/03252'),
 NULL, NULL, (SELECT id FROM departments WHERE code = 'DPWI'),
 'Rapid Tender Process',
 'Tender was published to closing in less than 14 days for a high-value procurement',
 '{"tender_value": 8500000, "publication_to_closing_days": 7, "standard_period": 21}',
 '{"Short response time"}', 45,
 8500000.00, NULL,
 0.68, 'No action required - justified by urgent operational need',
 (SELECT id FROM users WHERE employee_id = 'EMP-004'), NOW() - INTERVAL '7 days');

-- Insert milestone data for project
INSERT INTO project_milestones (project_id, milestone_name, description, planned_start_date, actual_start_date, planned_end_date, actual_end_date, completion_percentage, status, budget_amount, spent_amount, sort_order) VALUES
((SELECT id FROM project_monitoring WHERE project_name LIKE '%Water Treatment%'),
 'Project Mobilization', 'Site setup, team mobilization, and initial inspections', 
 CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '28 days', 
 CURRENT_DATE - INTERVAL '50 days', CURRENT_DATE - INTERVAL '48 days',
 100, 'completed', 320000.00, 310000.00, 1),

((SELECT id FROM project_monitoring WHERE project_name LIKE '%Water Treatment%'),
 'Equipment Inspection', 'Full inspection of all treatment plant equipment',
 CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '43 days',
 CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '28 days',
 100, 'completed', 400000.00, 395000.00, 2),

((SELECT id FROM project_monitoring WHERE project_name LIKE '%Water Treatment%'),
 'Minor Repairs Phase 1', 'First phase of equipment repairs and replacements',
 CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '22 days',
 CURRENT_DATE - INTERVAL '8 days', NULL,
 85, 'in_progress', 350000.00, 297500.00, 3),

((SELECT id FROM project_monitoring WHERE project_name LIKE '%Water Treatment%'),
 'Chemical Systems Optimization', 'Optimization of chemical dosing and treatment systems',
 CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '12 days',
 CURRENT_DATE + INTERVAL '25 days', NULL,
 35, 'in_progress', 280000.00, 98000.00, 4),

((SELECT id FROM project_monitoring WHERE project_name LIKE '%Water Treatment%'),
 'Safety Compliance Audit', 'Full safety audit and compliance implementation',
 CURRENT_DATE + INTERVAL '30 days', NULL,
 CURRENT_DATE + INTERVAL '60 days', NULL,
 0, 'pending', 150000.00, 0, 5),

((SELECT id FROM project_monitoring WHERE project_name LIKE '%Water Treatment%'),
 'Major Repairs Phase 2', 'Major equipment repairs and upgrades',
 CURRENT_DATE + INTERVAL '60 days', NULL,
 CURRENT_DATE + INTERVAL '120 days', NULL,
 0, 'pending', 650000.00, 0, 6),

((SELECT id FROM project_monitoring WHERE project_name LIKE '%Water Treatment%'),
 'Performance Testing', 'Final performance testing and optimization',
 CURRENT_DATE + INTERVAL '120 days', NULL,
 CURRENT_DATE + INTERVAL '150 days', NULL,
 0, 'pending', 200000.00, 0, 7),

((SELECT id FROM project_monitoring WHERE project_name LIKE '%Water Treatment%'),
 'Project Closeout', 'Final documentation, handover, and closeout',
 CURRENT_DATE + INTERVAL '150 days', NULL,
 CURRENT_DATE + INTERVAL '180 days', NULL,
 0, 'pending', 85000.00, 0, 8);

-- Insert contractor performance
INSERT INTO contractor_performance (
  contract_id, supplier_id, project_id,
  quality_score, timeliness_score, compliance_score, communication_score,
  budget_management_score, health_safety_score, overall_rating,
  deliverables_on_time, defect_rate, variation_requests,
  review_period, review_date, reviewed_by,
  strengths, weaknesses, recommendations, review_comments, status
) VALUES
((SELECT id FROM contract_awards WHERE contract_number = 'C-2025-00156'),
 (SELECT id FROM suppliers WHERE company_registration_number = '2018/123456/07'),
 (SELECT id FROM project_monitoring WHERE project_name LIKE '%Water Treatment%'),
 82, 78, 88, 75, 80, 85, 80.7,
 78, 5, 1,
 'Q1 2026', CURRENT_DATE - INTERVAL '15 days', (SELECT id FROM users WHERE employee_id = 'EMP-004'),
 'Strong technical capability, excellent safety record, good quality work',
 'Communication could be more proactive, minor delays in reporting',
 'Improve weekly progress reporting frequency, assign dedicated communication contact',
 'Overall satisfactory performance. Deliverables within specifications. Minor communication improvements needed.', 'submitted');

-- Insert public reports
INSERT INTO public_reports (
  report_reference, reporter_name, reporter_email, reporter_phone,
  report_type, report_category, subject, description,
  department_id, status, priority, submitted_at
) VALUES
('PBLC-2026-001', 'Concerned Citizen', 'citizen@email.com', '+27 11 123 4567',
 'complaint', 'procurement_process', 'Questionable tender award process',
 'I have observed what appears to be irregularities in the tender award process for the school construction project. The specifications seemed to favor a specific contractor.',
 (SELECT id FROM departments WHERE code = 'DOE'), 'under_review', 'medium', NOW() - INTERVAL '10 days'),

('PBLC-2026-002', 'Vendor Association', 'secretary@vendor.org.za', '+27 12 987 6543',
 'inquiry', 'tender_clarity', 'Request for tender specification clarification',
 'We request clarification on the technical specifications for the bridge construction tender, specifically regarding the material standards required.',
 (SELECT id FROM departments WHERE code = 'DOT'), 'resolved', 'low', NOW() - INTERVAL '20 days');

-- Insert whistleblower reports
INSERT INTO whistleblower_reports (
  report_reference, access_code, report_category, report_subject,
  incident_description, incident_date, incident_location,
  tender_reference, department, amount_involved,
  officials_involved, suppliers_mentioned,
  status, priority, submitted_at, investigation_status
) VALUES
('WB-2026-0001', 'ACC-7X9K-M3LQ-P4R2', 'bid_rigging', 'Suspected collusion in bridge construction tender',
 'Multiple bidders submitted prices within 0.5% of each other, suggesting possible price fixing. All losing bidders declined to contest the award.',
 CURRENT_DATE - INTERVAL '60 days', 'Gauteng Province',
 'DPWI/2026/00145', 'Public Works', 125000000.00,
 '{"Deputy Director Procurement"}', '{"KZN Civil and Building Contractors", "Mbokodo Infrastructure Solutions"}',
 'investigating', 'high', NOW() - INTERVAL '15 days', 'Evidence under review'),

('WB-2026-0002', 'ACC-2B5H-N8JW-T6Y3', 'corruption', 'Payment kickbacks in water services',
 'Reliable information indicates procurement officer receiving kickbacks for contract variations and expedited payments on water treatment contracts.',
 CURRENT_DATE - INTERVAL '90 days', 'Mpumalanga Province',
 'DWS/2026/00126', 'Water and Sanitation', 500000.00,
 '{"Procurement Manager DWS"}', '{"Mponeng Construction"}',
 'under_review', 'critical', NOW() - INTERVAL '5 days', 'Initial assessment pending');

-- Insert audit logs
INSERT INTO audit_logs (user_id, user_email, user_role, action, entity_type, entity_id, entity_reference, description, severity, created_at) VALUES
((SELECT id FROM users WHERE email = 'admin@sttms.gov.za'), 'admin@sttms.gov.za', 'admin', 'login', 'user', (SELECT id FROM users WHERE email = 'admin@sttms.gov.za'), 'EMP-001', 'Admin user logged in', 'info', NOW() - INTERVAL '1 hour'),
((SELECT id FROM users WHERE email = 'procurement@treasury.gov.za'), 'procurement@treasury.gov.za', 'procurement_officer', 'create', 'tender', (SELECT id FROM tenders WHERE reference_number = 'NT/2026/03251'), 'NT/2026/03251', 'New tender created', 'info', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE email = 'procurement@treasury.gov.za'), 'procurement@treasury.gov.za', 'procurement_officer', 'update', 'tender', (SELECT id FROM tenders WHERE reference_number = 'NT/2026/03251'), 'NT/2026/03251', 'Tender published', 'info', NOW() - INTERVAL '30 days');