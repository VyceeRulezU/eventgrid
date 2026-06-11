-- Add free_tier_used column to profiles
-- Tracks whether the user has used their one free event activation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_tier_used boolean NOT NULL DEFAULT false;
