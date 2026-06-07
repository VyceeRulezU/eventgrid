-- Migration 020: Fix planner org assignment and duplicate coordinator vendors
-- =========================================================================

-- 1. Restore the org_id of existing planners who completed onboarding multiple times
-- This maps them back to their original organization and restores their original events.
WITH planner_orgs AS (
  SELECT owner_id, id AS oldest_org_id,
         ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at ASC) as rn
  FROM organizations
)
UPDATE profiles p
SET org_id = po.oldest_org_id
FROM planner_orgs po
WHERE p.id = po.owner_id
  AND p.role = 'planner'
  AND po.rn = 1
  AND (p.org_id IS NULL OR p.org_id != po.oldest_org_id);

-- 2. Clean up duplicate coordinator vendors in the same organization
-- Keep only the oldest coordinator vendor record per (org_id, email)
DELETE FROM vendors v
WHERE category = 'Coordinator'
  AND id NOT IN (
    SELECT DISTINCT ON (org_id, LOWER(email)) id
    FROM vendors
    WHERE category = 'Coordinator' AND email IS NOT NULL AND deleted_at IS NULL
    ORDER BY org_id, LOWER(email), created_at ASC
  );

-- 3. Update the trigger function to prevent future duplicates by checking IF NOT EXISTS
CREATE OR REPLACE FUNCTION auto_create_vendor_for_coordinator()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when org_id is being set for a coordinator
  IF NEW.org_id IS NOT NULL
     AND (OLD.org_id IS DISTINCT FROM NEW.org_id OR OLD.org_id IS NULL)
     AND NEW.role = 'coordinator' THEN

    -- Only insert if the coordinator is not already in the vendor directory for this org
    IF NOT EXISTS (
      SELECT 1 FROM vendors
      WHERE org_id = NEW.org_id
        AND LOWER(email) = LOWER(NEW.email)
        AND deleted_at IS NULL
    ) THEN
      INSERT INTO vendors (org_id, name, category, contact_name, email, phone, is_verified)
      VALUES (
        NEW.org_id,
        COALESCE(NULLIF(TRIM(NEW.display_name), ''), NEW.email),
        'Coordinator',
        NULLIF(TRIM(NEW.display_name), ''),
        NEW.email,
        NEW.phone,
        true
      );
    END IF;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
