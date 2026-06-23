-- Migration 089: Fix push_subscriptions schema - remove legacy columns from migration 030
-- The table was originally created with separate endpoint/p256dh/auth columns (migration 030)
-- and later updated with a jsonb subscription column (migration 088).
-- This migration drops the legacy columns to fix 400 errors on insert.

-- ============================================================
-- 1. Migrate any existing data from legacy columns to subscription jsonb
-- ============================================================
UPDATE push_subscriptions
SET subscription = jsonb_build_object(
  'endpoint', endpoint,
  'keys', jsonb_build_object('p256dh', p256dh, 'auth', auth)
)
WHERE subscription IS NULL AND endpoint IS NOT NULL;

-- ============================================================
-- 2. Drop legacy columns and their unique constraint
-- ============================================================
ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_endpoint_key;
ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_endpoint_key;
ALTER TABLE push_subscriptions DROP COLUMN IF EXISTS endpoint;
ALTER TABLE push_subscriptions DROP COLUMN IF EXISTS p256dh;
ALTER TABLE push_subscriptions DROP COLUMN IF EXISTS auth;

-- ============================================================
-- 3. Make subscription NOT NULL (now that we've migrated data)
-- ============================================================
ALTER TABLE push_subscriptions ALTER COLUMN subscription SET NOT NULL;
