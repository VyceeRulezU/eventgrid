-- Migration 090: Fix event_vendors RLS — add event_access and super admin policies
-- Team members and coordinators via event_access could not add/edit/delete vendors.
-- Super admins had no access at all.

-- ============================================================
-- 1. Allow users with event_access to INSERT event_vendors
-- ============================================================
DROP POLICY IF EXISTS "event_vendors_event_access_insert" ON event_vendors;
CREATE POLICY "event_vendors_event_access_insert" ON event_vendors FOR INSERT
  WITH CHECK (
    event_id IN (SELECT event_id FROM public.get_user_event_ids())
  );

-- ============================================================
-- 2. Allow users with event_access to UPDATE event_vendors
-- ============================================================
DROP POLICY IF EXISTS "event_vendors_event_access_update" ON event_vendors;
CREATE POLICY "event_vendors_event_access_update" ON event_vendors FOR UPDATE
  USING (
    event_id IN (SELECT event_id FROM public.get_user_event_ids())
  );

-- ============================================================
-- 3. Allow users with event_access to DELETE event_vendors
-- ============================================================
DROP POLICY IF EXISTS "event_vendors_event_access_delete" ON event_vendors;
CREATE POLICY "event_vendors_event_access_delete" ON event_vendors FOR DELETE
  USING (
    event_id IN (SELECT event_id FROM public.get_user_event_ids())
  );

-- ============================================================
-- 4. Allow coordinators (direct on events table) to INSERT/UPDATE/DELETE
-- ============================================================
DROP POLICY IF EXISTS "event_vendors_coordinator_insert" ON event_vendors;
CREATE POLICY "event_vendors_coordinator_insert" ON event_vendors FOR INSERT
  WITH CHECK (
    event_id IN (SELECT id FROM events WHERE coordinator_id = auth.uid())
  );

DROP POLICY IF EXISTS "event_vendors_coordinator_update" ON event_vendors;
CREATE POLICY "event_vendors_coordinator_update" ON event_vendors FOR UPDATE
  USING (
    event_id IN (SELECT id FROM events WHERE coordinator_id = auth.uid())
  );

DROP POLICY IF EXISTS "event_vendors_coordinator_delete" ON event_vendors;
CREATE POLICY "event_vendors_coordinator_delete" ON event_vendors FOR DELETE
  USING (
    event_id IN (SELECT id FROM events WHERE coordinator_id = auth.uid())
  );

-- ============================================================
-- 5. Super admin bypass
-- ============================================================
DROP POLICY IF EXISTS "super_admin_event_vendors" ON event_vendors;
CREATE POLICY "super_admin_event_vendors" ON event_vendors FOR ALL
  USING (public.is_super_admin());

