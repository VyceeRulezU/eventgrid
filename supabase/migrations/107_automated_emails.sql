-- Migration 107: Automated email triggers + Friday reminder cron
-- Uses pg_net extension for HTTP calls from triggers
-- pg_net.http_post signature: (url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds int)

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ── Helper: get Supabase Edge Function URL ──
CREATE OR REPLACE FUNCTION public.supabase_edge_url()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT 'https://menmpyyrqevonepbpfai.supabase.co/functions/v1';
$$;

-- ── Trigger: event created ──
CREATE OR REPLACE FUNCTION public.handle_event_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  creator_email text;
  creator_name text;
BEGIN
  SELECT email, display_name INTO creator_email, creator_name
  FROM public.profiles
  WHERE id = NEW.created_by;

  IF creator_email IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM
    net.http_post(
      url := public.supabase_edge_url() || '/send-automated-email',
      body := jsonb_build_object(
        'template_name', 'Congratulations - First Event Created',
        'to', jsonb_build_object('email', creator_email, 'name', creator_name),
        'variables', jsonb_build_object(
          '{{event_name}}', NEW.name,
          '{{event_id}}', NEW.id::text,
          '{{event_slug}}', COALESCE(NEW.slug, NEW.id::text)
        )
      )
    );

  RETURN NEW;
END;
$$;

-- ── Trigger: event goes live (status changes to 'active') ──
CREATE OR REPLACE FUNCTION public.handle_event_live()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  creator_email text;
  creator_name text;
BEGIN
  IF OLD.status IS DISTINCT FROM 'active' AND NEW.status = 'active' THEN
    SELECT email, display_name INTO creator_email, creator_name
    FROM public.profiles
    WHERE id = NEW.created_by;

    IF creator_email IS NOT NULL THEN
      PERFORM
        net.http_post(
          url := public.supabase_edge_url() || '/send-automated-email',
      body := jsonb_build_object(
        'template_name', 'Congratulations - Event is Now Live',
        'to', jsonb_build_object('email', creator_email, 'name', creator_name),
        'variables', jsonb_build_object(
          '{{event_name}}', NEW.name,
          '{{event_id}}', NEW.id::text,
          '{{event_slug}}', COALESCE(NEW.slug, NEW.id::text)
        )
      )
        );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ── Apply triggers ──
DROP TRIGGER IF EXISTS trg_event_created ON public.events;
CREATE TRIGGER trg_event_created
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_created();

DROP TRIGGER IF EXISTS trg_event_live ON public.events;
CREATE TRIGGER trg_event_live
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_live();

-- ── Friday Reminder: function to be called by cron ──
CREATE OR REPLACE FUNCTION public.send_friday_reminders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  rec record;
  result jsonb;
  sent integer := 0;
  failed integer := 0;
BEGIN
  FOR rec IN
    SELECT DISTINCT ON (p.id)
      p.email,
      p.display_name,
      e.name AS event_name,
      e.id AS event_id,
      COALESCE(e.slug, e.id::text) AS event_slug
    FROM public.events e
    JOIN public.profiles p ON p.id = e.created_by
    WHERE e.event_date::date = (CURRENT_DATE + 1)
      AND e.status = 'active'
      AND p.is_active = true
      AND p.email IS NOT NULL
  LOOP
    PERFORM
      net.http_post(
        url := public.supabase_edge_url() || '/send-automated-email',
        body := jsonb_build_object(
          'template_name', 'Friday Reminder - Weekend Event Prep',
          'to', jsonb_build_object('email', rec.email, 'name', rec.display_name),
          'variables', jsonb_build_object(
            '{{event_name}}', rec.event_name,
            '{{event_id}}', rec.event_id::text,
          '{{event_slug}}', rec.event_slug
        )
      )
    );

    sent := sent + 1;
  END LOOP;

  result := jsonb_build_object('sent', sent, 'failed', failed);
  RETURN result;
END;
$$;
