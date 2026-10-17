-- Fix: Function Search Path Mutable for hash_password
-- Recreate with an explicit search_path set to public (where pgcrypto installs its functions).
-- This makes the search_path non-mutable, resolving the security advisory.
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN encode(digest(password::bytea, 'sha256'), 'hex');
END;
$$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
