-- Add INSERT policy for tasks table
-- Previously only SELECT and UPDATE policies existed, causing "new row violates row-level security policy"
-- Run this in your Supabase SQL editor

DROP POLICY IF EXISTS "tasks_insert_event_access" ON tasks;

CREATE POLICY "tasks_insert_event_access" ON tasks FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR
    event_id IN (
      SELECT event_id FROM event_access WHERE user_id = auth.uid()
    )
  );
