-- SECURITY DEFINER function to bypass RLS for event soft-delete
-- RLS policies on events table block UPDATE in some Supabase versions
-- even when USING/WITH CHECK conditions are met.

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
    AND org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    );
END;
$$;
