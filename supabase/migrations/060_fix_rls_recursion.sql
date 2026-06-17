-- Fix infinite RLS recursion when updating events as a superadmin.
-- event_access_select_planner queries events, and events_update_event_access
-- queries event_access, creating a circular dependency.
-- Replace with a SECURITY DEFINER helper that bypasses RLS.

CREATE OR REPLACE FUNCTION public.get_org_event_ids()
RETURNS TABLE(event_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT e.id FROM events e
  WHERE e.org_id IN (
    SELECT o.id FROM organizations o WHERE o.owner_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "event_access_select_planner" ON public.event_access;

CREATE POLICY "event_access_select_planner" ON public.event_access FOR SELECT
  USING (
    event_id IN (SELECT event_id FROM public.get_org_event_ids())
  );
