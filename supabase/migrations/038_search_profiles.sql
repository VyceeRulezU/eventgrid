-- Migration 038: Allow authenticated users to search all profiles
-- ================================================================================
-- RLS on profiles limits what planners/coordinators can see to only profiles
-- in their org or event. This makes it impossible to search for registered
-- users by name/email when trying to add them to a team.
--
-- Fix: Create a SECURITY DEFINER function that bypasses RLS and returns
-- limited profile info (no sensitive columns).

CREATE OR REPLACE FUNCTION public.search_profiles(search_query text)
RETURNS TABLE(id uuid, email text, display_name text, phone text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT id, email, display_name, phone, avatar_url
  FROM profiles
  WHERE email ILIKE '%' || search_query || '%'
     OR display_name ILIKE '%' || search_query || '%'
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.search_profiles(text) TO authenticated;
