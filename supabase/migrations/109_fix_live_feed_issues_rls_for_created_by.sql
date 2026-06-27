-- Migration 109: Add created_by to live_feed_posts and issues RLS policies
-- Coordinators-turned-planners create events via created_by, but the
-- existing planner/coordinator policies only check org owner and coordinator_id.

-- ── live_feed_posts: planner/coordinator policy ──
DROP POLICY IF EXISTS "live_feed_planner_coordinator" ON live_feed_posts;
CREATE POLICY "live_feed_planner_coordinator" ON live_feed_posts FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
        OR created_by = auth.uid()
    )
  );

-- ── issues: planner/coordinator policy ──
DROP POLICY IF EXISTS "issues_planner_coordinator_full" ON issues;
CREATE POLICY "issues_planner_coordinator_full" ON issues FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
        OR created_by = auth.uid()
    )
  );
