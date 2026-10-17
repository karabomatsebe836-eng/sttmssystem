/*
# Supplier project progress updates and supplier company records

1. New supplier progress capability
- Adds `supplier_last_update` to `project_monitoring` so a supplier can explain the latest progress update.
- Adds `supplier_updated_at` to record when the supplier last submitted progress.
- Adds a server-checked function that lets only the supplier attached to a contract update completion, status, and update note.

2. Security
- Supplier progress changes are performed through a SECURITY DEFINER function.
- The function checks the signed-in application user against the supplier attached to the project's contract.
- Direct authenticated updates to project_monitoring are revoked so suppliers cannot change budgets, risk data, dates, or audit fields through the browser.
- The public project pages continue to read the same project records and therefore show the latest supplier update.

3. Important notes
- Existing project data is preserved.
- Procurement/admin project editing is intentionally not changed by this migration because no current project editing screen relies on direct updates.
*/

ALTER TABLE public.project_monitoring
  ADD COLUMN IF NOT EXISTS supplier_last_update TEXT;

ALTER TABLE public.project_monitoring
  ADD COLUMN IF NOT EXISTS supplier_updated_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.update_supplier_project_progress(
  p_project_id UUID,
  p_completion_percentage NUMERIC,
  p_status TEXT,
  p_supplier_last_update TEXT
)
RETURNS public.project_monitoring
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_project public.project_monitoring;
BEGIN
  IF p_completion_percentage IS NULL OR p_completion_percentage < 0 OR p_completion_percentage > 100 THEN
    RAISE EXCEPTION 'Progress must be between 0 and 100';
  END IF;

  IF p_status NOT IN ('not_started', 'in_progress', 'on_hold', 'at_risk', 'delayed', 'completed') THEN
    RAISE EXCEPTION 'Invalid project status';
  END IF;

  UPDATE public.project_monitoring pm
  SET completion_percentage = p_completion_percentage,
      status = p_status::project_status,
      supplier_last_update = NULLIF(trim(p_supplier_last_update), ''),
      supplier_updated_at = now(),
      updated_at = now()
  WHERE pm.id = p_project_id
    AND EXISTS (
      SELECT 1
      FROM public.contract_awards ca
      JOIN public.suppliers s ON s.id = ca.supplier_id
      WHERE ca.id = pm.contract_id
        AND s.user_id = public.current_app_user_id()
        AND s.is_active = true
    )
  RETURNING pm.* INTO updated_project;

  IF updated_project.id IS NULL THEN
    RAISE EXCEPTION 'Project not found or not assigned to this supplier';
  END IF;

  RETURN updated_project;
END;
$$;

REVOKE ALL ON FUNCTION public.update_supplier_project_progress(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_supplier_project_progress(UUID, NUMERIC, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_supplier_project_progress(UUID, NUMERIC, TEXT, TEXT) TO authenticated;

REVOKE UPDATE ON public.project_monitoring FROM authenticated;
