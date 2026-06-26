-- Migration 104: Add invite validation to accept_admin_invite RPC
-- Prevents direct RPC calls from accepting invites that have been cancelled

CREATE OR REPLACE FUNCTION public.accept_admin_invite(
  p_user_id uuid,
  p_role text,
  p_email text DEFAULT NULL
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
  -- Verify a pending invite exists for this email (defense-in-depth)
  IF p_email IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM admin_invites WHERE email = p_email AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'No pending invite found for this email';
  END IF;

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

GRANT EXECUTE ON FUNCTION public.accept_admin_invite(uuid, text, text) TO authenticated;
