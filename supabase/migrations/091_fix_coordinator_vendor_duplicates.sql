-- Migration 091: Clean up and prevent duplicate coordinator vendors
-- Root cause: the trigger auto_create_vendor_for_coordinator() could create
-- duplicates under race conditions even with the IF NOT EXISTS guard.
-- Also, no unique constraint existed on (org_id, email) for coordinators.

-- ============================================================
-- 1. Identify duplicates and reassign event_vendors references
-- ============================================================
WITH ranked AS (
  SELECT
    id,
    org_id,
    email,
    ROW_NUMBER() OVER (
      PARTITION BY org_id, LOWER(email)
      ORDER BY created_at ASC
    ) AS rn
  FROM vendors
  WHERE category = 'Coordinator' AND email IS NOT NULL AND deleted_at IS NULL
),
kept AS (
  SELECT id, org_id, email FROM ranked WHERE rn = 1
),
dupes AS (
  SELECT id, org_id, email FROM ranked WHERE rn > 1
)
UPDATE event_vendors ev
SET vendor_id = k.id
FROM dupes d
JOIN kept k ON k.org_id = d.org_id AND LOWER(k.email) = LOWER(d.email)
WHERE ev.vendor_id = d.id;

-- ============================================================
-- 2. Delete duplicate coordinator vendors
-- ============================================================
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY org_id, LOWER(email)
    ORDER BY created_at ASC
  ) AS rn
  FROM vendors
  WHERE category = 'Coordinator' AND email IS NOT NULL AND deleted_at IS NULL
)
DELETE FROM vendors v
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- ============================================================
-- 3. Prevent future duplicates with a unique partial index
-- ============================================================
DROP INDEX IF EXISTS idx_vendors_coordinator_unique;
CREATE UNIQUE INDEX idx_vendors_coordinator_unique
  ON vendors (org_id, LOWER(email))
  WHERE category = 'Coordinator' AND deleted_at IS NULL;
