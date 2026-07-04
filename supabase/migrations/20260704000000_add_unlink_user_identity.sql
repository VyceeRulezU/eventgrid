-- Migration: Add unlink_user_identity function to delete identities securely
-- This function runs with SECURITY DEFINER to bypass RLS and edit auth.identities schema.

CREATE OR REPLACE FUNCTION public.unlink_user_identity(
  p_user_id uuid,
  p_provider text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Perform direct deletion from the auth.identities table
  DELETE FROM auth.identities
  WHERE user_id = p_user_id
    AND provider = p_provider;
END;
$$;

-- Only grant execution to service_role for maximum security
REVOKE ALL ON FUNCTION public.unlink_user_identity(uuid, text) FROM public, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.unlink_user_identity(uuid, text) TO service_role;
