-- Migration 088: Web Push Notification subscriptions (multi-device)
-- Handles existing push_subscriptions table from migration 030

-- ============================================================
-- 1. Ensure push_subscriptions table exists with jsonb column
-- Migration 030 created the table with separate endpoint/p256dh/auth columns.
-- We add a jsonb subscription column for the full PushSubscription object.
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription  jsonb NOT NULL,
  user_agent    text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- If the table already existed from migration 030 (with endpoint/p256dh/auth columns),
-- add the subscription jsonb column if missing
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS subscription jsonb;

-- Add updated_at column if missing
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Allow multiple subscriptions per user (different devices) — no UNIQUE(user_id)

-- ============================================================
-- 2. Trigger for updated_at
-- ============================================================
DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- ============================================================
-- 4. Row Level Security
-- ============================================================
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_own" ON push_subscriptions;
DROP POLICY IF EXISTS "push_sub_own" ON push_subscriptions;
CREATE POLICY "push_sub_own" ON push_subscriptions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 5. Profile push notification preferences
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_enabled         boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_tasks           boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_issues          boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_vendors         boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_payments        boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_client_actions  boolean DEFAULT true;

-- ============================================================
-- 6. Grants
-- ============================================================
GRANT ALL ON public.push_subscriptions TO authenticated;

-- ============================================================
-- 7. Promote push notifications table to realtime publication
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE push_subscriptions;
