-- Migration 079: Fix invitations SELECT/INSERT policies to fall back on get_user_event_ids()
-- The invitations_select_planner and invitations_insert policies only check
-- get_user_accepted_coordinator_event_ids(), which requires role = 'coordinator'
-- AND accepted_at IS NOT NULL. Users invited with other roles (planner, team_member)
-- or without accepted_at get 403 on the invitations table.
-- Fix: add get_user_event_ids() fallback (same pattern as migration 077).

DROP POLICY IF EXISTS "invitations_select_planner" ON invitations;

CREATE POLICY "invitations_select_planner" ON invitations FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE
        org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_coordinator_event_ids()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_event_ids()
    )
  );

DROP POLICY IF EXISTS "invitations_insert" ON invitations;

CREATE POLICY "invitations_insert" ON invitations FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE
        org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_coordinator_event_ids()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_event_ids()
    )
  );
