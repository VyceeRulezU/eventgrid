-- Fix profiles SELECT policy: allow team members (who have event_access
-- but no org_id in their profile) to see event owners/coordinators/peers.
--
-- The old policy relied on get_user_org_id() which returns null for
-- team members since their profile.org_id is not set.

DROP POLICY IF EXISTS "profiles_select_event_members" ON profiles;

CREATE POLICY "profiles_select_event_members" ON profiles FOR SELECT
  USING (
    -- 1. Same org (works for planners with org_id set)
    org_id = public.get_user_org_id()
    OR
    -- 2. Members of the same org, found via event_access (for team members)
    org_id IN (
      SELECT e.org_id FROM event_access ea
      JOIN events e ON e.id = ea.event_id
      WHERE ea.user_id = auth.uid()
    )
    OR
    -- 3. Coordinator of events the user is on
    id IN (
      SELECT e.coordinator_id FROM event_access ea
      JOIN events e ON e.id = ea.event_id
      WHERE ea.user_id = auth.uid() AND e.coordinator_id IS NOT NULL
    )
    OR
    -- 4. Event owner (planner) of events the user is on
    id IN (
      SELECT o.owner_id FROM event_access ea
      JOIN events e ON e.id = ea.event_id
      JOIN organizations o ON o.id = e.org_id
      WHERE ea.user_id = auth.uid()
    )
    OR
    -- 5. Fellow event_access members
    id IN (
      SELECT user_id FROM event_access
      WHERE event_id IN (
        SELECT event_id FROM event_access WHERE user_id = auth.uid()
      )
    )
  );
