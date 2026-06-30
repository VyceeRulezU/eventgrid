-- Migration 139: Save avatar_url from OAuth providers (Google, etc.)
-- ================================================================================
-- When users sign up via Google OAuth, their profile picture URL is available
-- in raw_user_meta_data->>'avatar_url' (Supabase sets this from the provider).
-- This migration updates handle_new_user to save it to profiles.avatar_url.

CREATE OR REPLACE FUNCTION public.handle_new_user()
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

  INSERT INTO public.profiles (id, email, display_name, avatar_url, role, phone, is_super_admin, referred_by_code)
  VALUES (
    NEW.id,
    LOWER(NEW.email),
    TRIM(NEW.raw_user_meta_data->>'display_name'),
    TRIM(NEW.raw_user_meta_data->>'avatar_url'),         -- Google/Apple OAuth avatar
    v_role,
    TRIM(NEW.raw_user_meta_data->>'phone'),
    v_is_super_admin,
    v_referred_by_code
  )
  ON CONFLICT (id) DO UPDATE
    SET email = LOWER(EXCLUDED.email);

  -- Sync to super_admins table so is_super_admin() works immediately
  IF v_is_super_admin THEN
    INSERT INTO public.super_admins (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
