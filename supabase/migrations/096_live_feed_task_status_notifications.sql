-- Migration 096: Auto-create notifications for live feed posts and task status changes
-- Team members receive sound + vibration via App.tsx global notification handler

-- ============================================================
-- 1. Trigger: auto-create notification when a live feed post is made
--    Notifies ALL team members (event_access) except the post author
-- ============================================================
CREATE OR REPLACE FUNCTION notify_live_feed_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_name text;
BEGIN
  SELECT COALESCE(display_name, email, 'Someone') INTO v_author_name
  FROM profiles WHERE id = NEW.user_id;

  INSERT INTO notifications (user_id, event_id, type, title, body)
  SELECT
    ea.user_id,
    NEW.event_id,
    'mention',
    v_author_name || ' posted',
    LEFT(NEW.message, 200)
  FROM event_access ea
  WHERE ea.event_id = NEW.event_id
    AND ea.user_id != NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_live_feed_post ON live_feed_posts;
CREATE TRIGGER trg_notify_live_feed_post
  AFTER INSERT ON live_feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_live_feed_post();

-- ============================================================
-- 2. Trigger: auto-create notification when task status changes
--    Notifies event coordinators + assignee when task goes to
--    in_progress, done, or blocked
-- ============================================================
CREATE OR REPLACE FUNCTION notify_task_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('in_progress', 'done', 'blocked') THEN
    -- Notify event coordinators (event_access role = coordinator) + event coordinator + org owner
    INSERT INTO notifications (user_id, event_id, type, title, body)
    SELECT
      u.user_id, u.event_id, u.type, u.title, u.body
    FROM (
      SELECT
        ea.user_id,
        NEW.event_id AS event_id,
        CASE WHEN NEW.status = 'done' THEN 'task_completed' ELSE 'mention' END AS type,
        CASE
          WHEN NEW.status = 'done' THEN 'Task completed: ' || NEW.title
          WHEN NEW.status = 'blocked' THEN 'Task blocked: ' || NEW.title
          WHEN NEW.status = 'in_progress' THEN 'Task started: ' || NEW.title
        END AS title,
        CASE
          WHEN NEW.status = 'done' THEN 'Marked as done'
          WHEN NEW.status = 'blocked' THEN 'A task has been blocked'
          WHEN NEW.status = 'in_progress' THEN 'A task is now in progress'
        END AS body
      FROM event_access ea
      WHERE ea.event_id = NEW.event_id
        AND ea.role IN ('coordinator', 'team_member')
      UNION
      SELECT
        e.coordinator_id,
        NEW.event_id,
        CASE WHEN NEW.status = 'done' THEN 'task_completed' ELSE 'mention' END,
        CASE
          WHEN NEW.status = 'done' THEN 'Task completed: ' || NEW.title
          WHEN NEW.status = 'blocked' THEN 'Task blocked: ' || NEW.title
          WHEN NEW.status = 'in_progress' THEN 'Task started: ' || NEW.title
        END,
        CASE
          WHEN NEW.status = 'done' THEN 'Marked as done'
          WHEN NEW.status = 'blocked' THEN 'A task has been blocked'
          WHEN NEW.status = 'in_progress' THEN 'A task is now in progress'
        END
      FROM events e
      WHERE e.id = NEW.event_id
        AND e.coordinator_id IS NOT NULL
      UNION
      SELECT
        o.owner_id,
        NEW.event_id,
        CASE WHEN NEW.status = 'done' THEN 'task_completed' ELSE 'mention' END,
        CASE
          WHEN NEW.status = 'done' THEN 'Task completed: ' || NEW.title
          WHEN NEW.status = 'blocked' THEN 'Task blocked: ' || NEW.title
          WHEN NEW.status = 'in_progress' THEN 'Task started: ' || NEW.title
        END,
        CASE
          WHEN NEW.status = 'done' THEN 'Marked as done'
          WHEN NEW.status = 'blocked' THEN 'A task has been blocked'
          WHEN NEW.status = 'in_progress' THEN 'A task is now in progress'
        END
      FROM events e
      JOIN organizations o ON o.id = e.org_id
      WHERE e.id = NEW.event_id
        AND o.owner_id IS NOT NULL
    ) u
    WHERE u.user_id IS NOT NULL
      AND u.user_id != NEW.assignee_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_task_status_change ON tasks;
CREATE TRIGGER trg_notify_task_status_change
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_status_change();
