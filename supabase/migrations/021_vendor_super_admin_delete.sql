-- Allow super admins to soft-delete vendors (update deleted_at)
-- Super admins are identified by raw_user_meta_data->>'role' = 'super_admin'

CREATE POLICY "vendors_update_super_admin" ON vendors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'super_admin'
    )
  );
