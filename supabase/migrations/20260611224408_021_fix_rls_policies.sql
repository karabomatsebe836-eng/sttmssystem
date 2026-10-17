-- Add missing policies for project_milestones
CREATE POLICY "select_milestones_all" ON project_milestones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_milestones_procurement" ON project_milestones
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "update_milestones_procurement" ON project_milestones
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Add policies for evaluation_criteria
CREATE POLICY "select_criteria_all" ON evaluation_criteria
  FOR SELECT TO authenticated USING (true);

-- Add policies for bid_documents
CREATE POLICY "select_bid_documents_all" ON bid_documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_bid_documents_owners" ON bid_documents
  FOR INSERT TO authenticated WITH CHECK (true);

-- Add policies for feedback
CREATE POLICY "insert_feedback_all" ON feedback
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "select_feedback_admin" ON feedback
  FOR SELECT TO authenticated USING (true);

-- IMPORTANT: Add public read access for key transparency tables
-- This allows the public portal and dashboards to work without Supabase Auth

-- Tenders - public can read published tenders
CREATE POLICY "select_published_tenders_public" ON tenders
  FOR SELECT TO anon USING (status = 'published');

-- Contract Awards - public can read awarded contracts
CREATE POLICY "select_contracts_public" ON contract_awards
  FOR SELECT TO anon USING (true);

-- Departments - public can read active departments
CREATE POLICY "select_departments_public" ON departments
  FOR SELECT TO anon USING (is_active = true);

-- Suppliers - public can read verified suppliers
CREATE POLICY "select_suppliers_public" ON suppliers
  FOR SELECT TO anon USING (is_verified = true);

-- Project Monitoring - public can read project progress
CREATE POLICY "select_projects_public" ON project_monitoring
  FOR SELECT TO anon USING (true);

-- Procurement Categories - public can read active categories
CREATE POLICY "select_categories_public" ON procurement_categories
  FOR SELECT TO anon USING (is_active = true);

-- Risk Alerts - allow authenticated users to read (for auditor dashboard)
-- Already have select_alerts_all for authenticated

-- Audit Logs - already has select_audit_logs_all for authenticated

-- Bids - public/anonymous users can't read bids, only authenticated
-- Already have select_bids_authenticated

-- Public Reports - allow public to insert
-- Already have insert_reports_public for public role

-- Whistleblower Reports - allow public to insert
-- Already have insert_whistleblower_reports for public role

-- Enable anon access for the public portal
-- These policies ensure unauthenticated users can view published data
