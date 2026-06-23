-- Migration 039: Allow team members with accepted access to remove members from their event
-- =========================================================================================

DROP POLICY IF EXISTS "event_access_delete_team_members" ON event_access;

CREATE POLICY "event_access_delete_team_members" ON event_access FOR DELETE
  USING (
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_event_ids()
    )
  );
