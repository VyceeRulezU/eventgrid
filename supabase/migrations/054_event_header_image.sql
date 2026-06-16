-- Migration 054: Add header_image_url column to events table
-- Allows planners and coordinators to set a custom header image per event

ALTER TABLE events ADD COLUMN IF NOT EXISTS header_image_url text;
