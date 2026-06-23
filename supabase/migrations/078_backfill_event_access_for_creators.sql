-- Migration 078: Backfill event_access for event creators who were never added
-- When events were created via CreateEventPage, the creator was not inserted into event_access.
-- This means team tables are empty and the creator can't see the event in dashboard listings
-- that rely on event_access membership.

INSERT INTO public.event_access (event_id, user_id, role, accepted_at)
SELECT
  e.id AS event_id,
  e.created_by AS user_id,
  'coordinator' AS role,
  e.created_at AS accepted_at
FROM public.events e
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_access ea
  WHERE ea.event_id = e.id AND ea.user_id = e.created_by
)
ON CONFLICT (event_id, user_id) DO NOTHING;
