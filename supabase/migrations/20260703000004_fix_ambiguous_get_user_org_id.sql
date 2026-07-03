-- Migration: Fix ambiguous get_user_org_id overloads
-- ================================================================================
-- Problem: The previous migration (20260703000002) added get_user_org_id(text[])
-- via CREATE OR REPLACE, but PostgreSQL treats it as a separate overload from
-- the original get_user_org_id() (0 params). Calling get_user_org_id() with
-- no args becomes ambiguous, breaking all RLS policies that depend on it.
--
-- Fix: Drop the 0-param version so only the DEFAULT-param version remains.

DROP FUNCTION IF EXISTS public.get_user_org_id();

-- Recreate with DEFAULT NULL so both calling conventions work:
--   get_user_org_id()                              → allowed_roles = NULL
--   get_user_org_id(ARRAY['coordinator','planner']) → allowed_roles = ARRAY[...]
CREATE OR REPLACE FUNCTION public.get_user_org_id(allowed_roles text[] DEFAULT NULL)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT org_id FROM public.profiles 
  WHERE id = auth.uid() 
    AND org_id IS NOT NULL
    AND (allowed_roles IS NULL OR role = ANY(allowed_roles))
$$;
