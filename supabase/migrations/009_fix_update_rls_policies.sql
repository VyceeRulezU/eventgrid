-- Fix UPDATE RLS policies missing WITH CHECK clause
-- PostgreSQL RLS requires WITH CHECK for UPDATE to validate the new row
-- Without it, some Supabase versions reject UPDATE even if USING matches

DROP POLICY IF EXISTS "events_update_planner" ON events;
CREATE POLICY "events_update_planner" ON events FOR UPDATE
  USING (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "orgs_update_own" ON organizations;
CREATE POLICY "orgs_update_own" ON organizations FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "event_phases_update_planner_coordinator" ON event_phases;
CREATE POLICY "event_phases_update_planner_coordinator" ON event_phases FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "vendors_update_own_org" ON vendors;
CREATE POLICY "vendors_update_own_org" ON vendors FOR UPDATE
  USING (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "tasks_update_assignee" ON tasks;
CREATE POLICY "tasks_update_assignee" ON tasks FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR assignee_id = auth.uid()
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR assignee_id = auth.uid()
  );

DROP POLICY IF EXISTS "guests_team_checkin" ON guests;
CREATE POLICY "guests_team_checkin" ON guests FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "live_board_team_update" ON live_board_items;
CREATE POLICY "live_board_team_update" ON live_board_items FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );
