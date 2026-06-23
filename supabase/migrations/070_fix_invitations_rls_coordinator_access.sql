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
