-- Migration 099: Accept admin invite — SECURITY DEFINER RPC
-- Allows a user accepting an admin invite to set their profile's
-- is_super_admin flag and role without hitting RLS restrictions.

CREATE OR REPLACE FUNCTION public.accept_admin_invite(
  p_user_id uuid,
  p_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  UPDATE profiles
  SET is_super_admin = true,
      role = p_role
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_admin_invite(uuid, text) TO authenticated;
