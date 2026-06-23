-- Migration 077: Fix event_access SELECT/INSERT policies for users without accepted_at
-- Planners/coordinators added directly may have accepted_at = NULL, which blocks
-- event_access_select_team_members (uses get_user_accepted_event_ids() requiring accepted_at).
-- Fix: use get_user_event_ids() which checks event_access regardless of accepted_at.
-- Same pattern as migration 053 which fixed the DELETE policy.

DROP POLICY IF EXISTS "event_access_select_team_members" ON public.event_access;

CREATE POLICY "event_access_select_team_members" ON public.event_access FOR SELECT
  USING (
    event_id IN (
      SELECT event_id FROM public.get_user_event_ids()
    )
  );

DROP POLICY IF EXISTS "event_access_insert_team_members" ON public.event_access;

CREATE POLICY "event_access_insert_team_members" ON public.event_access FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT event_id FROM public.get_user_event_ids()
    )
  );
