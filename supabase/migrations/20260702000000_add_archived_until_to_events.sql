-- Migration 140: Add archived_until column for time-limited reactivation
--
-- When a super admin reactivates an archived event, they set archived_until to
-- a future timestamp. The event will auto-re-archive when that time passes,
-- preventing events from staying active indefinitely after manual reactivation.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS archived_until timestamptz;

-- Update auto_archive_events() to also catch expired reactivations
CREATE OR REPLACE FUNCTION public.auto_archive_events()
RETURNS TABLE(archived_id uuid, archived_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.events e
  SET
    status = 'archived',
    archived_at = now(),
    archived_until = NULL,
    updated_at = now()
  WHERE (
    -- Auto-archive past event dates (existing logic)
    (e.payment_status = 'paid'
      AND e.event_date < CURRENT_DATE
      AND e.status NOT IN ('archived', 'cancelled', 'draft'))
    OR
    -- Auto-archive expired reactivations (new logic)
    (e.archived_until IS NOT NULL
      AND e.archived_until < now()
      AND e.status NOT IN ('archived', 'cancelled'))
  )
    AND e.archived_at IS NULL
  RETURNING e.id, e.name;
END;
$$;
