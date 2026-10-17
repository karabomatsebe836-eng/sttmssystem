-- Fix: Function Search Path Mutable for hash_password
-- Recreate with an explicit, immutable search_path.
-- sha256() lives in pg_catalog, which is always in the search path, but we set it
-- explicitly to satisfy the security advisor's "non-mutable search_path" requirement.
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  RETURN encode(pg_catalog.sha256(password::bytea), 'hex');
END;
$$;
