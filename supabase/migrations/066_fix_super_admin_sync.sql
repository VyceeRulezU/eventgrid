-- =============================================================================
-- Fix: is_super_admin() function only checks super_admins table, but users
-- created after migration 036 have profiles.is_super_admin = true without a
-- corresponding row in super_admins. This causes RLS to block super admin
-- access to tables (like referral_partners) that rely on is_super_admin().
-- =============================================================================

-- 1. Backfill any existing super admins missing from super_admins
INSERT INTO public.super_admins (user_id)
SELECT id FROM public.profiles
WHERE (is_super_admin = true OR role = 'super_admin')
  AND id NOT IN (SELECT user_id FROM public.super_admins)
ON CONFLICT (user_id) DO NOTHING;

-- 2. Update is_super_admin() to check both tables, with SECURITY DEFINER
--    to bypass RLS and avoid recursion (profiles RLS → is_super_admin() →
--    profiles RLS → …).
--    We check super_admins first (faster, dedicated table), then fall back
--    to profiles.is_super_admin for legacy users.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
  )
$$;

-- 3. Update handle_new_user trigger to sync super_admins when applicable
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_is_super_admin boolean;
  v_referred_by_code text;
BEGIN
  v_role := TRIM(NEW.raw_user_meta_data->>'role');
  v_is_super_admin := (NEW.raw_user_meta_data->>'is_super_admin') = 'true';
  v_referred_by_code := NULLIF(TRIM(NEW.raw_user_meta_data->>'referred_by_code'), '');

  IF v_role IS NULL OR v_role NOT IN ('planner', 'coordinator', 'vendor', 'client', 'team_member') THEN
    v_role := 'planner';
  END IF;

  INSERT INTO public.profiles (id, email, display_name, role, phone, is_super_admin, referred_by_code)
  VALUES (
    NEW.id,
    NEW.email,
    TRIM(NEW.raw_user_meta_data->>'display_name'),
    v_role,
    TRIM(NEW.raw_user_meta_data->>'phone'),
    v_is_super_admin,
    v_referred_by_code
  )
  ON CONFLICT (id) DO NOTHING;

  -- Sync to super_admins table so is_super_admin() works immediately
  IF v_is_super_admin THEN
    INSERT INTO public.super_admins (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
