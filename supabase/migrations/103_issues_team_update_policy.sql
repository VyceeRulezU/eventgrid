-- Migration 103: Allow team members to resolve (update) issues
-- Team members could insert and select issues but not update them.
-- This caused resolve to silently fail (RLS blocked the UPDATE, 
-- but Supabase returns error: null with 0 rows affected).

DROP POLICY IF EXISTS "issues_team_update" ON issues;
CREATE POLICY "issues_team_update" ON issues FOR UPDATE
  USING (event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid()));
