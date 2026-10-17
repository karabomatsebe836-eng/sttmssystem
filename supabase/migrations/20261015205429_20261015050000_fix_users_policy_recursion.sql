/*
# Fix recursive users authorization policies

1. Purpose
- Prevents the `users` table policies from querying the same table through row-level security while evaluating themselves.
- Keeps administrator checks server-enforced and preserves the existing application user records.

2. Database changes
- Adds `public.is_current_app_admin()` as a SECURITY DEFINER helper that checks the signed-in application's role without recursively invoking the `users` policies.
- Replaces administrator predicates on the `users` table with the helper function.

3. Security
- The helper uses `auth.uid()` through `public.current_app_user_id()`.
- The helper has a fixed `search_path`.
- Anonymous callers cannot execute the helper.
- No rows, columns, passwords, or role assignments are deleted or changed.

4. Important notes
- This migration only corrects policy evaluation.
- Existing role permissions remain unchanged.
- The frontend must still establish a valid authenticated Supabase session before protected reads.
*/

CREATE OR REPLACE FUNCTION public.is_current_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users actor
    JOIN public.roles actor_role ON actor.role_id = actor_role.id
    WHERE actor.id = public.current_app_user_id()
      AND actor_role.name = 'admin'
      AND actor.is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_app_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_current_app_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_current_app_admin() TO authenticated;

DROP POLICY IF EXISTS "users_select_own_or_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_update_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_admin" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin" ON public.users;

CREATE POLICY "users_select_own_or_admin" ON public.users FOR SELECT
TO authenticated
USING (
  id = public.current_app_user_id()
  OR public.is_current_app_admin()
);

CREATE POLICY "users_update_own_profile" ON public.users FOR UPDATE
TO authenticated
USING (id = public.current_app_user_id())
WITH CHECK (id = public.current_app_user_id());

CREATE POLICY "users_update_admin" ON public.users FOR UPDATE
TO authenticated
USING (public.is_current_app_admin())
WITH CHECK (public.is_current_app_admin());

CREATE POLICY "users_insert_admin" ON public.users FOR INSERT
TO authenticated
WITH CHECK (public.is_current_app_admin());

CREATE POLICY "users_delete_admin" ON public.users FOR DELETE
TO authenticated
USING (public.is_current_app_admin());