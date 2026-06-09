-- Fix feedback RLS policies: use profiles.is_super_admin instead of
-- auth.users.raw_user_meta_data->>'role' = 'super_admin'
-- The app identifies super admins via profiles.is_super_admin, not auth user metadata.

DROP POLICY IF EXISTS "Super admins can view all feedback" ON feedback;
CREATE POLICY "Super admins can view all feedback"
  ON feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can update feedback" ON feedback;
CREATE POLICY "Super admins can update feedback"
  ON feedback FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_super_admin = true
    )
  );
