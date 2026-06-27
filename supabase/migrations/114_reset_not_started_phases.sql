-- Migration 114: Retroactively reset phases that are 'in_progress' back to 'not_started' 
-- if they do not contain any tasks that are actually in progress or done.
-- Also align each event's current_phase column with the earliest non-completed phase.

-- 1. Reset phase status
UPDATE event_phases ep
SET status = 'not_started'
WHERE ep.status = 'in_progress'
  AND NOT EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.phase_id = ep.id
      AND t.status IN ('in_progress', 'done')
  );

-- 2. Align event current_phase column with the first phase that is not completed
UPDATE events e
SET current_phase = COALESCE(
  (
    SELECT MIN(phase_number)
    FROM event_phases ep
    WHERE ep.event_id = e.id
      AND ep.status != 'completed'
  ),
  9
);
