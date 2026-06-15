ALTER TABLE events ADD COLUMN IF NOT EXISTS amount_paid bigint;
ALTER TABLE events ADD COLUMN IF NOT EXISTS paid_at timestamptz;
