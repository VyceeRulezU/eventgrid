-- Migration 119: Allow team members with accepted event_access to update tasks
-- Previously only the assignee, org owner, or coordinator could update tasks.
-- This extends the policy so any accepted event_access member can update task status.

DROP POLICY IF EXISTS "tasks_update_event_access" ON public.tasks;

CREATE POLICY "tasks_update_event_access" ON public.tasks FOR UPDATE
  USING (
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_event_ids()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_event_ids()
    )
  );
