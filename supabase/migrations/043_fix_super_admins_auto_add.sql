-- Migration 043: Auto-add super admins to super_admins table on signup

-- 1. Update handle_new_user to also insert into super_admins
CREATE OR REPLACE FUNCTION public.handle_new_user()
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

  -- Also add to super_admins so is_super_admin() function works
  IF v_is_super_admin THEN
    INSERT INTO public.super_admins (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Backfill any existing profiles with is_super_admin=true that are missing from super_admins
INSERT INTO public.super_admins (user_id)
  SELECT id FROM profiles
  WHERE is_super_admin = true
    AND id NOT IN (SELECT user_id FROM public.super_admins)
ON CONFLICT (user_id) DO NOTHING;
