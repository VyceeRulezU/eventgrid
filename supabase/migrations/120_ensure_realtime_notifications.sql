-- Migration 120: Ensure notifications table is in the Realtime publication.
-- This is idempotent — safe to run even if already added by migration 029.

-- Realtime must be enabled at the project level (Supabase Dashboard > Settings > Realtime).
-- This migration handles the table-level subscription.

DO $$
BEGIN
  -- Only attempt if the publication exists (Realtime is enabled at project level)
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add notifications table if not already in the publication
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
  END IF;
END $$;
