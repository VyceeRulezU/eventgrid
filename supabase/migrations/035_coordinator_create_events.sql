-- Migration 035: Allow coordinators to create and manage their own events
-- Coordinators can create events under orgs they own, see events they created,
-- and access events via event_access membership.

-- 1. Allow any user to see events they created
-- Covers coordinators (and planners) who create events under orgs they own
DROP POLICY IF EXISTS "events_select_created_by" ON events;
CREATE POLICY "events_select_created_by" ON events FOR SELECT
  USING (created_by = auth.uid() AND deleted_at IS NULL);

-- 2. Allow any user to update events they created
DROP POLICY IF EXISTS "events_update_created_by" ON events;
CREATE POLICY "events_update_created_by" ON events FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- 3. Allow accepted event_access members to read the event
-- Covers team_members, coordinators, vendors, clients added via event_access
DROP POLICY IF EXISTS "events_select_event_access" ON events;
CREATE POLICY "events_select_event_access" ON events FOR SELECT
  USING (
    id IN (
      SELECT event_id FROM event_access
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
    AND deleted_at IS NULL
  );

-- 4. Allow coordinators (via event_access) to update events they manage
DROP POLICY IF EXISTS "events_update_event_access" ON events;
CREATE POLICY "events_update_event_access" ON events FOR UPDATE
  USING (
    id IN (
      SELECT event_id FROM event_access
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL AND role = 'coordinator'
    )
  )
  WITH CHECK (
    id IN (
      SELECT event_id FROM event_access
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL AND role = 'coordinator'
    )
  );
