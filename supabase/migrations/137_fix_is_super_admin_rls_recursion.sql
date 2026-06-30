-- Migration 137: Fix infinite recursion in is_super_admin() when called from profiles RLS policy
-- ================================================================================
-- Problem: is_super_admin() queries profiles without SET row_security = off.
-- When called from the profiles_select_event_members policy, it triggers recursion.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
  )
$$;
