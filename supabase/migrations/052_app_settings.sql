-- Global app settings (single-row table)
CREATE TABLE IF NOT EXISTS app_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- enforce single row
  show_beta_label boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert the default row
INSERT INTO app_settings (id, show_beta_label)
VALUES (1, true)
ON CONFLICT (id) DO NOTHING;

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION update_app_settings_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_settings_updated ON app_settings;
CREATE TRIGGER trg_app_settings_updated
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_app_settings_timestamp();

-- Allow all authenticated users to read; only super_admins via the service or
-- RLS bypass can write.  Since this is a global setting, we use a simple approach:
-- any authenticated user can read, but we rely on application-layer checks for writes.
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY app_settings_select_authenticated
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

-- Update via the API will be done by the application (super_admin only),
-- so we allow insert/update for authenticated (app enforces super_admin check)
CREATE POLICY app_settings_insert_authenticated
  ON app_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY app_settings_update_authenticated
  ON app_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant table-level permissions to authenticated and anon roles
GRANT ALL ON TABLE app_settings TO authenticated, anon;
