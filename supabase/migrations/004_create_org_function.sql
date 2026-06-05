-- Helper: create an organization (bypasses RLS)
CREATE OR REPLACE FUNCTION create_org(p_name text, p_owner_id uuid, p_city text, p_logo_url text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org organizations%ROWTYPE;
BEGIN
  -- Ensure profile exists (handles users created before the auth trigger was added)
  INSERT INTO profiles (id, email, role)
  SELECT p_owner_id, email, COALESCE(raw_user_meta_data->>'role', 'planner')
  FROM auth.users
  WHERE id = p_owner_id
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO organizations (name, owner_id, city, logo_url)
  VALUES (p_name, p_owner_id, p_city, p_logo_url)
  RETURNING * INTO v_org;

  UPDATE profiles SET org_id = v_org.id WHERE id = p_owner_id;

  RETURN json_build_object(
    'id', v_org.id,
    'name', v_org.name,
    'logo_url', v_org.logo_url
  );
END;
$$;
