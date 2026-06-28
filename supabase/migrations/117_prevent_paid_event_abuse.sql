-- Migration 117: Prevent abuse of paid events
--
-- Goals:
--   1. event_date immutable after first set (all events)
--   2. Phase DELETE blocked when event is paid AND has budget allocations
--   3. Phase regression (completed → not_started) blocked when paid AND has budget
--   4. Hard DELETE blocked on child tables when event is paid
--
-- Super admins bypass all restrictions via existing super_admin_* FOR ALL policies.

-- ── 0. Helper functions ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.event_is_paid(eid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM public.events WHERE id = eid AND payment_status = 'paid')
$$;

CREATE OR REPLACE FUNCTION public.event_has_budget(eid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM public.budget_allocations WHERE event_id = eid AND allocated > 0)
$$;

-- ── 1. event_date immutability ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.prevent_event_date_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.event_date IS NOT NULL AND NEW.event_date IS DISTINCT FROM OLD.event_date THEN
    RAISE EXCEPTION 'Event date cannot be changed once set.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_event_date_immutable ON public.events;
CREATE TRIGGER enforce_event_date_immutable
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_event_date_change();

-- ── 2. Phase protection ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.prevent_paid_phase_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.event_is_paid(OLD.event_id) AND public.event_has_budget(OLD.event_id) THEN
    RAISE EXCEPTION 'Cannot delete a phase — event has budget allocations. Remove budget first or contact support.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS enforce_phase_no_delete_on_budget ON public.event_phases;
CREATE TRIGGER enforce_phase_no_delete_on_budget
  BEFORE DELETE ON public.event_phases
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_paid_phase_delete();

CREATE OR REPLACE FUNCTION public.prevent_paid_phase_regression()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'completed' AND NEW.status = 'not_started'
     AND public.event_is_paid(OLD.event_id) AND public.event_has_budget(OLD.event_id) THEN
    RAISE EXCEPTION 'Cannot reset a completed phase — event has budget allocations.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_phase_no_regression_on_budget ON public.event_phases;
CREATE TRIGGER enforce_phase_no_regression_on_budget
  BEFORE UPDATE ON public.event_phases
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_paid_phase_regression();

-- ── 3. Block hard DELETE on child tables when event is paid ──────────────────

-- ── 3a. tasks ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "tasks_delete_event_access" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_paid_block" ON public.tasks;

CREATE POLICY "tasks_delete_paid_block" ON public.tasks FOR DELETE
  USING (
    NOT public.event_is_paid(event_id)
    AND (
      event_id IN (SELECT id FROM public.events WHERE
        org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      )
      OR event_id IN (SELECT id FROM public.events WHERE coordinator_id = auth.uid())
      OR created_by = auth.uid()
      OR event_id IN (SELECT event_id FROM public.event_access WHERE user_id = auth.uid())
    )
  );

-- ── 3b. event_phases ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "event_phases_delete_paid_block" ON public.event_phases;

CREATE POLICY "event_phases_delete_paid_block" ON public.event_phases FOR DELETE
  USING (
    NOT public.event_is_paid(event_id)
    AND (
      event_id IN (SELECT id FROM public.events WHERE
        org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
      )
      OR event_id IN (SELECT event_id FROM public.event_access WHERE user_id = auth.uid())
    )
  );

-- ── 3c. event_vendors ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "event_vendors_planner" ON event_vendors;
DROP POLICY IF EXISTS "event_vendors_planner_select" ON event_vendors;
DROP POLICY IF EXISTS "event_vendors_planner_insert" ON event_vendors;
DROP POLICY IF EXISTS "event_vendors_planner_update" ON event_vendors;
DROP POLICY IF EXISTS "event_vendors_planner_delete" ON event_vendors;

CREATE POLICY "event_vendors_planner_select" ON event_vendors FOR SELECT
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "event_vendors_planner_insert" ON event_vendors FOR INSERT
  WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "event_vendors_planner_update" ON event_vendors FOR UPDATE
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "event_vendors_planner_delete" ON event_vendors FOR DELETE
  USING (
    NOT public.event_is_paid(event_id)
    AND event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "event_vendors_event_access_delete" ON event_vendors;
DROP POLICY IF EXISTS "event_vendors_coordinator_delete" ON event_vendors;

CREATE POLICY "event_vendors_event_access_delete" ON event_vendors FOR DELETE
  USING (
    NOT public.event_is_paid(event_id)
    AND event_id IN (SELECT event_id FROM public.get_user_event_ids())
  );

CREATE POLICY "event_vendors_coordinator_delete" ON event_vendors FOR DELETE
  USING (
    NOT public.event_is_paid(event_id)
    AND event_id IN (SELECT id FROM public.events WHERE coordinator_id = auth.uid())
  );

-- ── 3d. guests ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "guests_planner_coordinator_full" ON guests;
DROP POLICY IF EXISTS "guests_planner_coordinator_select" ON guests;
DROP POLICY IF EXISTS "guests_planner_coordinator_insert" ON guests;
DROP POLICY IF EXISTS "guests_planner_coordinator_update" ON guests;
DROP POLICY IF EXISTS "guests_planner_coordinator_delete" ON guests;

CREATE POLICY "guests_planner_coordinator_select" ON guests FOR SELECT
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "guests_planner_coordinator_insert" ON guests FOR INSERT
  WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "guests_planner_coordinator_update" ON guests FOR UPDATE
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "guests_planner_coordinator_delete" ON guests FOR DELETE
  USING (
    NOT public.event_is_paid(event_id)
    AND event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

-- ── 3e. event_access ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "event_access_delete_team_members" ON public.event_access;
DROP POLICY IF EXISTS "event_access_delete_planner" ON public.event_access;
DROP POLICY IF EXISTS "event_access_delete_paid_block" ON public.event_access;

CREATE POLICY "event_access_delete_paid_block" ON public.event_access FOR DELETE
  USING (
    NOT public.event_is_paid(event_id)
    AND (
      event_id IN (SELECT event_id FROM public.get_user_event_ids())
      OR
      event_id IN (SELECT event_id FROM public.get_org_event_ids())
    )
  );

-- ── 3f. run_sheet_items ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "run_sheet_planner_coordinator" ON run_sheet_items;
DROP POLICY IF EXISTS "run_sheet_planner_coordinator_select" ON run_sheet_items;
DROP POLICY IF EXISTS "run_sheet_planner_coordinator_insert" ON run_sheet_items;
DROP POLICY IF EXISTS "run_sheet_planner_coordinator_update" ON run_sheet_items;
DROP POLICY IF EXISTS "run_sheet_planner_coordinator_delete" ON run_sheet_items;

CREATE POLICY "run_sheet_planner_coordinator_select" ON run_sheet_items FOR SELECT
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "run_sheet_planner_coordinator_insert" ON run_sheet_items FOR INSERT
  WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "run_sheet_planner_coordinator_update" ON run_sheet_items FOR UPDATE
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "run_sheet_planner_coordinator_delete" ON run_sheet_items FOR DELETE
  USING (
    NOT public.event_is_paid(event_id)
    AND event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

-- ── 3g. live_feed_posts ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "live_feed_planner_coordinator" ON live_feed_posts;
DROP POLICY IF EXISTS "live_feed_planner_coordinator_select" ON live_feed_posts;
DROP POLICY IF EXISTS "live_feed_planner_coordinator_insert" ON live_feed_posts;
DROP POLICY IF EXISTS "live_feed_planner_coordinator_update" ON live_feed_posts;
DROP POLICY IF EXISTS "live_feed_planner_coordinator_delete" ON live_feed_posts;

CREATE POLICY "live_feed_planner_coordinator_select" ON live_feed_posts FOR SELECT
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "live_feed_planner_coordinator_insert" ON live_feed_posts FOR INSERT
  WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "live_feed_planner_coordinator_update" ON live_feed_posts FOR UPDATE
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "live_feed_planner_coordinator_delete" ON live_feed_posts FOR DELETE
  USING (
    NOT public.event_is_paid(event_id)
    AND event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
      OR created_by = auth.uid()
    )
  );

-- ── 3h. financial_entries ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "financial_entries_access" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_select" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_insert" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_update" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_delete" ON financial_entries;

CREATE POLICY "financial_entries_select" ON financial_entries FOR SELECT
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "financial_entries_insert" ON financial_entries FOR INSERT
  WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "financial_entries_update" ON financial_entries FOR UPDATE
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "financial_entries_delete" ON financial_entries FOR DELETE
  USING (
    NOT public.event_is_paid(event_id)
    AND event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

-- ── 3i. budget_allocations ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "budget_allocations_access" ON budget_allocations;
DROP POLICY IF EXISTS "budget_allocations_select" ON budget_allocations;
DROP POLICY IF EXISTS "budget_allocations_insert" ON budget_allocations;
DROP POLICY IF EXISTS "budget_allocations_update" ON budget_allocations;
DROP POLICY IF EXISTS "budget_allocations_delete" ON budget_allocations;

CREATE POLICY "budget_allocations_select" ON budget_allocations FOR SELECT
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "budget_allocations_insert" ON budget_allocations FOR INSERT
  WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "budget_allocations_update" ON budget_allocations FOR UPDATE
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "budget_allocations_delete" ON budget_allocations FOR DELETE
  USING (
    NOT public.event_is_paid(event_id)
    AND event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

-- ── 3j. petty_cash ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "petty_cash_access" ON petty_cash;
DROP POLICY IF EXISTS "petty_cash_select" ON petty_cash;
DROP POLICY IF EXISTS "petty_cash_insert" ON petty_cash;
DROP POLICY IF EXISTS "petty_cash_update" ON petty_cash;
DROP POLICY IF EXISTS "petty_cash_delete" ON petty_cash;

CREATE POLICY "petty_cash_select" ON petty_cash FOR SELECT
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "petty_cash_insert" ON petty_cash FOR INSERT
  WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "petty_cash_update" ON petty_cash FOR UPDATE
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "petty_cash_delete" ON petty_cash FOR DELETE
  USING (
    NOT public.event_is_paid(event_id)
    AND event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

-- ── 3k. issues ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "issues_planner_coordinator_full" ON issues;
DROP POLICY IF EXISTS "issues_planner_coordinator_select" ON issues;
DROP POLICY IF EXISTS "issues_planner_coordinator_insert" ON issues;
DROP POLICY IF EXISTS "issues_planner_coordinator_update" ON issues;
DROP POLICY IF EXISTS "issues_planner_coordinator_delete" ON issues;

CREATE POLICY "issues_planner_coordinator_select" ON issues FOR SELECT
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "issues_planner_coordinator_insert" ON issues FOR INSERT
  WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "issues_planner_coordinator_update" ON issues FOR UPDATE
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "issues_planner_coordinator_delete" ON issues FOR DELETE
  USING (
    NOT public.event_is_paid(event_id)
    AND event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
      OR created_by = auth.uid()
    )
  );

-- ── 3l. media ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "media_planner_coordinator_full" ON media;
DROP POLICY IF EXISTS "media_planner_coordinator_select" ON media;
DROP POLICY IF EXISTS "media_planner_coordinator_insert" ON media;
DROP POLICY IF EXISTS "media_planner_coordinator_update" ON media;
DROP POLICY IF EXISTS "media_planner_coordinator_delete" ON media;

CREATE POLICY "media_planner_coordinator_select" ON media FOR SELECT
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "media_planner_coordinator_insert" ON media FOR INSERT
  WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "media_planner_coordinator_update" ON media FOR UPDATE
  USING (
    event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );

CREATE POLICY "media_planner_coordinator_delete" ON media FOR DELETE
  USING (
    NOT public.event_is_paid(event_id)
    AND event_id IN (SELECT id FROM public.events WHERE
      org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
    )
  );
