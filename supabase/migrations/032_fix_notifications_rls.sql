-- Fix notifications RLS: replace FOR ALL policy with granular policies
-- The old policy "notifications_own" FOR ALL USING (user_id = auth.uid())
-- blocked inserts where the recipient (user_id) differs from the current user.
-- This broke two critical flows:
--   1. Feedback submission → notify all super admins (team member inserts for super admin)
--   2. Admin reply to feedback → notify the author (super admin inserts for team member)

DROP POLICY IF EXISTS "notifications_own" ON notifications;

-- Users can only see their own notifications
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert:
--   - their own notifications
--   - notifications for any super admin (e.g. feedback submission alert)
-- Super admins can insert notifications for any user (e.g. feedback reply)
CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = notifications.user_id AND is_super_admin = true)
  );

-- Users can only update (mark read) their own notifications
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Users can only delete their own notifications
CREATE POLICY "notifications_delete" ON notifications FOR DELETE
  USING (user_id = auth.uid());
