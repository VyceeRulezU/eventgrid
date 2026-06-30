-- Migration 121: Add performance indexes based on query pattern analysis.
-- See: src/lib/ database query patterns across pages

-- #1: Most queried table — every dashboard loads events by org
CREATE INDEX IF NOT EXISTS idx_events_org_created
  ON events(org_id, created_at DESC);

-- #2: Guest list — loaded on every event page, can be thousands per event
CREATE INDEX IF NOT EXISTS idx_guests_event_created
  ON guests(event_id, created_at DESC);

-- #3: Issues/live board — loaded on every event dashboard
CREATE INDEX IF NOT EXISTS idx_issues_event_raised
  ON issues(event_id, raised_at DESC);

-- #4: Event vendors — loaded on dashboard + vendor pages
CREATE INDEX IF NOT EXISTS idx_event_vendors_event_created
  ON event_vendors(event_id, created_at DESC);

-- #5: Task comments — queried every time a task detail modal opens
CREATE INDEX IF NOT EXISTS idx_task_comments_task_created
  ON task_comments(task_id, created_at ASC);

-- #6: Financial entries — budget/financial pages
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_entries' AND column_name = 'due_date') THEN
    CREATE INDEX IF NOT EXISTS idx_financial_entries_event_due ON financial_entries(event_id, due_date);
  END IF;
END $$;

-- #7: Media/gallery — event asset pages
CREATE INDEX IF NOT EXISTS idx_media_event_created
  ON media(event_id, created_at DESC);

-- #8: Seating charts
CREATE INDEX IF NOT EXISTS idx_seating_tables_event
  ON seating_tables(event_id, table_name);

-- #9: Run sheet items
CREATE INDEX IF NOT EXISTS idx_run_sheet_items_event
  ON run_sheet_items(event_id);

-- #10: Live board items
CREATE INDEX IF NOT EXISTS idx_live_board_items_event
  ON live_board_items(event_id);

-- #11: Events slug lookup — used for URL resolution on every event page
CREATE INDEX IF NOT EXISTS idx_events_slug
  ON events(slug)
  WHERE slug IS NOT NULL;

-- #12: Events by creator — admin user detail pages
CREATE INDEX IF NOT EXISTS idx_events_created_by
  ON events(created_by, created_at DESC);

-- #13: Tasks by event + status + due date — overdue queries
CREATE INDEX IF NOT EXISTS idx_tasks_event_status_due
  ON tasks(event_id, status, due_datetime);

-- #14: Tasks by assignee — My Tasks page
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status
  ON tasks(assignee_id, status, due_datetime);

-- #15: Profiles by org — vendor directory, team pages
CREATE INDEX IF NOT EXISTS idx_profiles_org_id
  ON profiles(org_id);

-- #16: Profiles by role — team queries
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles(role);

-- #17: Vendors directory
CREATE INDEX IF NOT EXISTS idx_vendors_org_name
  ON vendors(org_id, name);

-- #18: Event vendors by vendor_id — delete-user cleanup
CREATE INDEX IF NOT EXISTS idx_event_vendors_vendor
  ON event_vendors(vendor_id);

-- #19: Events by coordinator — delete-user cleanup
CREATE INDEX IF NOT EXISTS idx_events_coordinator
  ON events(coordinator_id);

-- #20: Events by client — delete-user cleanup
CREATE INDEX IF NOT EXISTS idx_events_client
  ON events(client_id);
