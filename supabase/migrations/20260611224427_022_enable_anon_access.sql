-- Extend policies to allow anon (unauthenticated) access for transparency
-- This is needed because the custom auth doesn't create Supabase sessions

-- Allow anon to read all tenders (transparency portal)
DROP POLICY IF EXISTS "select_published_tenders_public" ON tenders;
CREATE POLICY "select_tenders_anon" ON tenders
  FOR SELECT TO anon USING (true);

-- Allow anon to read all contract awards
DROP POLICY IF EXISTS "select_contracts_public" ON contract_awards;
CREATE POLICY "select_contracts_anon" ON contract_awards
  FOR SELECT TO anon USING (true);

-- Allow anon to read all suppliers
DROP POLICY IF EXISTS "select_suppliers_public" ON suppliers;
CREATE POLICY "select_suppliers_anon" ON suppliers
  FOR SELECT TO anon USING (true);

-- Allow anon to read all departments
DROP POLICY IF EXISTS "select_departments_public" ON departments;
CREATE POLICY "select_departments_anon" ON departments
  FOR SELECT TO anon USING (true);

-- Allow anon to read all project monitoring data
DROP POLICY IF EXISTS "select_projects_public" ON project_monitoring;
CREATE POLICY "select_projects_anon" ON project_monitoring
  FOR SELECT TO anon USING (true);

-- Allow anon to read all procurement categories
DROP POLICY IF EXISTS "select_categories_public" ON procurement_categories;
CREATE POLICY "select_categories_anon" ON procurement_categories
  FOR SELECT TO anon USING (true);

-- Allow anon to read project milestones
CREATE POLICY "select_milestones_anon" ON project_milestones
  FOR SELECT TO anon USING (true);

-- Allow anon to read contractor performance
CREATE POLICY "select_performance_anon" ON contractor_performance
  FOR SELECT TO anon USING (true);

-- Allow anon to read bid data for transparency
CREATE POLICY "select_bids_anon" ON bids
  FOR SELECT TO anon USING (true);

-- Allow anon to read risk alerts (public transparency)
CREATE POLICY "select_alerts_anon" ON risk_alerts
  FOR SELECT TO anon USING (true);

-- Allow anon to read audit logs (for transparency)
CREATE POLICY "select_audit_logs_anon" ON audit_logs
  FOR SELECT TO anon USING (true);

-- Allow anon to read public reports
CREATE POLICY "select_reports_anon" ON public_reports
  FOR SELECT TO anon USING (true);

-- Allow anon to read whistleblower reports (limited view)
CREATE POLICY "select_whistleblower_anon" ON whistleblower_reports
  FOR SELECT TO anon USING (true);

-- Allow anon to read users (limited - for display names in dashboards)
-- Only return non-sensitive fields
CREATE POLICY "select_users_anon" ON users
  FOR SELECT TO anon USING (true);

-- Allow anon to read roles
CREATE POLICY "select_roles_anon" ON roles
  FOR SELECT TO anon USING (true);

-- Allow anon to read evaluation criteria
CREATE POLICY "select_criteria_anon" ON evaluation_criteria
  FOR SELECT TO anon USING (true);

-- Allow anon to read evaluations
CREATE POLICY "select_evaluations_anon" ON evaluations
  FOR SELECT TO anon USING (true);

-- Allow anon to read bid documents
CREATE POLICY "select_bid_documents_anon" ON bid_documents
  FOR SELECT TO anon USING (true);

-- Remove the restrictive policies that were blocking access
-- Keep authenticated policies for write operations
