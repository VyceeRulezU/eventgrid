-- Migration 143: Add managing_planner_id to events for client-created events
-- where a planner takes over management.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS managing_planner_id uuid REFERENCES profiles(id);
