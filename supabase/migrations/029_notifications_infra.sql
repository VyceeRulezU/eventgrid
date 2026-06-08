-- Migration 029: Notifications infrastructure - realtime, indexes, auto-creation triggers

-- ============================================================
-- 1. Add notifications to realtime publication
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================
-- 2. Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = false;

-- ============================================================
-- 3. Trigger: auto-create notification when a task is assigned
--    Fires on INSERT or when assignee_id changes on UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.assignee_id IS DISTINCT FROM NEW.assignee_id) THEN
    IF NEW.assignee_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, event_id, type, title, body)
      VALUES (
        NEW.assignee_id,
        NEW.event_id,
        'task_assigned',
        NEW.title,
        'A new task has been assigned to you'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_task_assigned
  AFTER INSERT OR UPDATE OF assignee_id ON tasks
  FOR EACH ROW EXECUTE FUNCTION notify_task_assigned();

-- ============================================================
-- 4. Trigger: auto-create notification when an issue is raised
--    Notifies the event coordinator and org owner
-- ============================================================
CREATE OR REPLACE FUNCTION notify_issue_raised()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, event_id, type, title, body)
  SELECT e.coordinator_id, NEW.event_id, 'issue_raised', NEW.title, LEFT(NEW.description, 200)
  FROM events e WHERE e.id = NEW.event_id AND e.coordinator_id IS NOT NULL
  UNION
  SELECT o.owner_id, NEW.event_id, 'issue_raised', NEW.title, LEFT(NEW.description, 200)
  FROM events e JOIN organizations o ON o.id = e.org_id
  WHERE e.id = NEW.event_id AND o.owner_id IS NOT NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_issue_raised
  AFTER INSERT ON issues
  FOR EACH ROW EXECUTE FUNCTION notify_issue_raised();

-- ============================================================
-- 5. Trigger: auto-create notification when an issue is resolved
--    Notifies the person who raised the issue
-- ============================================================
CREATE OR REPLACE FUNCTION notify_issue_resolved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.resolved_at IS NOT NULL AND OLD.resolved_at IS NULL THEN
    INSERT INTO notifications (user_id, event_id, type, title, body)
    VALUES (
      NEW.raised_by,
      NEW.event_id,
      'issue_resolved',
      'Issue resolved: ' || NEW.title,
      NEW.resolution
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_issue_resolved
  AFTER UPDATE OF resolved_at ON issues
  FOR EACH ROW EXECUTE FUNCTION notify_issue_resolved();
