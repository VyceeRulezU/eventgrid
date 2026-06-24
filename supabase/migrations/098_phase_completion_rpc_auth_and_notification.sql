-- Migration 098: Add role checks + notifications to phase completion RPCs

-- ============================================================
-- 1. Update manually_complete_phase with auth check + notification
-- ============================================================
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
  v_phase_name text;
  v_caller_role text;
  v_event_ea_role text;
BEGIN
  SELECT event_id, phase_number, phase_name INTO v_event_id, v_phase_number, v_phase_name
  FROM event_phases WHERE id = p_phase_id;

  -- Authorization: caller must be planner, super_admin, or event_access coordinator
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  SELECT role INTO v_event_ea_role FROM event_access WHERE event_id = v_event_id AND user_id = auth.uid();
  IF v_caller_role NOT IN ('planner', 'super_admin') AND (v_event_ea_role IS NULL OR v_event_ea_role != 'coordinator') THEN
    RAISE EXCEPTION 'Not authorized to complete phases';
  END IF;

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

  -- Notify all event_access members + org owner
  INSERT INTO notifications (user_id, event_id, type, title, body)
  SELECT ea.user_id, v_event_id, 'mention', 'Phase completed: ' || v_phase_name, 'Phase ' || v_phase_number || ' has been marked as complete'
  FROM event_access ea
  WHERE ea.event_id = v_event_id AND ea.user_id != auth.uid()
  UNION
  SELECT o.owner_id, v_event_id, 'mention', 'Phase completed: ' || v_phase_name, 'Phase ' || v_phase_number || ' has been marked as complete'
  FROM events e JOIN organizations o ON o.id = e.org_id
  WHERE e.id = v_event_id AND o.owner_id IS NOT NULL AND o.owner_id != auth.uid();
END;
$$;

-- ============================================================
-- 2. Update reopen_phase with auth check + notification
-- ============================================================
CREATE OR REPLACE FUNCTION reopen_phase(p_phase_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_phase_number integer;
  v_phase_name text;
  v_caller_role text;
  v_event_ea_role text;
BEGIN
  SELECT event_id, phase_number, phase_name INTO v_event_id, v_phase_number, v_phase_name
  FROM event_phases WHERE id = p_phase_id;

  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  SELECT role INTO v_event_ea_role FROM event_access WHERE event_id = v_event_id AND user_id = auth.uid();
  IF v_caller_role NOT IN ('planner', 'super_admin') AND (v_event_ea_role IS NULL OR v_event_ea_role != 'coordinator') THEN
    RAISE EXCEPTION 'Not authorized to reopen phases';
  END IF;

  UPDATE event_phases
  SET status = 'in_progress', completed_at = null
  WHERE id = p_phase_id;

  UPDATE events
  SET current_phase = v_phase_number
  WHERE id = v_event_id AND current_phase > v_phase_number;

  -- Notify all event_access members + org owner
  INSERT INTO notifications (user_id, event_id, type, title, body)
  SELECT ea.user_id, v_event_id, 'mention', 'Phase reopened: ' || v_phase_name, 'Phase ' || v_phase_number || ' has been reopened'
  FROM event_access ea
  WHERE ea.event_id = v_event_id AND ea.user_id != auth.uid()
  UNION
  SELECT o.owner_id, v_event_id, 'mention', 'Phase reopened: ' || v_phase_name, 'Phase ' || v_phase_number || ' has been reopened'
  FROM events e JOIN organizations o ON o.id = e.org_id
  WHERE e.id = v_event_id AND o.owner_id IS NOT NULL AND o.owner_id != auth.uid();
END;
$$;
