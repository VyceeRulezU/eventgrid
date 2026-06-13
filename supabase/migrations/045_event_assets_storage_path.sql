-- Add storage_path column to event_assets for file cleanup
ALTER TABLE public.event_assets
ADD COLUMN storage_path TEXT;

GRANT ALL ON public.event_assets TO authenticated;
GRANT ALL ON public.event_assets TO service_role;
