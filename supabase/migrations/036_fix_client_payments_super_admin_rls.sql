-- Migration 036: Fix super_admin RLS — replace function calls with inline subqueries
-- ================================================================================
-- The root cause of all HTTP 500 errors on events/guests/client_payments queries:
-- Every super_admin_* RLS policy from migration 028 uses public.is_super_admin().
-- That function queries profiles, which triggers RLS on profiles, which includes
-- the super_admin_profiles policy, which calls is_super_admin() again — recursion.
-- Even with SECURITY DEFINER, the function's SET search_path = public breaks
-- auth.uid() resolution, causing PostgREST to return 500.
--
-- Fix: Replace every public.is_super_admin() call with an inline subquery:
--   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
-- This subquery relies only on the profiles_select_own policy (id = auth.uid()),
-- which has no function call and no recursion risk.
--
-- 1. Backfill is_super_admin + role for known super admins
--    (role-based backfill catches newer super_admins; email-based catches
--     legacy accounts where role may have been overwritten by a trigger)
UPDATE profiles SET is_super_admin = true WHERE role = 'super_admin' AND is_super_admin IS DISTINCT FROM true;
UPDATE profiles SET is_super_admin = true
  WHERE email IN ('admin@eventgrid.ng', 'eventgridapp@gmail.com')
  AND is_super_admin IS DISTINCT FROM true;

-- 2. Drop all super_admin policies that call is_super_admin() and recreate with inline subqueries
--    (following the pattern already used in migrations 031, 032, 033)

-- feedback
DROP POLICY IF EXISTS "super_admin_all" ON feedback;
CREATE POLICY "super_admin_all" ON feedback FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- vendors
DROP POLICY IF EXISTS "super_admin_all" ON vendors;
CREATE POLICY "super_admin_all" ON vendors FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- events
DROP POLICY IF EXISTS "super_admin_events" ON events;
CREATE POLICY "super_admin_events" ON events FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- organizations
DROP POLICY IF EXISTS "super_admin_orgs" ON organizations;
CREATE POLICY "super_admin_orgs" ON organizations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- profiles
DROP POLICY IF EXISTS "super_admin_profiles" ON profiles;
CREATE POLICY "super_admin_profiles" ON profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- event_access
DROP POLICY IF EXISTS "super_admin_event_access" ON event_access;
CREATE POLICY "super_admin_event_access" ON event_access FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- guests
DROP POLICY IF EXISTS "super_admin_guests" ON guests;
CREATE POLICY "super_admin_guests" ON guests FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- live_feed_posts
DROP POLICY IF EXISTS "super_admin_live_feed" ON live_feed_posts;
CREATE POLICY "super_admin_live_feed" ON live_feed_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- tasks
DROP POLICY IF EXISTS "super_admin_tasks" ON tasks;
CREATE POLICY "super_admin_tasks" ON tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- issues
DROP POLICY IF EXISTS "super_admin_issues" ON issues;
CREATE POLICY "super_admin_issues" ON issues FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- media
DROP POLICY IF EXISTS "super_admin_media" ON media;
CREATE POLICY "super_admin_media" ON media FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- financial_entries
DROP POLICY IF EXISTS "super_admin_financial" ON financial_entries;
CREATE POLICY "super_admin_financial" ON financial_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- invitations
DROP POLICY IF EXISTS "super_admin_invitations" ON invitations;
CREATE POLICY "super_admin_invitations" ON invitations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- client_payments (was missing entirely in migration 028)
DROP POLICY IF EXISTS "super_admin_client_payments" ON client_payments;
CREATE POLICY "super_admin_client_payments" ON client_payments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));
