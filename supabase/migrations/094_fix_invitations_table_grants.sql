-- Migration 094: Fix missing table-level grants on invitations
-- The authenticated role doesn't have SELECT/INSERT/UPDATE/DELETE on the
-- invitations table. Without table-level SELECT, RLS policies are never
-- evaluated and PostgREST returns 403 for all queries.
-- This was likely dropped accidentally by a migration that recreated policies
-- but didn't re-grant table permissions.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE invitations TO authenticated;
GRANT SELECT ON TABLE invitations TO anon;
