-- Migration 097: Live feed post likes + like notifications

-- ============================================================
-- 1. Create live_feed_likes table
-- ============================================================
CREATE TABLE live_feed_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES live_feed_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE live_feed_likes ENABLE ROW LEVEL SECURITY;

-- Members can insert their own likes
CREATE POLICY "live_feed_likes_insert" ON live_feed_likes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND post_id IN (
      SELECT id FROM live_feed_posts
      WHERE event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid())
    )
  );

-- Members can view likes for posts they can see
CREATE POLICY "live_feed_likes_select" ON live_feed_likes FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM live_feed_posts
      WHERE event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid())
    )
  );

-- Users can delete their own likes
CREATE POLICY "live_feed_likes_delete" ON live_feed_likes FOR DELETE
  USING (user_id = auth.uid());

GRANT ALL ON live_feed_likes TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE live_feed_likes;

-- ============================================================
-- 2. Add denormalized likes_count to live_feed_posts
-- ============================================================
ALTER TABLE live_feed_posts ADD COLUMN IF NOT EXISTS likes_count int DEFAULT 0;

-- ============================================================
-- 3. Trigger: keep likes_count in sync
-- ============================================================
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE live_feed_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE live_feed_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_likes_count
  AFTER INSERT OR DELETE ON live_feed_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_likes_count();

-- ============================================================
-- 4. Trigger: notify post author when someone likes their post
-- ============================================================
CREATE OR REPLACE FUNCTION notify_post_liked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_author_id uuid;
  v_liker_name text;
  v_event_id uuid;
BEGIN
  SELECT user_id, event_id INTO v_post_author_id, v_event_id
  FROM live_feed_posts WHERE id = NEW.post_id;

  -- Don't notify if liking own post
  IF v_post_author_id IS NOT NULL AND v_post_author_id != NEW.user_id THEN
    SELECT COALESCE(display_name, email, 'Someone') INTO v_liker_name
    FROM profiles WHERE id = NEW.user_id;

    INSERT INTO notifications (user_id, event_id, type, title, body)
    VALUES (v_post_author_id, v_event_id, 'mention', v_liker_name || ' liked your post', NULL);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_post_liked
  AFTER INSERT ON live_feed_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_liked();
