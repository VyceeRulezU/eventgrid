-- Migration 034: Fix event_access RLS for coordinators + vendor directory visibility + profiles fix
-- =========================================================================================

-- 0. profiles: Fix SELECT policy — simplify to avoid 500 errors from recursive subqueries
-- =========================================================================================
DROP POLICY IF EXISTS "profiles_select_event_members" ON profiles;

CREATE POLICY "profiles_select_event_members" ON profiles FOR SELECT
  USING (
    -- Same org (via event_access)
    org_id IN (
      SELECT e.org_id FROM event_access ea
      JOIN events e ON e.id = ea.event_id
      WHERE ea.user_id = auth.uid() AND ea.accepted_at IS NOT NULL
    )
    OR
    -- Fellow event participants
    id IN (
      SELECT user_id FROM event_access
      WHERE event_id IN (
        SELECT event_id FROM event_access WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
      )
    )
  );

-- 1. event_access: Allow team members with accepted access to see all members of the event
-- =========================================================================================
DROP POLICY IF EXISTS "event_access_select_team_members" ON event_access;

CREATE POLICY "event_access_select_team_members" ON event_access FOR SELECT
  USING (
    event_id IN (
      SELECT event_id FROM event_access
      WHERE user_id = auth.uid()
        AND accepted_at IS NOT NULL
    )
  );

-- 2. event_access: Allow team members with accepted access to add new members to the same event
-- =========================================================================================
DROP POLICY IF EXISTS "event_access_insert_team_members" ON event_access;

CREATE POLICY "event_access_insert_team_members" ON event_access FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT event_id FROM event_access
      WHERE user_id = auth.uid()
        AND accepted_at IS NOT NULL
    )
  );

-- 3. vendors: Allow all authenticated users to see all non-deleted vendors (for directory browsing)
-- =========================================================================================
DROP POLICY IF EXISTS "vendors_select_org_members" ON vendors;
DROP POLICY IF EXISTS "vendors_select_all_authenticated" ON vendors;

CREATE POLICY "vendors_select_all_authenticated" ON vendors FOR SELECT
  USING (deleted_at IS NULL);
