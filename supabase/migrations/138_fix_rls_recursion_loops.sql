-- Migration 138: Fix multiple RLS recursion loops caused by direct policy queries
-- ================================================================================
-- Problem: Several policies directly query tables whose policies query back,
-- creating infinite recursion:
--   profiles → event_access/events → organizations.orgs_select_own → profiles
--   events → organizations.orgs_select_own → profiles → event_access/events → ...
--   event_access → events → organizations.orgs_select_own → profiles → ...
-- Fix: Replace direct subqueries with existing SECURITY DEFINER functions that
-- bypass RLS (get_org_event_ids, get_user_event_ids, is_super_admin) or create
-- new ones (get_user_org_id).

-- ── 0. Helper: get the current user's org_id (bypasses RLS on profiles) ─────
-- Returns the user's org_id only if they have an allowed role.
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

-- ── 1. events_select_planner / insert / update ──────────────────────────────
-- Original: org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
-- Fix: use get_org_event_ids() which has SET row_security = off
DROP POLICY IF EXISTS "events_select_planner" ON public.events;
CREATE POLICY "events_select_planner" ON public.events FOR SELECT
  USING (
    id IN (SELECT event_id FROM public.get_org_event_ids())
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "events_insert_planner" ON public.events;
CREATE POLICY "events_insert_planner" ON public.events FOR INSERT
  WITH CHECK (
    id IN (SELECT event_id FROM public.get_org_event_ids())
  );

DROP POLICY IF EXISTS "events_update_planner" ON public.events;
CREATE POLICY "events_update_planner" ON public.events FOR UPDATE
  USING (id IN (SELECT event_id FROM public.get_org_event_ids()))
  WITH CHECK (id IN (SELECT event_id FROM public.get_org_event_ids()));

-- ── 2. event_access_select_planner / insert_planner ─────────────────────────
-- Original: event_id IN (SELECT id FROM events WHERE org_id IN (...))
-- Fix: use get_org_event_ids()
DROP POLICY IF EXISTS "event_access_select_planner" ON public.event_access;
CREATE POLICY "event_access_select_planner" ON public.event_access FOR SELECT
  USING (
    event_id IN (SELECT event_id FROM public.get_org_event_ids())
  );

DROP POLICY IF EXISTS "event_access_insert_planner" ON public.event_access;
CREATE POLICY "event_access_insert_planner" ON public.event_access FOR INSERT
  WITH CHECK (
    event_id IN (SELECT event_id FROM public.get_org_event_ids())
  );

-- ── 3. orgs_select_own / update_own ─────────────────────────────────────────
-- Original: owner_id = auth.uid() OR id IN (SELECT org_id FROM profiles WHERE 
--           id = auth.uid() AND org_id IS NOT NULL AND role IN ('coordinator','planner'))
-- Fix: use get_user_org_id() which has SET row_security = off
DROP POLICY IF EXISTS "orgs_select_own" ON public.organizations;
CREATE POLICY "orgs_select_own"
  ON public.organizations FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id = public.get_user_org_id(ARRAY['coordinator', 'planner'])
  );

DROP POLICY IF EXISTS "orgs_update_own" ON public.organizations;
CREATE POLICY "orgs_update_own"
  ON public.organizations FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR id = public.get_user_org_id(ARRAY['coordinator', 'planner'])
  );

-- ── 4. reviews_select_reviewed ──────────────────────────────────────────────
-- Original: EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
-- Fix: use public.is_super_admin() which has SET row_security = off
DROP POLICY IF EXISTS "reviews_select_reviewed" ON public.reviews;
CREATE POLICY "reviews_select_reviewed" ON public.reviews FOR SELECT
  USING (
    auth.uid() = reviewed_id
    OR auth.uid() = reviewer_id
    OR public.is_super_admin()
  );
