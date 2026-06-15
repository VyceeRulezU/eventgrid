-- Add global app settings to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS show_beta_label boolean NOT NULL DEFAULT true;

-- Allow org owner to update this column
-- (existing RLS policy orgs_update_own already covers this via
--  `owner_id = auth.uid()`, no new policy needed)
