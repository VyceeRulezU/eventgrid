-- Migration 024: Fix task_comments RLS and grants

-- Grant table access so RLS policies can be evaluated
GRANT ALL ON task_comments TO authenticated;
GRANT ALL ON task_comments TO service_role;

-- Drop the broken policy (AND/OR precedence issue)
DROP POLICY IF EXISTS "task_comments_insert" ON task_comments;

-- Recreate with explicit parentheses so both branches check user_id
CREATE POLICY "task_comments_insert" ON task_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
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
    )
  );
