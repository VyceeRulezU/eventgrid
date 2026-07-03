-- Migration: Backfill slugs for events that don't have one
-- ================================================================================
-- Problem: Events created before slug support was added have slug = null,
-- causing URLs to show raw UUIDs instead of readable slugs.

-- Generate a URL-safe slug from an event name (mirrors src/lib/slug.ts)
CREATE OR REPLACE FUNCTION public.generate_event_slug(name text)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  base text;
  suffix text;
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
BEGIN
  base := regexp_replace(
    lower(name),
    '[^a-z0-9\s]', '', 'g'
  );
  base := trim(both from base);
  base := regexp_replace(base, '\s+', '-', 'g');
  base := left(base, 40);
  base := regexp_replace(base, '-+$', '');

  suffix := '';
  FOR i IN 1..5 LOOP
    suffix := suffix || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;

  IF base = '' THEN
    RETURN suffix;
  END IF;
  RETURN base || '-' || suffix;
END;
$$;

-- Backfill NULL slugs
UPDATE public.events
SET slug = public.generate_event_slug(COALESCE(name, id::text))
WHERE slug IS NULL;

-- Add unique index if not present (idempotent)
CREATE INDEX IF NOT EXISTS idx_events_slug_unique ON public.events(slug) WHERE slug IS NOT NULL;
