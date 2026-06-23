-- Migration 071: Fix profiles RLS search path and is_super_admin row security recursion
-- =================================================================================

-- 1. Create automated sync trigger for super_admins
-- =================================================================================
CREATE OR REPLACE FUNCTION public.sync_super_admins()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_super_admin = true THEN
    INSERT INTO public.super_admins (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    DELETE FROM public.super_admins WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_sync_super_admins ON profiles;
CREATE TRIGGER trigger_sync_super_admins
  AFTER INSERT OR UPDATE OF is_super_admin ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_super_admins();

-- Backfill any existing super admins missing from super_admins
INSERT INTO public.super_admins (user_id)
SELECT id FROM public.profiles
WHERE is_super_admin = true
  AND id NOT IN (SELECT user_id FROM public.super_admins)
ON CONFLICT (user_id) DO NOTHING;

-- 2. Fix is_super_admin() security definer context and search path
-- =================================================================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  )
$$;

-- 3. Fix profiles_select_event_members policy by fully qualifying all referenced tables
-- =================================================================================
DROP POLICY IF EXISTS "profiles_select_event_members" ON profiles;

CREATE POLICY "profiles_select_event_members" ON profiles FOR SELECT
  USING (
    -- Same org (via event_access)
    org_id IN (
      SELECT e.org_id FROM public.event_access ea
      JOIN public.events e ON e.id = ea.event_id
      WHERE ea.user_id = auth.uid() AND ea.accepted_at IS NOT NULL
    )
    OR
    -- Fellow event participants
    id IN (
      SELECT user_id FROM public.event_access
      WHERE event_id IN (
        SELECT event_id FROM public.get_user_accepted_event_ids()
      )
    )
  );

-- 4. Fix invitations policies on invitations table to qualify tables
-- =================================================================================
DROP POLICY IF EXISTS "invitations_select_planner" ON invitations;

CREATE POLICY "invitations_select_planner" ON invitations FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE
        org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_coordinator_event_ids()
    )
  );

DROP POLICY IF EXISTS "invitations_insert" ON invitations;

CREATE POLICY "invitations_insert" ON invitations FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE
        org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_coordinator_event_ids()
    )
  );

DROP POLICY IF EXISTS "invitations_select_own" ON invitations;
CREATE POLICY "invitations_select_own" ON invitations FOR SELECT
  USING (email IN (SELECT email FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "invitations_update_self" ON invitations;
CREATE POLICY "invitations_update_self" ON invitations FOR UPDATE
  USING (email IN (SELECT email FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (
    email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
    AND status = 'accepted'
  );

-- 5. Fix event_access policies to qualify tables
-- =================================================================================
DROP POLICY IF EXISTS "event_access_update_members" ON event_access;

CREATE POLICY "event_access_update_members" ON event_access FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE
        org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_coordinator_event_ids()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE
        org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR
    event_id IN (
      SELECT event_id FROM public.get_user_accepted_coordinator_event_ids()
    )
  );

DROP POLICY IF EXISTS "event_access_select_planner" ON event_access;
CREATE POLICY "event_access_select_planner" ON event_access FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE org_id IN (
        SELECT id FROM public.organizations WHERE owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "event_access_insert_planner" ON event_access;
CREATE POLICY "event_access_insert_planner" ON event_access FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE org_id IN (
        SELECT id FROM public.organizations WHERE owner_id = auth.uid()
      )
    )
  );

-- 6. Fix events policies to qualify tables
-- =================================================================================
DROP POLICY IF EXISTS "events_select_planner" ON events;
CREATE POLICY "events_select_planner" ON events FOR SELECT
  USING (
    org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "events_insert_planner" ON events;
CREATE POLICY "events_insert_planner" ON events FOR INSERT
  WITH CHECK (
    org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "events_update_planner" ON events;
CREATE POLICY "events_update_planner" ON events FOR UPDATE
  USING (org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid()));

-- 7. Fix reviews policies to qualify tables
-- =================================================================================
DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT
  WITH CHECK (
    (auth.uid() = reviewer_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('vendor', 'client')))
    OR
    (reviewer_id IS NULL AND reviewer_name IS NOT NULL)
  );

DROP POLICY IF EXISTS "reviews_select_reviewed" ON reviews;
CREATE POLICY "reviews_select_reviewed" ON reviews FOR SELECT
  USING (
    auth.uid() = reviewed_id
    OR auth.uid() = reviewer_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

-- 8. Fix empty search path logging triggers on event_access and tasks tables
-- =================================================================================
CREATE OR REPLACE FUNCTION public.log_event_access_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name text;
BEGIN
  SELECT display_name INTO v_actor_name FROM profiles WHERE id = COALESCE(NEW.invited_by, NEW.user_id);

  INSERT INTO event_activity (event_id, action_type, description, actor_id, actor_name)
  VALUES (
    NEW.event_id,
    'team_member_added',
    CASE
      WHEN NEW.role = 'coordinator' THEN 'A coordinator was added to the team'
      WHEN NEW.role = 'team_member' THEN 'A team member joined the event'
      ELSE FORMAT('A %s was added to the team', NEW.role)
    END,
    COALESCE(NEW.invited_by, NEW.user_id),
    COALESCE(v_actor_name, 'A team member')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_task_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name text;
BEGIN
  SELECT display_name INTO v_actor_name FROM profiles WHERE id = NEW.created_by;

  INSERT INTO event_activity (event_id, action_type, description, actor_id, actor_name)
  VALUES (
    NEW.event_id,
    'task_created',
    'Task "' || NEW.title || '" was created',
    NEW.created_by,
    COALESCE(v_actor_name, 'A team member')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_task_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT display_name INTO v_actor_name FROM profiles WHERE id = NEW.assignee_id;

    INSERT INTO event_activity (event_id, action_type, description, actor_id, actor_name)
    VALUES (
      NEW.event_id,
      'task_status_changed',
      'Task "' || NEW.title || '" marked as ' || NEW.status,
      COALESCE(NEW.assignee_id, NEW.created_by),
      COALESCE(v_actor_name, 'A team member')
    );
  END IF;
  RETURN NEW;
END;
$$;
