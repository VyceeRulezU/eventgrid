-- Migration 079: Auto add creator and coordinator to event_access on event insert
CREATE OR REPLACE FUNCTION public.handle_event_created_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert creator into event_access
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.event_access (event_id, user_id, role, accepted_at)
    VALUES (NEW.id, NEW.created_by, 'coordinator', NEW.created_at)
    ON CONFLICT (event_id, user_id) DO NOTHING;
  END IF;

  -- Insert coordinator_id if set and different from creator
  IF NEW.coordinator_id IS NOT NULL AND (NEW.created_by IS NULL OR NEW.coordinator_id <> NEW.created_by) THEN
    INSERT INTO public.event_access (event_id, user_id, role, accepted_at)
    VALUES (NEW.id, NEW.coordinator_id, 'coordinator', NEW.created_at)
    ON CONFLICT (event_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_event_created_access ON public.events;

CREATE TRIGGER on_event_created_access
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_event_created_access();
