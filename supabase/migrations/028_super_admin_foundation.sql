-- Migration 028: Super admin foundation
-- Adds is_super_admin column, helper function, and RLS bypass policies

-- ============================================================
-- 1. Add is_super_admin column to profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- ============================================================
-- 2. Create SECURITY DEFINER helper to check super_admin status
--    (bypasses RLS so it can read profiles.is_super_admin safely)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()),
    false
  )
$$;

-- ============================================================
-- 3. Promote existing super admins (set via env var email list)
--    These are manually curated — run only if you know the emails
-- ============================================================
UPDATE profiles SET is_super_admin = true
WHERE email IN ('admin@eventgrid.ng', 'eventgridapp@gmail.com');

-- ============================================================
-- 4. Replace old super_admin RLS policies (checked auth.user_meta)
--    with new policies using public.is_super_admin()
-- ============================================================

-- 4a. feedback table: drop old policies, add new
DROP POLICY IF EXISTS "super_admin_feedback_select" ON feedback;
DROP POLICY IF EXISTS "super_admin_feedback_update" ON feedback;
CREATE POLICY "super_admin_all" ON feedback FOR ALL
  USING (public.is_super_admin());

-- 4b. vendors table: drop old policy, add new
DROP POLICY IF EXISTS "vendors_update_super_admin" ON vendors;
CREATE POLICY "super_admin_all" ON vendors FOR ALL
  USING (public.is_super_admin());

-- ============================================================
-- 5. Add super admin bypass policies to all key tables
-- ============================================================

-- events
DROP POLICY IF EXISTS "super_admin_all" ON events;
CREATE POLICY "super_admin_events" ON events FOR ALL
  USING (public.is_super_admin());

-- organizations
DROP POLICY IF EXISTS "super_admin_orgs" ON organizations;
CREATE POLICY "super_admin_orgs" ON organizations FOR ALL
  USING (public.is_super_admin());

-- profiles (super admins can read/write any profile)
DROP POLICY IF EXISTS "super_admin_profiles" ON profiles;
CREATE POLICY "super_admin_profiles" ON profiles FOR ALL
  USING (public.is_super_admin());

-- event_access
DROP POLICY IF EXISTS "super_admin_event_access" ON event_access;
CREATE POLICY "super_admin_event_access" ON event_access FOR ALL
  USING (public.is_super_admin());

-- guests
DROP POLICY IF EXISTS "super_admin_guests" ON guests;
CREATE POLICY "super_admin_guests" ON guests FOR ALL
  USING (public.is_super_admin());

-- live_feed_posts
DROP POLICY IF EXISTS "super_admin_live_feed" ON live_feed_posts;
CREATE POLICY "super_admin_live_feed" ON live_feed_posts FOR ALL
  USING (public.is_super_admin());

-- tasks
DROP POLICY IF EXISTS "super_admin_tasks" ON tasks;
CREATE POLICY "super_admin_tasks" ON tasks FOR ALL
  USING (public.is_super_admin());

-- issues
DROP POLICY IF EXISTS "super_admin_issues" ON issues;
CREATE POLICY "super_admin_issues" ON issues FOR ALL
  USING (public.is_super_admin());

-- media
DROP POLICY IF EXISTS "super_admin_media" ON media;
CREATE POLICY "super_admin_media" ON media FOR ALL
  USING (public.is_super_admin());

-- financial_entries
DROP POLICY IF EXISTS "super_admin_financial" ON financial_entries;
CREATE POLICY "super_admin_financial" ON financial_entries FOR ALL
  USING (public.is_super_admin());

-- invitations
DROP POLICY IF EXISTS "super_admin_invitations" ON invitations;
CREATE POLICY "super_admin_invitations" ON invitations FOR ALL
  USING (public.is_super_admin());

-- ============================================================
-- 6. Update handle_new_user trigger to accept super_admin role
--     from registration metadata
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_is_super_admin boolean;
BEGIN
  v_role := TRIM(NEW.raw_user_meta_data->>'role');
  v_is_super_admin := (NEW.raw_user_meta_data->>'is_super_admin') = 'true';

  IF v_role IS NULL OR v_role NOT IN ('planner', 'coordinator', 'vendor', 'client', 'team_member') THEN
    v_role := 'planner';
  END IF;

  INSERT INTO public.profiles (id, email, display_name, role, phone, is_super_admin)
  VALUES (
    NEW.id,
    NEW.email,
    TRIM(NEW.raw_user_meta_data->>'display_name'),
    v_role,
    TRIM(NEW.raw_user_meta_data->>'phone'),
    v_is_super_admin
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
