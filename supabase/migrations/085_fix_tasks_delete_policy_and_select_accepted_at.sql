-- Migration 085: Add DELETE policy for tasks and fix tasks SELECT policy
--
-- 1. Tasks had no DELETE policy — RLS silently blocked deletes, returning
--    success with 0 rows matched. Frontend showed "Delete successful" but
--    the record remained. Fix: add DELETE policy matching INSERT permissions.
--
-- 2. tasks_select_event_access used get_user_accepted_event_ids() which
--    required accepted_at IS NOT NULL. Users added directly (like event owners
--    via the trigger) may have accepted_at = NULL. Fix: switch to
--    get_user_event_ids() so any event_access member can see tasks.

-- ── 1. Add DELETE policy for tasks ──────────────────────────────────────────

DROP POLICY IF EXISTS "tasks_delete_event_access" ON public.tasks;

CREATE POLICY "tasks_delete_event_access" ON public.tasks FOR DELETE
  USING (
    -- Event org owner (planner)
    event_id IN (
      SELECT id FROM public.events WHERE
        org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
    )
    OR
    -- Event coordinator (from events.coordinator_id)
    event_id IN (
      SELECT id FROM public.events WHERE coordinator_id = auth.uid()
    )
    OR
    -- Task creator can delete their own tasks
    created_by = auth.uid()
    OR
    -- Any user with event_access for this event
    event_id IN (
      SELECT event_id FROM public.event_access WHERE user_id = auth.uid()
    )
  );

-- ── 2. Fix tasks SELECT policy to work without accepted_at ──────────────────

DROP POLICY IF EXISTS "tasks_select_event_access" ON public.tasks;

CREATE POLICY "tasks_select_event_access" ON public.tasks FOR SELECT
  USING (
    event_id IN (
      SELECT event_id FROM public.get_user_event_ids()
    )
  );
