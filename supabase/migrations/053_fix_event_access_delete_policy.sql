-- Migration 053: Fix event_access delete policy — allow team members with event access to delete
-- The current policy uses get_user_accepted_event_ids() which requires accepted_at IS NOT NULL
-- Planners/coordinators added directly by the event owner may have accepted_at = NULL
-- Fix: create a new helper that checks event_access presence regardless of accepted_at

CREATE OR REPLACE FUNCTION public.get_user_event_ids()
RETURNS TABLE(event_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT event_id FROM event_access WHERE user_id = auth.uid()
$$;

DROP POLICY IF EXISTS "event_access_delete_team_members" ON event_access;

CREATE POLICY "event_access_delete_team_members" ON event_access FOR DELETE
  USING (
    event_id IN (
      SELECT event_id FROM public.get_user_event_ids()
    )
  );
