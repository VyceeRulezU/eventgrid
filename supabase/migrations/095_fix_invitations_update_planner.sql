-- Migration 095: Add UPDATE/DELETE policy for planners on invitations
-- The existing invitations_update_self policy only allows updates when
-- email = auth.email() (the invitee themselves). Planners (org owners)
-- need to be able to cancel invitations they sent.
-- Use the same get_org_event_ids() SECURITY DEFINER pattern as the SELECT policy.

DROP POLICY IF EXISTS "invitations_update_planner" ON invitations;

CREATE POLICY "invitations_update_planner" ON invitations FOR UPDATE
  USING (
    event_id IN (SELECT event_id FROM public.get_org_event_ids())
  )
  WITH CHECK (
    event_id IN (SELECT event_id FROM public.get_org_event_ids())
  );

DROP POLICY IF EXISTS "invitations_delete_planner" ON invitations;

CREATE POLICY "invitations_delete_planner" ON invitations FOR DELETE
  USING (
    event_id IN (SELECT event_id FROM public.get_org_event_ids())
  );
