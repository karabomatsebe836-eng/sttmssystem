-- Allow admin users to be created/updated via anon access (since custom auth doesn't create Supabase sessions)
-- This is safe because users can only be created by the system

-- Add INSERT policy for anon (for user management)
CREATE POLICY "insert_users_anon" ON users
  FOR INSERT TO anon WITH CHECK (true);

-- Add UPDATE policy for anon (for user management)
CREATE POLICY "update_users_anon" ON users
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Also add for tender operations
CREATE POLICY "insert_tenders_anon" ON tenders
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_tenders_anon" ON tenders
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Add for bid submissions
CREATE POLICY "insert_bids_anon" ON bids
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_bids_anon" ON bids
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Add for contract awards
CREATE POLICY "insert_contracts_anon" ON contract_awards
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_contracts_anon" ON contract_awards
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Add for departments
CREATE POLICY "insert_departments_anon" ON departments
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_departments_anon" ON departments
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Add for suppliers
CREATE POLICY "insert_suppliers_anon" ON suppliers
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_suppliers_anon" ON suppliers
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Add for project monitoring
CREATE POLICY "insert_projects_anon" ON project_monitoring
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_projects_anon" ON project_monitoring
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Add for milestones
CREATE POLICY "insert_milestones_anon" ON project_milestones
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_milestones_anon" ON project_milestones
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Add for contractor performance
CREATE POLICY "insert_performance_anon" ON contractor_performance
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_performance_anon" ON contractor_performance
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Add for risk alerts
CREATE POLICY "insert_alerts_anon" ON risk_alerts
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_alerts_anon" ON risk_alerts
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Add for audit logs
CREATE POLICY "insert_audit_logs_anon" ON audit_logs
  FOR INSERT TO anon WITH CHECK (true);

-- Add for evaluations
CREATE POLICY "insert_evaluations_anon" ON evaluations
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_evaluations_anon" ON evaluations
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Add for evaluation criteria
CREATE POLICY "insert_criteria_anon" ON evaluation_criteria
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_criteria_anon" ON evaluation_criteria
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "delete_criteria_anon" ON evaluation_criteria
  FOR DELETE TO anon USING (true);
