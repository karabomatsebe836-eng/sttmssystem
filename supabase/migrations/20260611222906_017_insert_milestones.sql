-- Insert Project Milestones
INSERT INTO project_milestones (project_id, milestone_name, description, planned_start_date, actual_start_date, planned_end_date, actual_end_date, completion_percentage, status, budget_amount, spent_amount, sort_order) VALUES
-- Milestones for Soweto Health Centre (completed)
((SELECT id FROM project_monitoring WHERE project_name = 'Soweto Community Health Centre'), 'Site Preparation', 'Clearing and site establishment', '2021-03-15', '2021-03-20', '2021-04-15', '2021-04-12', 100, 'completed', 5000000.00, 4800000.00, 1),
((SELECT id FROM project_monitoring WHERE project_name = 'Soweto Community Health Centre'), 'Foundation Works', 'Excavation and foundation pouring', '2021-04-16', '2021-04-14', '2021-05-31', '2021-05-28', 100, 'completed', 12000000.00, 11500000.00, 2),
((SELECT id FROM project_monitoring WHERE project_name = 'Soweto Community Health Centre'), 'Superstructure', 'Building frame and walls', '2021-06-01', '2021-05-30', '2021-09-30', '2021-10-05', 100, 'completed', 25000000.00, 25000000.00, 3),
((SELECT id FROM project_monitoring WHERE project_name = 'Soweto Community Health Centre'), 'External Works', 'Roof, windows, and external finishes', '2021-10-01', '2021-10-10', '2021-12-31', '2021-12-28', 100, 'completed', 15000000.00, 14500000.00, 4),
((SELECT id FROM project_monitoring WHERE project_name = 'Soweto Community Health Centre'), 'Internal Fit-out', 'Electrical, plumbing, and finishes', '2022-01-01', '2021-12-29', '2022-04-30', '2022-04-25', 100, 'completed', 18000000.00, 18200000.00, 5),
((SELECT id FROM project_monitoring WHERE project_name = 'Soweto Community Health Centre'), 'Equipment Installation', 'Medical equipment and IT systems', '2022-05-01', '2022-04-26', '2022-06-30', '2022-06-25', 100, 'completed', 7500000.00, 7500000.00, 6),

-- Milestones for N3 Highway (completed)
((SELECT id FROM project_monitoring WHERE project_name = 'N3 Highway Rehabilitation Phase 1'), 'Site Establishment', 'Construction camp and traffic management', '2021-05-10', '2021-05-15', '2021-05-25', '2021-05-28', 100, 'completed', 15000000.00, 16000000.00, 1),
((SELECT id FROM project_monitoring WHERE project_name = 'N3 Highway Rehabilitation Phase 1'), 'Section 1 Rehabilitation', 'First 15km section resurfacing', '2021-05-26', '2021-06-01', '2021-09-30', '2021-10-10', 100, 'completed', 65000000.00, 68000000.00, 2),
((SELECT id FROM project_monitoring WHERE project_name = 'N3 Highway Rehabilitation Phase 1'), 'Bridge Repairs', '5 bridge structures repair', '2021-10-01', '2021-10-15', '2022-03-31', '2022-04-20', 100, 'completed', 45000000.00, 48000000.00, 3),
((SELECT id FROM project_monitoring WHERE project_name = 'N3 Highway Rehabilitation Phase 1'), 'Section 2 Rehabilitation', 'Remaining 30km section', '2022-04-01', '2022-04-25', '2022-12-31', '2023-01-15', 100, 'completed', 85000000.00, 92000000.00, 4),
((SELECT id FROM project_monitoring WHERE project_name = 'N3 Highway Rehabilitation Phase 1'), 'Safety Barriers', 'Guardrails and road marking', '2023-01-01', '2023-01-20', '2023-06-30', '2023-06-15', 100, 'completed', 18000000.00, 18000000.00, 5),
((SELECT id FROM project_monitoring WHERE project_name = 'N3 Highway Rehabilitation Phase 1'), 'Final Completion', ' snagging and handover', '2023-07-01', '2023-06-16', '2023-10-15', '2023-10-20', 100, 'completed', 10000000.00, 11000000.00, 6),

-- Milestones for Tshwane Smart City (ongoing)
((SELECT id FROM project_monitoring WHERE project_name = 'Tshwane Smart City Infrastructure'), 'Fiber Network Phase 1', 'Core backbone installation', '2022-04-01', '2022-04-05', '2022-09-30', '2022-10-15', 100, 'completed', 45000000.00, 47000000.00, 1),
((SELECT id FROM project_monitoring WHERE project_name = 'Tshwane Smart City Infrastructure'), 'Data Center', 'Tier III data center construction', '2022-10-01', '2022-10-20', '2023-06-30', '2023-07-31', 100, 'completed', 85000000.00, 90000000.00, 2),
((SELECT id FROM project_monitoring WHERE project_name = 'Tshwane Smart City Infrastructure'), 'IoT Sensor Network', 'Smart sensors deployment', '2023-07-01', '2023-08-01', '2024-03-31', NULL, 75, 'in_progress', 35000000.00, 26000000.00, 3),
((SELECT id FROM project_monitoring WHERE project_name = 'Tshwane Smart City Infrastructure'), 'Traffic Management System', 'Intelligent traffic control', '2024-01-01', '2024-01-15', '2024-09-30', NULL, 55, 'in_progress', 55000000.00, 30500000.00, 4),
((SELECT id FROM project_monitoring WHERE project_name = 'Tshwane Smart City Infrastructure'), 'Integration Platform', 'Data integration software', '2024-04-01', NULL, '2024-12-31', NULL, 20, 'pending', 45000000.00, 0, 5),

-- Milestones for Desalination Plant (ongoing)
((SELECT id FROM project_monitoring WHERE project_name = 'Desalination Plant Cape Town'), 'Site Preparation', 'Land clearing and preparation', '2023-08-01', '2023-08-10', '2023-10-31', '2023-11-15', 100, 'completed', 35000000.00, 38000000.00, 1),
((SELECT id FROM project_monitoring WHERE project_name = 'Desalination Plant Cape Town'), 'Intake Structure', 'Seawater intake construction', '2023-11-01', '2023-11-20', '2024-08-31', NULL, 65, 'in_progress', 145000000.00, 94250000.00, 2),
((SELECT id FROM project_monitoring WHERE project_name = 'Desalination Plant Cape Town'), 'RO Building', 'Reverse osmosis facility', '2024-09-01', NULL, '2025-12-31', NULL, 0, 'pending', 185000000.00, 0, 3),
((SELECT id FROM project_monitoring WHERE project_name = 'Desalination Plant Cape Town'), 'Solar Integration', 'Renewable energy system', '2025-06-01', NULL, '2026-06-30', NULL, 0, 'pending', 125000000.00, 0, 4),
((SELECT id FROM project_monitoring WHERE project_name = 'Desalination Plant Cape Town'), 'Commissioning', 'Testing and handover', '2026-04-01', NULL, '2026-12-31', NULL, 0, 'pending', 45000000.00, 0, 5),

-- Milestones for Solar Farm (ongoing)
((SELECT id FROM project_monitoring WHERE project_name = 'Solar Farm Northern Cape'), 'Site Preparation', 'Land grading and access roads', '2023-09-15', '2023-09-20', '2023-12-31', '2023-12-28', 100, 'completed', 45000000.00, 45000000.00, 1),
((SELECT id FROM project_monitoring WHERE project_name = 'Solar Farm Northern Cape'), 'Foundation Installation', 'Mounting structure foundations', '2024-01-01', '2024-01-05', '2024-06-30', '2024-07-20', 100, 'completed', 85000000.00, 92000000.00, 2),
((SELECT id FROM project_monitoring WHERE project_name = 'Solar Farm Northern Cape'), 'Panel Installation Phase 1', '50MW panel deployment', '2024-07-01', '2024-07-25', '2024-12-31', NULL, 80, 'in_progress', 195000000.00, 156000000.00, 3),
((SELECT id FROM project_monitoring WHERE project_name = 'Solar Farm Northern Cape'), 'Panel Installation Phase 2', '50MW panel deployment', '2025-01-01', NULL, '2025-06-30', NULL, 0, 'pending', 195000000.00, 0, 4),
((SELECT id FROM project_monitoring WHERE project_name = 'Solar Farm Northern Cape'), 'Grid Connection', 'Substation and transmission', '2025-07-01', NULL, '2026-03-31', NULL, 0, 'pending', 285000000.00, 0, 5),
((SELECT id FROM project_monitoring WHERE project_name = 'Solar Farm Northern Cape'), 'Commissioning', 'Testing and grid integration', '2026-04-01', NULL, '2026-06-30', NULL, 0, 'pending', 45000000.00, 0, 6),

-- Milestones for RDP Housing (delayed)
((SELECT id FROM project_monitoring WHERE project_name = 'RDP Housing Orange Farm'), 'Site Preparation', 'Bulk services and roads', '2022-07-30', '2022-08-05', '2022-10-31', '2022-11-30', 100, 'completed', 25000000.00, 28000000.00, 1),
((SELECT id FROM project_monitoring WHERE project_name = 'RDP Housing Orange Farm'), 'Phase 1 Units', '500 housing units', '2022-11-01', '2022-12-01', '2023-06-30', '2023-08-15', 100, 'completed', 75000000.00, 78000000.00, 2),
((SELECT id FROM project_monitoring WHERE project_name = 'RDP Housing Orange Farm'), 'Phase 2 Units', '500 housing units', '2023-07-01', '2023-08-20', '2024-02-28', '2024-04-30', 100, 'completed', 75000000.00, 80000000.00, 3),
((SELECT id FROM project_monitoring WHERE project_name = 'RDP Housing Orange Farm'), 'Phase 3 Units', '750 housing units', '2024-03-01', '2024-05-15', '2024-12-31', NULL, 45, 'in_progress', 110000000.00, 49500000.00, 4),
((SELECT id FROM project_monitoring WHERE project_name = 'RDP Housing Orange Farm'), 'Phase 4 Units', '750 housing units', '2025-01-01', NULL, '2025-08-31', NULL, 0, 'delayed', 110000000.00, 0, 5)
;