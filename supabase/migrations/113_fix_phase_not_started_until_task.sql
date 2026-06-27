-- Migration 113: Prevent auto-setting next phase to in_progress upon completing the previous phase.
-- Phases should remain 'not_started' until a task inside them is actually set to 'in_progress' or 'done'.

CREATE OR REPLACE FUNCTION check_and_advance_phase(p_phase_id uuid)
RETURNS void AS $$
DECLARE
  v_event_id uuid;
  v_phase_number integer;
  v_total integer;
  v_done integer;
  v_in_progress integer;
  v_next_phase_number integer;
BEGIN
  SELECT event_id, phase_number INTO v_event_id, v_phase_number
  FROM event_phases WHERE id = p_phase_id;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'done'), COUNT(*) FILTER (WHERE status = 'in_progress')
  INTO v_total, v_done, v_in_progress
  FROM tasks WHERE phase_id = p_phase_id;

  -- Only mark phase in_progress when at least one task is actually started or done
  IF v_in_progress > 0 OR v_done > 0 THEN
    UPDATE event_phases
    SET status = 'in_progress'
    WHERE id = p_phase_id AND status = 'not_started';

    UPDATE events
    SET current_phase = v_phase_number
    WHERE id = v_event_id AND current_phase < v_phase_number;
  END IF;

  -- If all tasks are done, mark phase completed and auto-advance
  -- but do NOT automatically mark the next phase as 'in_progress' until a task inside it starts.
  IF v_total > 0 AND v_done >= v_total THEN
    UPDATE event_phases
    SET status = 'completed', completed_at = now()
    WHERE id = p_phase_id AND status != 'completed';

    -- Advance to next phase pointer in events
    v_next_phase_number := v_phase_number + 1;
    IF v_next_phase_number <= 9 THEN
      UPDATE events
      SET current_phase = v_next_phase_number
      WHERE id = v_event_id AND current_phase < v_next_phase_number;
    END IF;

    -- If this was the last phase, mark event completed
    IF v_phase_number = 9 THEN
      UPDATE events
      SET status = 'completed'
      WHERE id = v_event_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


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
    -- DO NOT set status = 'in_progress' automatically here either.

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
