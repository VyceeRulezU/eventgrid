-- Migration 075: Consolidated RLS and access policy fixes
-- =================================================================================

-- 1. Create share_event_with_user helper function to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.share_event_with_user(target_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    -- Case 1: Current user and target user share an event in event_access where current user has accepted
    SELECT 1 FROM public.event_access ea1
    JOIN public.event_access ea2 ON ea1.event_id = ea2.event_id
    WHERE ea1.user_id = auth.uid() 
      AND ea1.accepted_at IS NOT NULL
      AND ea2.user_id = target_user_id
    
    UNION ALL
    
    -- Case 2: Current user is the owner/planner of an event that the target user has access to
    SELECT 1 FROM public.events e
    JOIN public.organizations o ON e.org_id = o.id
    JOIN public.event_access ea ON ea.event_id = e.id
    WHERE o.owner_id = auth.uid() AND ea.user_id = target_user_id
    
    UNION ALL
    
    -- Case 3: Current user is the coordinator of an event that the target user has access to
    SELECT 1 FROM public.events e
    JOIN public.event_access ea ON ea.event_id = e.id
    WHERE e.coordinator_id = auth.uid() AND ea.user_id = target_user_id

    UNION ALL

    -- Case 4: Target user is the owner/planner of an event that the current user has accepted access to
    SELECT 1 FROM public.events e
    JOIN public.organizations o ON e.org_id = o.id
    JOIN public.event_access ea ON ea.event_id = e.id
    WHERE o.owner_id = target_user_id AND ea.user_id = auth.uid() AND ea.accepted_at IS NOT NULL

    UNION ALL

    -- Case 5: Target user is the coordinator of an event that the current user has accepted access to
    SELECT 1 FROM public.events e
    JOIN public.event_access ea ON ea.event_id = e.id
    WHERE e.coordinator_id = target_user_id AND ea.user_id = auth.uid() AND ea.accepted_at IS NOT NULL
  )
$$;

-- Grant execute access to authenticated users
GRANT EXECUTE ON FUNCTION public.share_event_with_user(uuid) TO authenticated;

-- 2. Update the profiles_select_event_members policy
DROP POLICY IF EXISTS "profiles_select_event_members" ON public.profiles;

CREATE POLICY "profiles_select_event_members" ON public.profiles FOR SELECT
  USING (
    -- Same org (via event_access)
    org_id IN (
      SELECT e.org_id FROM public.event_access ea
      JOIN public.events e ON e.id = ea.event_id
      WHERE ea.user_id = auth.uid() AND ea.accepted_at IS NOT NULL
    )
    OR
    public.share_event_with_user(id)
  );

-- 3. Allow accepted team members to select tasks for events they have access to
DROP POLICY IF EXISTS "tasks_select_event_access" ON public.tasks;
CREATE POLICY "tasks_select_event_access" ON public.tasks FOR SELECT
  USING (
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_event_ids()
    )
  );

-- 4. Ensure events SELECT access for event_access members
DROP POLICY IF EXISTS "events_select_event_access" ON public.events;
CREATE POLICY "events_select_event_access" ON public.events FOR SELECT
  USING (
    id IN (SELECT event_id FROM public.get_user_accepted_event_ids())
    AND deleted_at IS NULL
  );

-- 5. Ensure event_activity grants and policies are complete
GRANT ALL ON public.event_activity TO authenticated;
GRANT ALL ON public.event_activity TO service_role;

DROP POLICY IF EXISTS "activity_select" ON public.event_activity;
CREATE POLICY "activity_select" ON public.event_activity FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE
        org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_event_ids()
    )
  );

DROP POLICY IF EXISTS "activity_insert" ON public.event_activity;
CREATE POLICY "activity_insert" ON public.event_activity FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE
        org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_event_ids()
    )
  );
