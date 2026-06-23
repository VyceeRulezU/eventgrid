-- Migration 084: Fix soft_delete_events to allow super admins
-- Super admins need to be able to soft-delete events from any org,
-- but the current RPC only allows org owners.

CREATE OR REPLACE FUNCTION soft_delete_events(event_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE events
  SET deleted_at = now()
  WHERE id = ANY(event_ids)
    AND (
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR
      public.is_super_admin()
    );
END;
$$;
