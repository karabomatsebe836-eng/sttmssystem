/*
# Restore public contract statistics access

1. Purpose
- Ensures the unauthenticated transparency landing page can read contract awards and their related supplier and department names.
- Keeps awarded contract counts and spending totals visible to the public portal.

2. Security
- Enables SELECT for the anon role only on intentionally public transparency records.
- Does not add write access or change authenticated access.

3. Data safety
- No rows, columns, or existing relationships are changed.
*/

DROP POLICY IF EXISTS "select_contract_awards_anon_public" ON public.contract_awards;
CREATE POLICY "select_contract_awards_anon_public"
ON public.contract_awards FOR SELECT
TO anon USING (true);

DROP POLICY IF EXISTS "select_suppliers_anon_public" ON public.suppliers;
CREATE POLICY "select_suppliers_anon_public"
ON public.suppliers FOR SELECT
TO anon USING (true);

DROP POLICY IF EXISTS "select_departments_anon_public" ON public.departments;
CREATE POLICY "select_departments_anon_public"
ON public.departments FOR SELECT
TO anon USING (true);
