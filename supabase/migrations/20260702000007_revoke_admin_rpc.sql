-- Migration: Revoke admin privileges — SECURITY DEFINER RPC
-- Allows a super_admin to revoke admin privileges from another user
-- without hitting RLS restrictions on the profiles table.

CREATE OR REPLACE FUNCTION public.revoke_admin_privileges(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  UPDATE profiles
  SET is_super_admin = false,
      role = CASE
        WHEN original_role IN ('planner', 'coordinator', 'vendor', 'client', 'team_member')
          THEN original_role
        ELSE 'planner'
      END,
      original_role = NULL
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_admin_privileges(uuid) TO authenticated;

-- Clean up any existing dirty data in original_role
UPDATE public.profiles
SET original_role = NULL
WHERE original_role IS NOT NULL 
  AND original_role NOT IN ('planner', 'coordinator', 'vendor', 'client', 'team_member');
