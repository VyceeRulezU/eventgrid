-- Migration 072: Fix profiles.role check constraint to support team_member on remote DB
-- ===================================================================================

-- Dynamically find and drop any check constraints on profiles.role (handles varying names)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.profiles'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%role%'
    LOOP
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END;
$$;

-- Add the corrected check constraint allowing 'team_member'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('planner', 'coordinator', 'vendor', 'client', 'team_member'));
