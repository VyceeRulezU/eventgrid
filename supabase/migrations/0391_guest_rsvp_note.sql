-- Add rsvp_note column for guest messages on RSVP
ALTER TABLE guests ADD COLUMN IF NOT EXISTS rsvp_note text;
