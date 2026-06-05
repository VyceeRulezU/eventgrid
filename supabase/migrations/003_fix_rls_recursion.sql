-- Fix infinite recursion in profiles_select_event_members policy
-- The original policy queried profiles inside a policy on profiles

-- Helper function to get current user's org_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid()
$$;

-- Drop the recursive policy and recreate using the helper function
DROP POLICY IF EXISTS "profiles_select_event_members" ON profiles;
CREATE POLICY "profiles_select_event_members" ON profiles FOR SELECT
  USING (
    id IN (
      SELECT user_id FROM event_access
      WHERE event_id IN (
        SELECT id FROM events WHERE org_id = public.get_user_org_id()
      )
    )
  );
