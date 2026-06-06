-- Income / Client Payment Tracker
CREATE TABLE IF NOT EXISTS client_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  description     text NOT NULL,
  amount          bigint NOT NULL,
  payment_type    text DEFAULT 'incoming' CHECK (payment_type IN ('incoming', 'refund')),
  status          text DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'overdue')),
  due_date        date,
  received_date   date,
  payment_method  text,
  reference       text,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE client_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_payments_planner_only" ON client_payments;
CREATE POLICY "client_payments_planner_only"
  ON client_payments FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE org_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_client_payments_event ON client_payments(event_id);
