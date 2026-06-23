-- Aftermath & Reports schema additions

-- Add lessons_learned column to issues table for aftermath review
ALTER TABLE issues ADD COLUMN IF NOT EXISTS lessons_learned text;

-- Add client_share boolean to media table (indexed for portal queries)
ALTER TABLE media ADD COLUMN IF NOT EXISTS client_share boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_media_client_share ON media (client_share) WHERE client_share = true;
