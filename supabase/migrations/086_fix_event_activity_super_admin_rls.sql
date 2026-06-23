-- Migration 086: Fix event_activity RLS — add super admin bypass policy
-- Super admins could not see event_activity rows because no super_admin_all
-- policy existed on this table (unlike events, tasks, issues, etc.)

-- 1. Add super admin bypass SELECT policy on event_activity
DROP POLICY IF EXISTS "super_admin_event_activity" ON event_activity;
CREATE POLICY "super_admin_event_activity" ON event_activity FOR SELECT
  USING (public.is_super_admin());

