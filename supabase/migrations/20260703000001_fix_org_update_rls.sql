-- Migration: Allow org members to update organization
-- ================================================================================
-- Uses SECURITY DEFINER RPC to bypass RLS, so no dependency on get_user_org_id
-- overload from migration 138.

-- ── 1. RPC: update org details (bypasses RLS) ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_org(
  p_id            uuid,
  p_name          text DEFAULT NULL,
  p_city          text DEFAULT NULL,
  p_website       text DEFAULT NULL,
  p_instagram     text DEFAULT NULL,
  p_logo_url      text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_my_org_id uuid;
BEGIN
  -- Super admins can edit any org
  IF public.is_super_admin() THEN
    UPDATE public.organizations
    SET
      name      = COALESCE(p_name, name),
      city      = COALESCE(p_city, city),
      website   = COALESCE(p_website, website),
      instagram = COALESCE(p_instagram, instagram),
      logo_url  = COALESCE(p_logo_url, logo_url)
    WHERE id = p_id;
    RETURN FOUND;
  END IF;

  -- Regular users: only allow if they belong to this org
  SELECT org_id INTO v_my_org_id FROM public.profiles WHERE id = auth.uid();
  IF v_my_org_id IS NULL OR v_my_org_id != p_id THEN
    RETURN false;
  END IF;

  UPDATE public.organizations
  SET
    name      = COALESCE(p_name, name),
    city      = COALESCE(p_city, city),
    website   = COALESCE(p_website, website),
    instagram = COALESCE(p_instagram, instagram),
    logo_url  = COALESCE(p_logo_url, logo_url)
  WHERE id = p_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_org(uuid, text, text, text, text, text) TO authenticated;

-- ── 2. RPC: change user's org affiliation ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.change_user_org(p_new_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  UPDATE public.profiles
  SET org_id = p_new_org_id
  WHERE id = auth.uid();
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.change_user_org(uuid) TO authenticated;
