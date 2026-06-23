-- Migration 073: Fix event_activity grants and RLS for team members
-- =================================================================================

-- 1. Grant table access to authenticated and service_role roles
GRANT ALL ON public.event_activity TO authenticated;
GRANT ALL ON public.event_activity TO service_role;

-- 2. Update SELECT policy to allow all event team members (with accepted access) to view activities
DROP POLICY IF EXISTS "activity_planner_coordinator" ON public.event_activity;
DROP POLICY IF EXISTS "activity_select" ON public.event_activity;

CREATE POLICY "activity_select" ON public.event_activity FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE
        org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_event_ids()
    )
  );

-- 3. Ensure INSERT policy is configured and safe
DROP POLICY IF EXISTS "activity_insert" ON public.event_activity;

CREATE POLICY "activity_insert" ON public.event_activity FOR INSERT
  WITH CHECK (
    -- Let users insert if they are the owner, coordinator, or have accepted access to the event
    event_id IN (
      SELECT id FROM public.events WHERE
        org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_event_ids()
    )
  );

-- 4. Ensure UPDATE policy is configured (allow actors to edit their own updates)
DROP POLICY IF EXISTS "activity_update" ON public.event_activity;
CREATE POLICY "activity_update" ON public.event_activity FOR UPDATE
  USING (actor_id = auth.uid())
  WITH CHECK (actor_id = auth.uid());

-- 5. Ensure DELETE policy is configured (allow actors or event managers to delete updates)
DROP POLICY IF EXISTS "activity_delete" ON public.event_activity;
CREATE POLICY "activity_delete" ON public.event_activity FOR DELETE
  USING (
    actor_id = auth.uid()
    OR
    event_id IN (
      SELECT id FROM public.events WHERE
        org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );
