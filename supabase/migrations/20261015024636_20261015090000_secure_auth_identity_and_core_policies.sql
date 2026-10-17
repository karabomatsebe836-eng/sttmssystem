/*
# Link application users to Supabase Auth and secure core procurement access

1. Identity linking
- Adds `users.auth_user_id` as the durable link to the corresponding Supabase Auth account.
- Keeps existing application user IDs and all foreign-key relationships unchanged.

2. Authorization helper
- Adds `public.current_app_user_id()` to resolve the signed-in application profile from the Auth session.
- The helper uses a fixed search path and is not callable by anonymous users.

3. Security changes
- Removes anonymous read/write access from user profiles, bids, bid documents, evaluation criteria, evaluations, and contract awards.
- Adds authenticated policies for profile ownership, supplier bid ownership, procurement evaluation access, and administrator management.
- Existing public transparency reads remain unchanged on public-facing tables.

4. Important notes
- Existing application users remain intact and can be linked during their next successful login.
- No columns or existing records are deleted.
- The frontend must establish a Supabase Auth session before protected database reads and writes.
*/

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_auth_user_id_idx ON public.users(auth_user_id);

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.users
  WHERE auth_user_id = auth.uid()
    AND is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_app_user_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_user" ON public.users;
DROP POLICY IF EXISTS "select_all_users_admin" ON public.users;
DROP POLICY IF EXISTS "insert_users_admin" ON public.users;
DROP POLICY IF EXISTS "update_own_user" ON public.users;
DROP POLICY IF EXISTS "update_users_admin" ON public.users;
DROP POLICY IF EXISTS "select_users_anon" ON public.users;
DROP POLICY IF EXISTS "insert_users_anon" ON public.users;
DROP POLICY IF EXISTS "update_users_anon" ON public.users;
DROP POLICY IF EXISTS "delete_users_anon" ON public.users;

CREATE POLICY "users_select_own_or_admin" ON public.users FOR SELECT
TO authenticated
USING (
  id = public.current_app_user_id()
  OR EXISTS (
    SELECT 1 FROM public.users actor
    JOIN public.roles actor_role ON actor.role_id = actor_role.id
    WHERE actor.id = public.current_app_user_id()
      AND actor_role.name = 'admin'
  )
);

CREATE POLICY "users_update_own_profile" ON public.users FOR UPDATE
TO authenticated
USING (id = public.current_app_user_id())
WITH CHECK (id = public.current_app_user_id());

CREATE POLICY "users_update_admin" ON public.users FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users actor
  JOIN public.roles actor_role ON actor.role_id = actor_role.id
  WHERE actor.id = public.current_app_user_id()
    AND actor_role.name = 'admin'
))
WITH CHECK (true);

CREATE POLICY "users_insert_admin" ON public.users FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.users actor
  JOIN public.roles actor_role ON actor.role_id = actor_role.id
  WHERE actor.id = public.current_app_user_id()
    AND actor_role.name = 'admin'
));

CREATE POLICY "users_delete_admin" ON public.users FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users actor
  JOIN public.roles actor_role ON actor.role_id = actor_role.id
  WHERE actor.id = public.current_app_user_id()
    AND actor_role.name = 'admin'
));

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_bids_authenticated" ON public.bids;
DROP POLICY IF EXISTS "insert_bids_suppliers" ON public.bids;
DROP POLICY IF EXISTS "update_bids_owners" ON public.bids;
DROP POLICY IF EXISTS "select_bids_anon" ON public.bids;
DROP POLICY IF EXISTS "insert_bids_anon" ON public.bids;
DROP POLICY IF EXISTS "update_bids_anon" ON public.bids;
DROP POLICY IF EXISTS "delete_bids_anon" ON public.bids;

CREATE POLICY "bids_select_authorized" ON public.bids FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_id AND s.user_id = public.current_app_user_id())
  OR EXISTS (
    SELECT 1 FROM public.users actor JOIN public.roles r ON actor.role_id = r.id
    WHERE actor.id = public.current_app_user_id() AND r.name IN ('admin', 'procurement_officer', 'auditor')
  )
);

CREATE POLICY "bids_insert_supplier_owned" ON public.bids FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_id AND s.user_id = public.current_app_user_id()));

CREATE POLICY "bids_update_authorized" ON public.bids FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_id AND s.user_id = public.current_app_user_id())
  OR EXISTS (
    SELECT 1 FROM public.users actor JOIN public.roles r ON actor.role_id = r.id
    WHERE actor.id = public.current_app_user_id() AND r.name IN ('admin', 'procurement_officer')
  )
)
WITH CHECK (true);

ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_evaluation_criteria_anon" ON public.evaluation_criteria;
DROP POLICY IF EXISTS "insert_evaluation_criteria_anon" ON public.evaluation_criteria;
DROP POLICY IF EXISTS "update_evaluation_criteria_anon" ON public.evaluation_criteria;
DROP POLICY IF EXISTS "delete_evaluation_criteria_anon" ON public.evaluation_criteria;
DROP POLICY IF EXISTS "select_evaluation_criteria_authenticated" ON public.evaluation_criteria;
DROP POLICY IF EXISTS "insert_evaluation_criteria_authenticated" ON public.evaluation_criteria;
DROP POLICY IF EXISTS "update_evaluation_criteria_authenticated" ON public.evaluation_criteria;
DROP POLICY IF EXISTS "delete_evaluation_criteria_authenticated" ON public.evaluation_criteria;

CREATE POLICY "criteria_select_authorized" ON public.evaluation_criteria FOR SELECT
TO authenticated USING (EXISTS (SELECT 1 FROM public.users actor JOIN public.roles r ON actor.role_id = r.id WHERE actor.id = public.current_app_user_id() AND r.name IN ('admin', 'procurement_officer', 'auditor')));
CREATE POLICY "criteria_insert_procurement" ON public.evaluation_criteria FOR INSERT
TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.users actor JOIN public.roles r ON actor.role_id = r.id WHERE actor.id = public.current_app_user_id() AND r.name = 'procurement_officer'));
CREATE POLICY "criteria_update_procurement" ON public.evaluation_criteria FOR UPDATE
TO authenticated USING (EXISTS (SELECT 1 FROM public.users actor JOIN public.roles r ON actor.role_id = r.id WHERE actor.id = public.current_app_user_id() AND r.name = 'procurement_officer')) WITH CHECK (true);
CREATE POLICY "criteria_delete_procurement" ON public.evaluation_criteria FOR DELETE
TO authenticated USING (EXISTS (SELECT 1 FROM public.users actor JOIN public.roles r ON actor.role_id = r.id WHERE actor.id = public.current_app_user_id() AND r.name = 'procurement_officer'));

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_evaluations_authenticated" ON public.evaluations;
DROP POLICY IF EXISTS "insert_evaluations_evaluators" ON public.evaluations;
DROP POLICY IF EXISTS "select_evaluations_anon" ON public.evaluations;
DROP POLICY IF EXISTS "insert_evaluations_anon" ON public.evaluations;
DROP POLICY IF EXISTS "update_evaluations_anon" ON public.evaluations;
DROP POLICY IF EXISTS "delete_evaluations_anon" ON public.evaluations;

CREATE POLICY "evaluations_select_authorized" ON public.evaluations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.users actor JOIN public.roles r ON actor.role_id = r.id WHERE actor.id = public.current_app_user_id() AND r.name IN ('admin', 'procurement_officer', 'auditor')));
CREATE POLICY "evaluations_insert_procurement" ON public.evaluations FOR INSERT TO authenticated WITH CHECK (evaluator_id = public.current_app_user_id() AND EXISTS (SELECT 1 FROM public.users actor JOIN public.roles r ON actor.role_id = r.id WHERE actor.id = public.current_app_user_id() AND r.name = 'procurement_officer'));
CREATE POLICY "evaluations_update_procurement" ON public.evaluations FOR UPDATE TO authenticated USING (evaluator_id = public.current_app_user_id()) WITH CHECK (evaluator_id = public.current_app_user_id());
CREATE POLICY "evaluations_delete_procurement" ON public.evaluations FOR DELETE TO authenticated USING (evaluator_id = public.current_app_user_id());

ALTER TABLE public.bid_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_bid_documents_anon" ON public.bid_documents;
DROP POLICY IF EXISTS "insert_bid_documents_anon" ON public.bid_documents;
DROP POLICY IF EXISTS "delete_bid_documents_anon" ON public.bid_documents;
DROP POLICY IF EXISTS "update_bid_documents_anon" ON public.bid_documents;

CREATE POLICY "bid_documents_select_authorized" ON public.bid_documents FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.bids b JOIN public.suppliers s ON b.supplier_id = s.id WHERE b.id = bid_id AND (s.user_id = public.current_app_user_id() OR EXISTS (SELECT 1 FROM public.users actor JOIN public.roles r ON actor.role_id = r.id WHERE actor.id = public.current_app_user_id() AND r.name IN ('admin', 'procurement_officer', 'auditor')))));
CREATE POLICY "bid_documents_insert_supplier" ON public.bid_documents FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.bids b JOIN public.suppliers s ON b.supplier_id = s.id WHERE b.id = bid_id AND s.user_id = public.current_app_user_id()));
CREATE POLICY "bid_documents_update_reviewer" ON public.bid_documents FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.users actor JOIN public.roles r ON actor.role_id = r.id WHERE actor.id = public.current_app_user_id() AND r.name IN ('admin', 'procurement_officer', 'auditor'))) WITH CHECK (true);
CREATE POLICY "bid_documents_delete_supplier" ON public.bid_documents FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.bids b JOIN public.suppliers s ON b.supplier_id = s.id WHERE b.id = bid_id AND s.user_id = public.current_app_user_id()));

ALTER TABLE public.contract_awards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_contracts_anon" ON public.contract_awards;
DROP POLICY IF EXISTS "insert_contracts_anon" ON public.contract_awards;
DROP POLICY IF EXISTS "update_contracts_anon" ON public.contract_awards;
DROP POLICY IF EXISTS "delete_contracts_anon" ON public.contract_awards;

CREATE POLICY "contracts_select_authorized" ON public.contract_awards FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.users actor JOIN public.roles r ON actor.role_id = r.id WHERE actor.id = public.current_app_user_id() AND r.name IN ('admin', 'procurement_officer', 'auditor')));
CREATE POLICY "contracts_insert_procurement" ON public.contract_awards FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.users actor JOIN public.roles r ON actor.role_id = r.id WHERE actor.id = public.current_app_user_id() AND r.name = 'procurement_officer'));
CREATE POLICY "contracts_update_procurement" ON public.contract_awards FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.users actor JOIN public.roles r ON actor.role_id = r.id WHERE actor.id = public.current_app_user_id() AND r.name IN ('admin', 'procurement_officer'))) WITH CHECK (true);
CREATE POLICY "contracts_delete_admin" ON public.contract_awards FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.users actor JOIN public.roles r ON actor.role_id = r.id WHERE actor.id = public.current_app_user_id() AND r.name = 'admin'));
