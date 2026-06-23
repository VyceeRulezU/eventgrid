-- Migration 083: Fix handle_new_user trigger to normalise email to lowercase on insert
-- Preserves all existing logic (super_admin sync, referred_by_code, role fallback)
-- but adds LOWER() around NEW.email so profiles always store lowercase emails

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
    LOWER(NEW.email),                              -- always store lowercase
    TRIM(NEW.raw_user_meta_data->>'display_name'),
    v_role,
    TRIM(NEW.raw_user_meta_data->>'phone'),
    v_is_super_admin,
    v_referred_by_code
  )
  ON CONFLICT (id) DO UPDATE
    SET email = LOWER(EXCLUDED.email);             -- fix email on conflict (safe, other cols unchanged)

  -- Sync to super_admins table so is_super_admin() works immediately
  IF v_is_super_admin THEN
    INSERT INTO public.super_admins (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
