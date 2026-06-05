-- Fix handle_new_user trigger to be robust against missing/invalid role
-- The profiles.role column has NOT NULL CHECK (role IN ('planner','coordinator','vendor','client'))
-- If raw_user_meta_data->>'role' is NULL or invalid, INSERT fails with:
--   "Database error saving new user"
-- Solution: COALESCE to 'planner' and strip any whitespace

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
BEGIN
  -- Read role from metadata, strip whitespace, default to 'planner'
  v_role := TRIM(NEW.raw_user_meta_data->>'role');

  -- Ensure role is one of the allowed values; default to 'planner' if not
  IF v_role IS NULL OR v_role NOT IN ('planner', 'coordinator', 'vendor', 'client') THEN
    v_role := 'planner';
  END IF;

  INSERT INTO public.profiles (id, email, display_name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    TRIM(NEW.raw_user_meta_data->>'display_name'),
    v_role,
    TRIM(NEW.raw_user_meta_data->>'phone')
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate errors on retry

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
