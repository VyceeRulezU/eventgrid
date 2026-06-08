-- Migration 026: Replace station-based Live Board with timeline-based Live Feed
-- Creates live_feed_posts table for free-form text + photo updates

CREATE TABLE live_feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  message text NOT NULL,
  photo_urls jsonb DEFAULT '[]'::jsonb,
  location_tag text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_live_feed_posts_event ON live_feed_posts(event_id, created_at DESC);

ALTER TABLE live_feed_posts ENABLE ROW LEVEL SECURITY;

-- Planners and coordinators have full access
CREATE POLICY "live_feed_planner_coordinator" ON live_feed_posts FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );

-- Team members can insert posts (must be themselves)
CREATE POLICY "live_feed_team_insert" ON live_feed_posts FOR INSERT
  WITH CHECK (
    event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

-- Team members can view posts
CREATE POLICY "live_feed_team_select" ON live_feed_posts FOR SELECT
  USING (
    event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid())
  );

-- Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE live_feed_posts;

-- Grant access
GRANT ALL ON live_feed_posts TO authenticated;
