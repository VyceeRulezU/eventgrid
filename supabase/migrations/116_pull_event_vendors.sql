-- Migration 116: Pull event_vendors to global directory and auto-link future ones
-- ==============================================================================

-- 1. Create a function to migrate existing event_vendors to the directory
CREATE OR REPLACE FUNCTION public.migrate_event_vendors_to_directory()
RETURNS void AS $$
DECLARE
  r RECORD;
  new_vendor_id UUID;
  existing_vendor_id UUID;
BEGIN
  -- Loop through event_vendors
  FOR r IN 
    SELECT ev.id AS ev_id, ev.vendor_name, ev.category, ev.notes, e.org_id, ev.vendor_id
    FROM public.event_vendors ev
    JOIN public.events e ON ev.event_id = e.id
  LOOP
    -- If vendor_id is already set, skip
    IF r.vendor_id IS NOT NULL THEN
      CONTINUE;
    END IF;

    -- See if there is a vendor in the directory with same name (case-insensitive) and category
    SELECT id INTO existing_vendor_id
    FROM public.vendors
    WHERE LOWER(name) = LOWER(TRIM(r.vendor_name))
      AND LOWER(category) = LOWER(TRIM(r.category))
      AND deleted_at IS NULL
    LIMIT 1;

    IF existing_vendor_id IS NOT NULL THEN
      -- Link event_vendor to this existing vendor
      UPDATE public.event_vendors
      SET vendor_id = existing_vendor_id
      WHERE id = r.ev_id;
    ELSE
      -- Create a new vendor in the directory
      INSERT INTO public.vendors (
        org_id,
        name,
        category,
        notes,
        is_verified
      ) VALUES (
        r.org_id,
        TRIM(r.vendor_name),
        TRIM(r.category),
        r.notes,
        false
      )
      RETURNING id INTO new_vendor_id;

      -- Link event_vendor to the new vendor
      UPDATE public.event_vendors
      SET vendor_id = new_vendor_id
      WHERE id = r.ev_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT public.migrate_event_vendors_to_directory();

-- Drop the migration helper function
DROP FUNCTION public.migrate_event_vendors_to_directory();


-- 2. Trigger function to auto-create directory vendor on event_vendor insert
CREATE OR REPLACE FUNCTION public.handle_event_vendor_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  existing_vendor_id UUID;
  new_vendor_id UUID;
BEGIN
  -- If vendor_id is already set, we just make sure it's valid
  IF NEW.vendor_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Get org_id from the event
  SELECT org_id INTO v_org_id FROM public.events WHERE id = NEW.event_id;

  -- Search for existing matching vendor in directory
  SELECT id INTO existing_vendor_id
  FROM public.vendors
  WHERE LOWER(name) = LOWER(TRIM(NEW.vendor_name))
    AND LOWER(category) = LOWER(TRIM(NEW.category))
    AND deleted_at IS NULL
  LIMIT 1;

  IF existing_vendor_id IS NOT NULL THEN
    NEW.vendor_id := existing_vendor_id;
  ELSE
    -- Create new vendor in directory
    INSERT INTO public.vendors (
      org_id,
      name,
      category,
      notes,
      is_verified
    ) VALUES (
      v_org_id,
      TRIM(NEW.vendor_name),
      TRIM(NEW.category),
      NEW.notes,
      false
    )
    RETURNING id INTO new_vendor_id;

    NEW.vendor_id := new_vendor_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_event_vendor_insert ON public.event_vendors;
CREATE TRIGGER trg_event_vendor_insert
  BEFORE INSERT ON public.event_vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_vendor_insert();
