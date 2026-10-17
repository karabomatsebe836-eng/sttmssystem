/*
# Add persisted audit reports

1. New table
- `audit_reports` stores report reference, title, type, status, risk level, findings, recommendations, author, and optional tender link.

2. Persistence
- Reports are independent records and survive refreshes.
- Findings are entered by authorised reviewers; no fictional records are inserted.

3. Security
- Row-level security is enabled.
- Auditors can create and update reports they author.
- Auditors and Admins can read reports.
- Procurement Officers do not receive audit-report access through this table.

4. Important notes
- The existing tender, risk-alert, contract, and supplier tables remain unchanged.
- Report exports can combine these persisted reports with live dashboard metrics.
*/

CREATE TABLE IF NOT EXISTS public.audit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_reference text NOT NULL UNIQUE,
  title text NOT NULL,
  report_type text NOT NULL,
  tender_id uuid REFERENCES public.tenders(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'final', 'archived')),
  risk_level text NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  findings text NOT NULL DEFAULT '',
  recommendations text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_reports_select_authorized" ON public.audit_reports;
DROP POLICY IF EXISTS "audit_reports_insert_auditor" ON public.audit_reports;
DROP POLICY IF EXISTS "audit_reports_update_author" ON public.audit_reports;
DROP POLICY IF EXISTS "audit_reports_delete_author" ON public.audit_reports;

CREATE POLICY "audit_reports_select_authorized" ON public.audit_reports FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users actor JOIN public.roles role ON actor.role_id = role.id
  WHERE actor.id = public.current_app_user_id() AND role.name IN ('admin', 'auditor')
));

CREATE POLICY "audit_reports_insert_auditor" ON public.audit_reports FOR INSERT TO authenticated
WITH CHECK (
  created_by = public.current_app_user_id()
  AND EXISTS (
    SELECT 1 FROM public.users actor JOIN public.roles role ON actor.role_id = role.id
    WHERE actor.id = public.current_app_user_id() AND role.name = 'auditor'
  )
);

CREATE POLICY "audit_reports_update_author" ON public.audit_reports FOR UPDATE TO authenticated
USING (created_by = public.current_app_user_id())
WITH CHECK (created_by = public.current_app_user_id());

CREATE POLICY "audit_reports_delete_author" ON public.audit_reports FOR DELETE TO authenticated
USING (created_by = public.current_app_user_id());

CREATE INDEX IF NOT EXISTS audit_reports_tender_id_idx ON public.audit_reports(tender_id);
CREATE INDEX IF NOT EXISTS audit_reports_created_by_idx ON public.audit_reports(created_by);
