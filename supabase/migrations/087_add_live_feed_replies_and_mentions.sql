-- Migration 087: Add parent_id to live_feed_posts for threaded replies
-- and ensure realtime publication includes the new column

ALTER TABLE live_feed_posts ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES live_feed_posts(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_live_feed_posts_parent ON live_feed_posts(parent_id);
