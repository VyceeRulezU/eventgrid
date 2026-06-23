-- Migration 070: Fix invitations RLS for event_access-based coordinators
-- ================================================================================
-- Problem:
--   The invitations_select_planner policy only checked events.owner_id (for
--   planners) and events.coordinator_id (for coordinators). Coordinators who
--   were invited via event_access (accepted_at IS NOT NULL, role = 'coordinator')
--   were NOT covered, so they couldn't see pending invitations in the team table.
--
-- Fix:
--   1. Create get_user_accepted_coordinator_event_ids() — SECURITY DEFINER helper
--      that returns event IDs where the current user is a coordinator via
--      event_access (bypasses event_access RLS to avoid recursion).
--   2. Update invitations_select_planner to also check event_access.
--   3. Update invitations_insert to also check event_access.

-- 1. Helper function for coordinator-by-event_access
-- ================================================================================
CREATE OR REPLACE FUNCTION public.get_user_accepted_coordinator_event_ids()
RETURNS TABLE(event_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT event_id FROM event_access WHERE user_id = auth.uid() AND accepted_at IS NOT NULL AND role = 'coordinator'
$$;

GRANT EXECUTE ON FUNCTION public.get_user_accepted_coordinator_event_ids() TO authenticated;

-- 2. Fix invitations SELECT policy
-- ================================================================================
DROP POLICY IF EXISTS "invitations_select_planner" ON invitations;

CREATE POLICY "invitations_select_planner" ON invitations FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_coordinator_event_ids()
    )
  );

-- 3. Fix invitations INSERT policy (same logic)
-- ================================================================================
DROP POLICY IF EXISTS "invitations_insert" ON invitations;

CREATE POLICY "invitations_insert" ON invitations FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_coordinator_event_ids()
    )
  );

-- 4. Add missing UPDATE policy on event_access
-- ================================================================================
-- Without this, upsert on event_access (used when re-adding a member or
-- accepting an invitation) silently fails when the row already exists.
DROP POLICY IF EXISTS "event_access_update_members" ON event_access;

CREATE POLICY "event_access_update_members" ON event_access FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_coordinator_event_ids()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_coordinator_event_ids()
    )
  );

-- 5. RPC to add event member (bypasses RLS / FK recursion)
-- ================================================================================
-- The frontend's direct upsert into event_access fails because the FK constraint
-- validation on profiles.user_id triggers the profiles RLS policy, which can
-- produce "relation 'profiles' does not exist" errors for certain user/role combos.
-- This RPC runs with SECURITY DEFINER + row_security off, bypassing all RLS.

CREATE OR REPLACE FUNCTION public.add_event_member(
  p_event_id uuid,
  p_user_id uuid,
  p_role text DEFAULT 'team_member'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  INSERT INTO event_access (event_id, user_id, role, accepted_at)
  VALUES (p_event_id, p_user_id, p_role, now())
  ON CONFLICT (event_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        accepted_at = COALESCE(event_access.accepted_at, now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_event_member(uuid, uuid, text) TO authenticated;
