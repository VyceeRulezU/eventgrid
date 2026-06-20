CREATE TABLE IF NOT EXISTS payment_idempotency_keys (
  idempotency_key TEXT PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON payment_idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_reference ON payment_idempotency_keys(reference);
