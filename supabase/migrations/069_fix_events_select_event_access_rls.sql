-- Migration 069: Restore event_access-based SELECT policy for events
-- ================================================================================
-- Background:
--   Migration 037 dropped events_select_event_access to break an RLS recursion
--   cycle, claiming events_select_member (via has_event_access() SECURITY DEFINER)
--   would replace it. But events_select_member and has_event_access() were never
--   created — so team_member users lost all SELECT access to events they were
--   invited to via event_access.
--
-- This re-adds the policy using the existing get_user_accepted_event_ids()
-- SECURITY DEFINER function (created in migration 034), which uses
-- row_security = off to prevent recursion.

CREATE POLICY "events_select_event_access" ON events FOR SELECT
  USING (
    id IN (SELECT event_id FROM public.get_user_accepted_event_ids())
    AND deleted_at IS NULL
  );
