-- Migration 089: Fix push_subscriptions schema - remove legacy columns from migration 030
-- The table was originally created with separate endpoint/p256dh/auth columns (migration 030)
-- and later updated with a jsonb subscription column (migration 088).
-- This migration drops the legacy columns to fix 400 errors on insert.

-- ============================================================
-- 1. Drop legacy unique constraints if they exist
-- ============================================================
ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_endpoint_key;
ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_endpoint_key;

-- ============================================================
-- 2. Drop legacy columns if they exist
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'endpoint') THEN
    ALTER TABLE push_subscriptions DROP COLUMN endpoint;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'p256dh') THEN
    ALTER TABLE push_subscriptions DROP COLUMN p256dh;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'auth') THEN
    ALTER TABLE push_subscriptions DROP COLUMN auth;
  END IF;
END $$;

-- ============================================================
-- 3. Make subscription NOT NULL (safe because 088 added it with IF NOT EXISTS)
-- ============================================================
ALTER TABLE push_subscriptions ALTER COLUMN subscription SET NOT NULL;
