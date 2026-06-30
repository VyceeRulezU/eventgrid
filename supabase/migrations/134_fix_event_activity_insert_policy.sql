-- Migration 134: Fix event_activity INSERT policy
-- Previously any authenticated user could insert arbitrary activity
-- entries into ANY event. Now restrict to event members.

DROP POLICY IF EXISTS "activity_insert" ON public.event_activity;

CREATE POLICY "activity_insert"
  ON public.event_activity FOR INSERT
  WITH CHECK (
    auth.uid() = actor_id
    AND (
      event_id IN (SELECT event_id FROM public.event_access WHERE user_id = auth.uid())
      OR
      event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
      OR
      public.is_super_admin()
    )
  );
