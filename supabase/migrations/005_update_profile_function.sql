-- Helper: update own profile (bypasses RLS)
CREATE OR REPLACE FUNCTION update_own_profile(p_user_id uuid, p_display_name text DEFAULT NULL, p_phone text DEFAULT NULL, p_avatar_url text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET
    display_name = COALESCE(p_display_name, display_name),
    phone        = COALESCE(p_phone, phone),
    avatar_url   = COALESCE(p_avatar_url, avatar_url)
  WHERE id = p_user_id;
  RETURN true;
END;
$$;
