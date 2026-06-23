-- Migration 069: Restore event_access-based SELECT policy for events + fix get_user_org_id
-- ================================================================================
-- Part 1: events SELECT policy
--
--   Migration 037 dropped events_select_event_access to break an RLS recursion
--   cycle, claiming events_select_member (via has_event_access() SECURITY DEFINER)
--   would replace it. But events_select_member and has_event_access() were never
--   created — so team_member users lost all SELECT access to events they were
--   invited to via event_access.
--
--   This re-adds the policy using get_user_accepted_event_ids() which already
--   uses SECURITY DEFINER with row_security = off to prevent recursion.

DROP POLICY IF EXISTS "events_select_event_access" ON events;
CREATE POLICY "events_select_event_access" ON events FOR SELECT
  USING (
    id IN (SELECT event_id FROM public.get_user_accepted_event_ids())
    AND deleted_at IS NULL
  );

-- Part 2: Fix SECURITY DEFINER functions that lack SET search_path = public
--
--   When SECURITY DEFINER functions run without an explicit search_path,
--   PostgreSQL may not find unqualified table references (e.g. "profiles"
--   instead of "public.profiles"), causing "relation does not exist".
--
--   Affected functions that crash with this error:
--     - get_user_org_id()           [migration 003] - used by profiles RLS
--     - check_and_advance_phase()   [migration 022] - used by task triggers
--     - manually_complete_phase()   [migration 022] - called from frontend
--     - reopen_phase()              [migration 022] - called from frontend
--     - search_profiles()           [migration 038] - called when adding members
--     - update_event_header()       [migration 055] - called when updating header

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION check_and_advance_phase(p_phase_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_phase_number integer;
  v_total integer;
  v_done integer;
  v_next_phase_number integer;
BEGIN
  SELECT event_id, phase_number INTO v_event_id, v_phase_number
  FROM event_phases WHERE id = p_phase_id;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'done')
  INTO v_total, v_done
  FROM tasks WHERE phase_id = p_phase_id;

  IF v_total > 0 THEN
    UPDATE event_phases
    SET status = 'in_progress'
    WHERE id = p_phase_id AND status = 'not_started';

    UPDATE events
    SET current_phase = v_phase_number
    WHERE id = v_event_id AND current_phase < v_phase_number;
  END IF;

  IF v_total > 0 AND v_done >= v_total THEN
    UPDATE event_phases
    SET status = 'completed', completed_at = now()
    WHERE id = p_phase_id AND status != 'completed';

    v_next_phase_number := v_phase_number + 1;
    IF v_next_phase_number <= 9 THEN
      UPDATE event_phases
      SET status = 'in_progress'
      WHERE event_id = v_event_id
        AND phase_number = v_next_phase_number
        AND status = 'not_started';

      UPDATE events
      SET current_phase = v_next_phase_number
      WHERE id = v_event_id AND current_phase < v_next_phase_number;
    END IF;

    IF v_phase_number = 9 THEN
      UPDATE events
      SET status = 'completed'
      WHERE id = v_event_id;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION auto_advance_phase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.phase_id IS DISTINCT FROM NEW.phase_id THEN
      IF OLD.phase_id IS NOT NULL THEN
        PERFORM check_and_advance_phase(OLD.phase_id);
      END IF;
      IF NEW.phase_id IS NOT NULL THEN
        PERFORM check_and_advance_phase(NEW.phase_id);
      END IF;
    ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.phase_id IS NOT NULL THEN
      PERFORM check_and_advance_phase(NEW.phase_id);
    END IF;
  ELSIF TG_OP = 'INSERT' AND NEW.phase_id IS NOT NULL THEN
    PERFORM check_and_advance_phase(NEW.phase_id);
  ELSIF TG_OP = 'DELETE' AND OLD.phase_id IS NOT NULL THEN
    PERFORM check_and_advance_phase(OLD.phase_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION manually_complete_phase(p_phase_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_phase_number integer;
  v_next_phase_number integer;
BEGIN
  SELECT event_id, phase_number INTO v_event_id, v_phase_number
  FROM event_phases WHERE id = p_phase_id;

  UPDATE event_phases
  SET status = 'completed', completed_at = now()
  WHERE id = p_phase_id;

  v_next_phase_number := v_phase_number + 1;
  IF v_next_phase_number <= 9 THEN
    UPDATE event_phases
    SET status = 'in_progress'
    WHERE event_id = v_event_id
      AND phase_number = v_next_phase_number
      AND status = 'not_started';

    UPDATE events
    SET current_phase = v_next_phase_number
    WHERE id = v_event_id AND current_phase < v_next_phase_number;
  END IF;

  IF v_phase_number = 9 THEN
    UPDATE events SET status = 'completed' WHERE id = v_event_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION reopen_phase(p_phase_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_phase_number integer;
BEGIN
  SELECT event_id, phase_number INTO v_event_id, v_phase_number
  FROM event_phases WHERE id = p_phase_id;

  UPDATE event_phases
  SET status = 'in_progress', completed_at = null
  WHERE id = p_phase_id;

  UPDATE events
  SET current_phase = v_phase_number
  WHERE id = v_event_id AND current_phase > v_phase_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_profiles(search_query text)
RETURNS TABLE(id uuid, email text, display_name text, phone text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, display_name, phone, avatar_url
  FROM profiles
  WHERE email ILIKE '%' || search_query || '%'
     OR display_name ILIKE '%' || search_query || '%'
  LIMIT 20;
$$;

CREATE OR REPLACE FUNCTION public.update_event_header(p_event_id uuid, p_header_url text)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE events SET header_image_url = p_header_url WHERE id = p_event_id;
$$;

-- ================================================================================
-- Part 3: Enable automatic OAuth account linking (Dashboard only)
--
--   When an existing email/password user signs in with Google using the same
--   email, Supabase can automatically link the Google identity to the existing
--   account so the user can sign in with either method.
--
--   Enable via Supabase Dashboard:
--     Authentication → Settings → "Auto link users" toggle
--   (In some versions this is in Authentication → Providers → Google → "Auto link users")
