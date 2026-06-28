-- Migration 116: Increase phase_number range from 1-9 to 1-30
-- The default trigger creates 9 phases; users may add more custom phases.

ALTER TABLE event_phases DROP CONSTRAINT IF EXISTS event_phases_phase_number_check;
ALTER TABLE event_phases ADD CONSTRAINT event_phases_phase_number_check CHECK (phase_number BETWEEN 1 AND 30);
