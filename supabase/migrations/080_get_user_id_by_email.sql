-- Migration 080: Create get_user_id_by_email() for reliable auth user lookup
-- The send-invite edge function's userExists check falls back to auth.admin.listUsers(),
-- which is paginated and can miss users when there are many accounts.
-- This function queries auth.users directly with SECURITY DEFINER (no RLS bypass needed on auth schema).

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = p_email
$$;

GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO service_role;
