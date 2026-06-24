-- Migration 093: Fix invitations SELECT for planners using SECURITY DEFINER helper
-- The existing invitations_select_planner policy uses an inline subquery:
--   SELECT id FROM public.events WHERE org_id IN (...)
-- This subquery is subject to the events table's RLS policies, which can cause
-- the planner to get 403 when querying invitations.
-- Fix: use get_org_event_ids() (SECURITY DEFINER, bypasses RLS) like the
-- event_access_select_planner policy already does (migration 060).

DROP POLICY IF EXISTS "invitations_select_planner" ON invitations;

CREATE POLICY "invitations_select_planner" ON invitations FOR SELECT
  USING (
    event_id IN (SELECT event_id FROM public.get_org_event_ids())
    OR
    event_id IN (SELECT event_id FROM public.get_user_event_ids())
  );
