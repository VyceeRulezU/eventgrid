-- Migration 037: Break RLS recursion cycle between events and event_access
-- ================================================================================
-- Root cause of persistent HTTP 500 on events/guests/client_payments:
--
--   events_select_event_access subqueries event_access (inline SQL)
--   → event_access_select_planner subqueries events (inline SQL)
--   → events RLS evaluates events_select_event_access again
--   → infinite recursion → stack overflow → 500
--
-- The events_select_member policy (using has_event_access() SECURITY DEFINER)
-- already covers the same use case safely. Drop events_select_event_access
-- to break the cycle.

DROP POLICY IF EXISTS "events_select_event_access" ON events;
