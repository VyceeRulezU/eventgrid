-- Migration 102: Enforce unique email per organization in vendors directory
-- Prevents duplicate vendor entries using the same email within the same org.

-- Drop the old coordinator-specific partial index (now superseded by the general one)
DROP INDEX IF EXISTS idx_vendors_coordinator_unique;

-- Drop the new index if it already exists (from a partial run)
DROP INDEX IF EXISTS idx_vendors_email_unique;

-- Remove existing duplicates before creating the unique index.
-- Keeps the row with the latest updated_at per (org_id, email) pair.
DELETE FROM vendors
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY org_id, LOWER(email)
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
    ) AS rn
    FROM vendors
    WHERE email IS NOT NULL AND deleted_at IS NULL
  ) ranked
  WHERE rn > 1
);

-- General unique index: one email per org for active (non-deleted) vendors
CREATE UNIQUE INDEX idx_vendors_email_unique
  ON vendors (org_id, LOWER(email))
  WHERE deleted_at IS NULL;
