-- Event activity log for tracking actions on each event
CREATE TABLE IF NOT EXISTS event_activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  actor_id    uuid REFERENCES profiles(id),
  actor_name  text,
  action_type text NOT NULL,
  description text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE event_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_planner_coordinator" ON event_activity;
CREATE POLICY "activity_planner_coordinator"
  ON event_activity FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "activity_insert" ON event_activity;
CREATE POLICY "activity_insert"
  ON event_activity FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_event_activity_event ON event_activity(event_id, created_at DESC);
