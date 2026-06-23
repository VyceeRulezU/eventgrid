-- Migration 036: Fix super_admin RLS — break recursion with dedicated super_admins table
-- ================================================================================
-- Root cause of persistent HTTP 500 on events/guests/client_payments:
--   Every super_admin_* policy needs to check if the user is a super_admin.
--   That check queries profiles (either via is_super_admin() or inline
--   subquery), which triggers profiles RLS, which includes super_admin_profiles,
--   which must check again → infinite recursion → stack overflow → 500.
--
--   Even SECURITY DEFINER functions don't reliably bypass this in all
--   Supabase configurations (depends on function owner's row_security).
--
-- Fix: Create a super_admins table with NO RLS enabled. The is_super_admin()
--       function reads from this table instead of profiles, so no recursion
--       is possible — no RLS to trigger.

-- 1. Create super_admins table (NO row-level security — intentionally)
--    Grant SELECT to authenticated so is_super_admin() (no SECURITY DEFINER)
--    can read it when called from RLS policies.
CREATE TABLE IF NOT EXISTS public.super_admins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
GRANT SELECT ON public.super_admins TO authenticated;

-- 2. Migrate existing super admins to the new table
INSERT INTO public.super_admins (user_id)
  SELECT id FROM profiles
  WHERE is_super_admin = true OR role = 'super_admin' OR email IN ('admin@naligrid.com', 'eventgridapp@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Recreate is_super_admin() to read from super_admins (no RLS → no recursion)
--    SECURITY DEFINER ensures the function runs as superuser so auth.uid() always
--    resolves correctly from the JWT context.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
$$;

-- 4. Rebuild ALL super_admin RLS policies using the fixed function

-- profiles — the function no longer queries profiles, so no recursion
DROP POLICY IF EXISTS "super_admin_profiles" ON profiles;
CREATE POLICY "super_admin_profiles" ON profiles FOR ALL
  USING (public.is_super_admin());

-- feedback
DROP POLICY IF EXISTS "super_admin_all" ON feedback;
CREATE POLICY "super_admin_all" ON feedback FOR ALL
  USING (public.is_super_admin());

-- vendors
DROP POLICY IF EXISTS "super_admin_all" ON vendors;
CREATE POLICY "super_admin_all" ON vendors FOR ALL
  USING (public.is_super_admin());

-- events
DROP POLICY IF EXISTS "super_admin_events" ON events;
CREATE POLICY "super_admin_events" ON events FOR ALL
  USING (public.is_super_admin());

-- organizations
DROP POLICY IF EXISTS "super_admin_orgs" ON organizations;
CREATE POLICY "super_admin_orgs" ON organizations FOR ALL
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

-- client_payments (was missing entirely in migration 028)
DROP POLICY IF EXISTS "super_admin_client_payments" ON client_payments;
CREATE POLICY "super_admin_client_payments" ON client_payments FOR ALL
  USING (public.is_super_admin());
