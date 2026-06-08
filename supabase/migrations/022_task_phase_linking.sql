-- Migration 022: Link tasks to phases, task comments, auto-progression

-- ============================================================
-- 1. Add phase_id to tasks
-- ============================================================
ALTER TABLE tasks ADD COLUMN phase_id uuid REFERENCES event_phases(id) ON DELETE SET NULL;

CREATE INDEX idx_tasks_phase_id ON tasks(phase_id);
CREATE INDEX idx_tasks_event_phase ON tasks(event_id, phase_id);

-- ============================================================
-- 2. Task comments table
-- ============================================================
CREATE TABLE task_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id),
  message     text NOT NULL,
  photo_urls  jsonb DEFAULT '[]'::jsonb,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_comments_select" ON task_comments FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE event_id IN (
        SELECT event_id FROM event_access WHERE user_id = auth.uid()
      )
    )
    OR task_id IN (
      SELECT id FROM tasks WHERE event_id IN (
        SELECT id FROM events WHERE
          org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
          OR coordinator_id = auth.uid()
      )
    )
  );

CREATE POLICY "task_comments_insert" ON task_comments FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE event_id IN (
        SELECT event_id FROM event_access WHERE user_id = auth.uid()
      )
    )
    OR task_id IN (
      SELECT id FROM tasks WHERE event_id IN (
        SELECT id FROM events WHERE
          org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
          OR coordinator_id = auth.uid()
      )
    )
    AND user_id = auth.uid()
  );

-- Enable Realtime for task_comments (so updates appear live)
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;

-- ============================================================
-- 3. Auto-progression triggers
-- ============================================================

CREATE OR REPLACE FUNCTION check_and_advance_phase(p_phase_id uuid)
RETURNS void AS $$
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

  -- If phase hasn't started but has tasks, mark it in_progress
  IF v_total > 0 THEN
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

CREATE OR REPLACE FUNCTION auto_advance_phase()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_inserted
  AFTER INSERT ON tasks
  FOR EACH ROW EXECUTE FUNCTION auto_advance_phase();

CREATE TRIGGER on_task_updated
  AFTER UPDATE OF status, phase_id ON tasks
  FOR EACH ROW EXECUTE FUNCTION auto_advance_phase();

CREATE TRIGGER on_task_deleted
  AFTER DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION auto_advance_phase();

-- ============================================================
-- 4. RPCs for manual phase management
-- ============================================================

CREATE OR REPLACE FUNCTION manually_complete_phase(p_phase_id uuid)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reopen_phase(p_phase_id uuid)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. Allow team_member role in profiles
-- ============================================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('planner', 'coordinator', 'vendor', 'client', 'team_member'));
