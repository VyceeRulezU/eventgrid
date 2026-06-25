-- Migration 100: Expand profiles_role_check to include admin sub-roles
-- The existing constraint only allows planner, coordinator, vendor, client, team_member.
-- Super_admin, admin_monitor, and admin_support are set via the
-- accept_admin_invite RPC (migration 099) and must be valid values.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('planner', 'coordinator', 'vendor', 'client', 'team_member', 'super_admin', 'admin_monitor', 'admin_support'));
