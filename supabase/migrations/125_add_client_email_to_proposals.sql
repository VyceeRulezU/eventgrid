-- Migration 125: Add client_email column to proposals table
-- ============================================================
-- The client_email field was used in the TypeScript type and UI
-- but was missing from the table schema.

ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS client_email text;
