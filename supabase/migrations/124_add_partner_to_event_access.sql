-- Migration 124: Add 'partner' to event_access role check constraint
-- ============================================================
-- The Partner role is used for financial-view-only collaborators
-- but was missing from the event_access CHECK constraint,
-- causing "new row violates check constraint" errors.

ALTER TABLE public.event_access DROP CONSTRAINT IF EXISTS event_access_role_check;

ALTER TABLE public.event_access ADD CONSTRAINT event_access_role_check
  CHECK (role IN ('coordinator', 'team_member', 'vendor', 'client', 'partner'));
