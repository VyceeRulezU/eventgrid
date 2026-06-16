-- Migration 055: SECURITY DEFINER RPC to update event header image
-- Bypasses recursive RLS policy on the events table so planners/coordinators
-- can upload and set a custom header image per event.

CREATE OR REPLACE FUNCTION public.update_event_header(p_event_id uuid, p_header_url text)
RETURNS void
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE events SET header_image_url = p_header_url WHERE id = p_event_id;
$$;

GRANT EXECUTE ON FUNCTION public.update_event_header(uuid, text) TO authenticated;
