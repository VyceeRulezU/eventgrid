-- Migration 101: Add original_role column to profiles
-- Preserves the user's original role when they accept an admin invite,
-- so it can be restored if admin privileges are revoked.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS original_role text;

-- Update accept_admin_invite to save original role before overwriting
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
DECLARE
  current_role text;
BEGIN
  SELECT role INTO current_role FROM profiles WHERE id = p_user_id;

  UPDATE profiles
  SET is_super_admin = true,
      role = p_role,
      original_role = CASE
        WHEN current_role IS NOT NULL AND current_role != p_role
          THEN current_role
        ELSE original_role
      END
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_admin_invite(uuid, text) TO authenticated;
