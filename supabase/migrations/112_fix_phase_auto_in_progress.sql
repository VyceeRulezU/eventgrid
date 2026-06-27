-- Migration 112: Only mark phase as in_progress when a task is actually started or done,
-- not just when a task exists in the phase.
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
  IF v_total > 0 AND v_done >= v_total THEN
    UPDATE event_phases
    SET status = 'completed', completed_at = now()
    WHERE id = p_phase_id AND status != 'completed';

    -- Advance to next phase
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

    -- If this was the last phase, mark event completed
    IF v_phase_number = 9 THEN
      UPDATE events
      SET status = 'completed'
      WHERE id = v_event_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
