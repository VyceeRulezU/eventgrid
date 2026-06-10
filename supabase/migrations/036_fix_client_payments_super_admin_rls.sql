-- Migration 036: Fix super_admin RLS for client_payments + backfill is_super_admin
-- ================================================================================
-- 1. Add missing super_admin RLS policy on client_payments (was missed in migration 028).
--    Without this, the Super Admin Dashboard shows "No data yet" for all revenue-related
--    charts (revenue by method, top planners revenue, recent payments, etc.)

-- 2. Backfill is_super_admin for ALL profiles with role = 'super_admin'. Migration 028
--    only backfilled TWO hardcoded emails, leaving every other super_admin user with
--    is_super_admin = false. Since the is_super_admin() helper function checks the
--    is_super_admin BOOLEAN column (not the role TEXT column), ALL RLS policies that
--    call is_super_admin() returned false — causing every dashboard query to return empty.

UPDATE profiles SET is_super_admin = true WHERE role = 'super_admin' AND is_super_admin IS DISTINCT FROM true;

DROP POLICY IF EXISTS "super_admin_client_payments" ON client_payments;

CREATE POLICY "super_admin_client_payments" ON client_payments FOR ALL
  USING (public.is_super_admin());
