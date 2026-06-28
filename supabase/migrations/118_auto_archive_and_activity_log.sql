-- Migration 118: Auto-archive + event_activity logging
--
--   1. Add archived_at column to events
--   2. Add activated_at column to events (if not already added by verify-payment)
--   3. auto_archive_events() function for daily cron
--   4. Triggers to log task/phase status changes and deletions to event_activity

-- ── 1. Add archived_at to events ─────────────────────────────────────────────

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS activated_at timestamptz;

-- ── 2. Auto-archive function (called by cron or Edge Function) ──────────────
--
-- Finds paid events where event_date was yesterday or earlier, and marks them
-- as archived (read-only). 24-hour grace period after the event date passes.

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
    updated_at = now()
  WHERE e.payment_status = 'paid'
    AND e.event_date < CURRENT_DATE
    AND e.status NOT IN ('archived', 'cancelled', 'draft')
    AND e.archived_at IS NULL
  RETURNING e.id, e.name;
END;
$$;

-- ── 3. event_activity logging triggers ──────────────────────────────────────
--
-- Log task status changes to event_activity
-- Log task deletions (soft/hard) to event_activity
-- Log phase status changes to event_activity
-- Log phase deletions to event_activity

CREATE OR REPLACE FUNCTION public.log_task_changes_to_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.event_activity (event_id, actor_id, actor_name, action_type, description, metadata)
    VALUES (
      NEW.event_id,
      auth.uid(),
      COALESCE((SELECT display_name FROM public.profiles WHERE id = auth.uid()), 'System'),
      'task_status_changed',
      format('Task "%s" status changed from %s to %s', COALESCE(NEW.title, OLD.title, 'untitled'), OLD.status, NEW.status),
      jsonb_build_object(
        'task_id', NEW.id,
        'phase_id', NEW.phase_id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.event_activity (event_id, actor_id, actor_name, action_type, description, metadata)
    VALUES (
      OLD.event_id,
      auth.uid(),
      COALESCE((SELECT display_name FROM public.profiles WHERE id = auth.uid()), 'System'),
      'task_deleted',
      format('Task "%s" was deleted', COALESCE(OLD.title, 'untitled')),
      jsonb_build_object('task_id', OLD.id, 'phase_id', OLD.phase_id, 'status', OLD.status)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS log_task_changes ON public.tasks;
CREATE TRIGGER log_task_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_changes_to_activity();

CREATE OR REPLACE FUNCTION public.log_phase_changes_to_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.event_activity (event_id, actor_id, actor_name, action_type, description, metadata)
    VALUES (
      NEW.event_id,
      auth.uid(),
      COALESCE((SELECT display_name FROM public.profiles WHERE id = auth.uid()), 'System'),
      'phase_status_changed',
      format('Phase "%s" status changed from %s to %s', COALESCE(NEW.phase_name, OLD.phase_name, 'untitled'), OLD.status, NEW.status),
      jsonb_build_object(
        'phase_id', NEW.id,
        'phase_number', NEW.phase_number,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.event_activity (event_id, actor_id, actor_name, action_type, description, metadata)
    VALUES (
      OLD.event_id,
      auth.uid(),
      COALESCE((SELECT display_name FROM public.profiles WHERE id = auth.uid()), 'System'),
      'phase_deleted',
      format('Phase "%s" was deleted', COALESCE(OLD.phase_name, 'untitled')),
      jsonb_build_object('phase_id', OLD.id, 'phase_number', OLD.phase_number)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS log_phase_changes ON public.event_phases;
CREATE TRIGGER log_phase_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.event_phases
  FOR EACH ROW
  EXECUTE FUNCTION public.log_phase_changes_to_activity();
