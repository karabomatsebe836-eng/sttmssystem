-- Fix RLS policies for anon role access
-- The app uses custom auth (edge function + localStorage) with the anon key
-- for ALL database operations, so anon needs CRUD on tables the app uses.

-- 1. public_reports: fix INSERT (was TO public, should be TO anon)
--    Also add UPDATE for auditor workflow
DROP POLICY IF EXISTS insert_reports_public ON public_reports;
CREATE POLICY "insert_reports_anon" ON public_reports
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_reports_anon" ON public_reports
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 2. whistleblower_reports: fix INSERT (was TO public, should be TO anon)
--    Also add UPDATE for auditor workflow
DROP POLICY IF EXISTS insert_whistleblower_reports ON whistleblower_reports;
CREATE POLICY "insert_whistleblower_anon" ON whistleblower_reports
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_whistleblower_anon" ON whistleblower_reports
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 3. feedback: add anon INSERT (public can submit feedback)
CREATE POLICY "insert_feedback_anon" ON feedback
  FOR INSERT TO anon WITH CHECK (true);

-- 4. system_settings: add anon SELECT, INSERT, UPDATE (admin manages settings via anon key)
CREATE POLICY "select_settings_anon" ON system_settings
  FOR SELECT TO anon USING (true);

CREATE POLICY "insert_settings_anon" ON system_settings
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_settings_anon" ON system_settings
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 5. evaluations: add anon DELETE (BidEvaluationDetailPage deletes before re-inserting)
CREATE POLICY "delete_evaluations_anon" ON evaluations
  FOR DELETE TO anon USING (true);

-- 6. contractor_performance: add anon DELETE
CREATE POLICY "delete_performance_anon" ON contractor_performance
  FOR DELETE TO anon USING (true);

-- 7. contract_awards: add anon DELETE and authenticated DELETE
CREATE POLICY "delete_contracts_anon" ON contract_awards
  FOR DELETE TO anon USING (true);

-- 8. bid_documents: add anon INSERT, UPDATE, DELETE
CREATE POLICY "insert_bid_documents_anon" ON bid_documents
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_bid_documents_anon" ON bid_documents
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "delete_bid_documents_anon" ON bid_documents
  FOR DELETE TO anon USING (true);

-- 9. project_milestones: add anon DELETE
CREATE POLICY "delete_milestones_anon" ON project_milestones
  FOR DELETE TO anon USING (true);

-- 10. project_monitoring: add anon DELETE
CREATE POLICY "delete_projects_anon" ON project_monitoring
  FOR DELETE TO anon USING (true);

-- 11. risk_alerts: add anon DELETE
CREATE POLICY "delete_alerts_anon" ON risk_alerts
  FOR DELETE TO anon USING (true);

-- 12. audit_logs: add anon UPDATE and DELETE
CREATE POLICY "update_audit_logs_anon" ON audit_logs
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "delete_audit_logs_anon" ON audit_logs
  FOR DELETE TO anon USING (true);

-- 13. roles: add anon INSERT, UPDATE, DELETE (admin manages roles)
CREATE POLICY "insert_roles_anon" ON roles
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_roles_anon" ON roles
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 14. procurement_categories: add anon INSERT, UPDATE, DELETE
CREATE POLICY "insert_categories_anon" ON procurement_categories
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "update_categories_anon" ON procurement_categories
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "delete_categories_anon" ON procurement_categories
  FOR DELETE TO anon USING (true);

-- 15. suppliers: add anon DELETE
CREATE POLICY "delete_suppliers_anon" ON suppliers
  FOR DELETE TO anon USING (true);

-- 16. departments: add anon DELETE
CREATE POLICY "delete_departments_anon" ON departments
  FOR DELETE TO anon USING (true);

-- 17. users: add anon DELETE (admin can delete users)
CREATE POLICY "delete_users_anon" ON users
  FOR DELETE TO anon USING (true);

-- 18. tenders: add anon DELETE
CREATE POLICY "delete_tenders_anon" ON tenders
  FOR DELETE TO anon USING (true);

-- 19. bids: add anon DELETE
CREATE POLICY "delete_bids_anon" ON bids
  FOR DELETE TO anon USING (true);

-- 20. evaluation_criteria: already has anon DELETE, INSERT, UPDATE, SELECT - OK

-- 21. dashboard_stats: add anon SELECT (read-only view-like table)
CREATE POLICY "select_dashboard_stats_anon" ON dashboard_stats
  FOR SELECT TO anon USING (true);

-- 22. contractor_performance_history: add anon SELECT
CREATE POLICY "select_perf_history_anon" ON contractor_performance_history
  FOR SELECT TO anon USING (true);

-- 23. risk_detection_rules: add anon SELECT (read-only for display)
CREATE POLICY "select_rules_anon" ON risk_detection_rules
  FOR SELECT TO anon USING (true);
