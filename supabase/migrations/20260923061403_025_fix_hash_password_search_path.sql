-- Fix: Function Search Path Mutable for hash_password
-- Recreate the function with an explicit, immutable search_path to prevent search_path injection.
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RETURN encode(digest(password::bytea, 'sha256'), 'hex');
END;
$$;

-- The original used pgcrypto's sha256(); digest() is the canonical pgcrypto function.
-- Ensure pgcrypto is available (it was used by the original sha256 call).
CREATE EXTENSION IF NOT EXISTS pgcrypto;
