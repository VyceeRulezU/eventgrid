-- Migration 076: Fix profiles_select_event_members to work without accepted_at
-- Planners/coordinators added directly by the event owner may have accepted_at = NULL
-- This causes the policy to block profile visibility for valid team members.
-- Also add explicit super_admin bypass.

DROP POLICY IF EXISTS "profiles_select_event_members" ON public.profiles;

CREATE POLICY "profiles_select_event_members" ON public.profiles FOR SELECT
  USING (
    -- Same org (via event_access with accepted_at)
    org_id IN (
      SELECT e.org_id FROM public.event_access ea
      JOIN public.events e ON e.id = ea.event_id
      WHERE ea.user_id = auth.uid() AND ea.accepted_at IS NOT NULL
    )
    OR
    -- Fellow event participants (any event_access, accepted or not)
    id IN (
      SELECT user_id FROM public.event_access
      WHERE event_id IN (
        SELECT event_id FROM public.get_user_event_ids()
      )
    )
    OR
    public.share_event_with_user(id)
    OR
    public.is_super_admin()
  );
