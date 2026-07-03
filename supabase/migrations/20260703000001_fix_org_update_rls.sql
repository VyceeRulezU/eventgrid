-- Migration: Allow org members to update organization and change org affiliation
-- ================================================================================
-- Problem: orgs_update_own policy has no WITH CHECK, and users can't
-- change which org they belong to.
-- Fix: 
--   1. Recreate orgs_update_own with WITH CHECK
--   2. Create RPC for users to change their org
--   3. Add RLS policy for profiles.org_id updates

-- ── 1. Fix organizations UPDATE policy ──────────────────────────────────────────

DROP POLICY IF EXISTS "orgs_update_own" ON public.organizations;

CREATE POLICY "orgs_update_own"
  ON public.organizations FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR id = public.get_user_org_id(ARRAY['coordinator', 'planner'])
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR id = public.get_user_org_id(ARRAY['coordinator', 'planner'])
  );

-- ── 2. RPC: change user's org affiliation ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.change_user_org(p_new_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  UPDATE public.profiles
  SET org_id = p_new_org_id
  WHERE id = auth.uid();
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.change_user_org(uuid) TO authenticated;
