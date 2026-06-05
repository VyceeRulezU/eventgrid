-- Add lessons_learned column to issues table for aftermath review
ALTER TABLE issues ADD COLUMN IF NOT EXISTS lessons_learned text;
