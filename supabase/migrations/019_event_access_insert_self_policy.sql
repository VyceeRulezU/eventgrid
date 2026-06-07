-- Migration 019: Allow users to insert themselves into event_access when accepting an invitation
-- =========================================================================================

DROP POLICY IF EXISTS "event_access_insert_self" ON event_access;

CREATE POLICY "event_access_insert_self" ON event_access FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );
