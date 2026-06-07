-- Migration 018: Fix vendor RLS for coordinators + auto-vendor trigger
-- ============================================================
-- Safe to re-run: all CREATE POLICY statements are guarded with DROP IF EXISTS

-- 1. Fix vendors SELECT: coordinators in the same org can read vendors
-- ============================================================
DROP POLICY IF EXISTS "vendors_select_own_org" ON vendors;
DROP POLICY IF EXISTS "vendors_select_org_members" ON vendors;

CREATE POLICY "vendors_select_org_members" ON vendors FOR SELECT
  USING (
    deleted_at IS NULL AND (
      -- Planners (org owners) can see their org's vendors
      org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
      OR
      -- Coordinators who are org members (profiles.org_id is set)
      org_id IN (
        SELECT org_id FROM profiles
        WHERE id = auth.uid()
          AND org_id IS NOT NULL
          AND role = 'coordinator'
      )
      OR
      -- Coordinators assigned to any event in this org (even without org membership)
      -- This covers coordinators who are event-assigned but not yet full org members
      org_id IN (
        SELECT org_id FROM events
        WHERE coordinator_id = auth.uid()
          AND deleted_at IS NULL
      )
    )
  );

-- Also allow coordinators to INSERT vendors into their org
DROP POLICY IF EXISTS "vendors_insert_own_org" ON vendors;
DROP POLICY IF EXISTS "vendors_insert_org_members" ON vendors;

CREATE POLICY "vendors_insert_org_members" ON vendors FOR INSERT
  WITH CHECK (
    org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid()
        AND org_id IS NOT NULL
        AND role IN ('coordinator', 'planner')
    )
  );

-- Allow coordinators to update vendors in their org
DROP POLICY IF EXISTS "vendors_update_own_org" ON vendors;
DROP POLICY IF EXISTS "vendors_update_org_members" ON vendors;

CREATE POLICY "vendors_update_org_members" ON vendors FOR UPDATE
  USING (
    org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid()
        AND org_id IS NOT NULL
        AND role = 'coordinator'
    )
  );

-- ============================================================
-- 2. Auto-create vendor record when a coordinator joins an org
--    (trigger fires when profiles.org_id is set/updated)
-- ============================================================
CREATE OR REPLACE FUNCTION auto_create_vendor_for_coordinator()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when org_id is being set for a coordinator
  IF NEW.org_id IS NOT NULL
     AND (OLD.org_id IS DISTINCT FROM NEW.org_id OR OLD.org_id IS NULL)
     AND NEW.role = 'coordinator' THEN

    INSERT INTO vendors (org_id, name, category, contact_name, email, phone, is_verified)
    VALUES (
      NEW.org_id,
      COALESCE(NULLIF(TRIM(NEW.display_name), ''), NEW.email),
      'Coordinator',
      NULLIF(TRIM(NEW.display_name), ''),
      NEW.email,
      NEW.phone,
      true
    )
    ON CONFLICT DO NOTHING;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_coordinator_org_join ON profiles;
CREATE TRIGGER on_coordinator_org_join
  AFTER UPDATE OF org_id ON profiles
  FOR EACH ROW EXECUTE FUNCTION auto_create_vendor_for_coordinator();

-- ============================================================
-- 3. Backfill: add existing coordinators who already have an org
--    but are not yet in the vendor directory
-- ============================================================
INSERT INTO vendors (org_id, name, category, contact_name, email, phone, is_verified)
SELECT
  p.org_id,
  COALESCE(NULLIF(TRIM(p.display_name), ''), p.email),
  'Coordinator',
  NULLIF(TRIM(p.display_name), ''),
  p.email,
  p.phone,
  true
FROM profiles p
WHERE p.org_id IS NOT NULL
  AND p.role = 'coordinator'
  AND p.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.org_id = p.org_id
      AND LOWER(v.email) = LOWER(p.email)
      AND v.deleted_at IS NULL
  );
