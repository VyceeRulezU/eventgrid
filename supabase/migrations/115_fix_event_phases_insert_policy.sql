-- Migration 115: Add INSERT policy for event_phases (planners, coordinators)
-- Only SELECT and UPDATE policies existed; INSERT was missing.

DROP POLICY IF EXISTS "event_phases_insert_planner_coordinator" ON public.event_phases;

CREATE POLICY "event_phases_insert_planner_coordinator" ON public.event_phases FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );
