-- Migration 092: Fix event_access DELETE for planners (org owners)
-- The existing event_access_delete_team_members policy uses get_user_event_ids()
-- which only returns events where the user has an event_access row.
-- Planners (org owners) may not have an event_access row, so the policy
-- blocks their DELETE requests silently (0 rows affected, no error).
-- Fix: add a planner-specific delete policy matching the SELECT pattern.

DROP POLICY IF EXISTS "event_access_delete_planner" ON public.event_access;

CREATE POLICY "event_access_delete_planner" ON public.event_access FOR DELETE
  USING (
    event_id IN (SELECT event_id FROM public.get_org_event_ids())
  );
