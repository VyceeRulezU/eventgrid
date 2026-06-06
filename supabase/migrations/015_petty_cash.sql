-- Petty Cash Log
CREATE TABLE IF NOT EXISTS petty_cash (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount      bigint NOT NULL,
  logged_by   uuid REFERENCES profiles(id),
  receipt_url text,
  logged_at   timestamptz DEFAULT now()
);

ALTER TABLE petty_cash ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "petty_cash_planner_only" ON petty_cash;
CREATE POLICY "petty_cash_planner_only"
  ON petty_cash FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE org_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_petty_cash_event ON petty_cash(event_id);
