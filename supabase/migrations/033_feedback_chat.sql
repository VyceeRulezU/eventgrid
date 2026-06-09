-- Migration 033: Feedback threaded chat + last_message_at

-- ============================================================
-- 1. Add last_message_at column for conversation sorting
-- ============================================================
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS last_message_at timestamptz DEFAULT now();
UPDATE feedback SET last_message_at = COALESCE(replied_at, created_at) WHERE last_message_at IS NULL;

-- ============================================================
-- 2. Create feedback_messages table
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id     uuid NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role     text NOT NULL DEFAULT 'user',
  message         text NOT NULL,
  attachment_url  text,
  attachment_name text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE feedback_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLS policies
-- ============================================================
-- Users can see messages for their own feedback
CREATE POLICY "fm_select_own" ON feedback_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM feedback WHERE id = feedback_id AND user_id = auth.uid())
  );

-- Super admins can see all messages
CREATE POLICY "fm_select_admin" ON feedback_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

-- Users can insert messages for their own feedback
CREATE POLICY "fm_insert_own" ON feedback_messages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM feedback WHERE id = feedback_id AND user_id = auth.uid())
  );

-- Super admins can insert messages for any feedback
CREATE POLICY "fm_insert_admin" ON feedback_messages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

-- ============================================================
-- 4. Trigger: update feedback.last_message_at on new message
-- ============================================================
CREATE OR REPLACE FUNCTION update_feedback_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE feedback SET last_message_at = NEW.created_at WHERE id = NEW.feedback_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_feedback_last_message_at ON feedback_messages;
CREATE TRIGGER trg_feedback_last_message_at
  AFTER INSERT ON feedback_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_last_message_at();

-- ============================================================
-- 5. Backfill: convert existing admin_reply into messages
-- ============================================================
INSERT INTO feedback_messages (feedback_id, sender_id, sender_role, message, created_at)
SELECT f.id, f.replied_by, 'super_admin', f.admin_reply, f.replied_at
FROM feedback f
WHERE f.admin_reply IS NOT NULL
  AND f.replied_by IS NOT NULL;

-- ============================================================
-- 6. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_feedback_messages_feedback_id ON feedback_messages(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_messages_created_at ON feedback_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_last_message ON feedback(last_message_at DESC);

-- ============================================================
-- 7. Add to realtime publication
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE feedback_messages;

-- ============================================================
-- 8. Grants
-- ============================================================
GRANT ALL ON feedback_messages TO authenticated;
GRANT ALL ON feedback_messages TO anon;
GRANT ALL ON feedback_messages TO service_role;
