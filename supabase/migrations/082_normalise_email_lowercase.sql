-- Migration 082: Normalise all emails to lowercase in profiles table
-- Prevents duplicate accounts caused by email case differences (e.g. Chinnydominic vs chinnydominic)

-- Step 1: Normalise emails in profiles to lowercase
UPDATE public.profiles
SET email = LOWER(email)
WHERE email != LOWER(email);

-- Step 2: Normalise invitation emails to lowercase, but first remove duplicates
-- that would violate the unique constraint on (event_id, email)
-- Keep only the row with the lowercase email (or the one with accepted status if both exist)
DELETE FROM public.invitations AS inv
USING public.invitations AS inv2
WHERE inv.id != inv2.id
  AND inv.event_id = inv2.event_id
  AND LOWER(inv.email) = LOWER(inv2.email)
  -- Delete the uppercase one (keep the lowercase one or the one with non-pending status)
  AND inv.email != LOWER(inv.email)
  AND inv2.email = LOWER(inv2.email);

-- Now it's safe to normalise remaining rows
UPDATE public.invitations
SET email = LOWER(email)
WHERE email != LOWER(email);

-- Step 3: Add a check constraint on profiles.email to enforce lowercase going forward
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_email_lowercase;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_lowercase
  CHECK (email = LOWER(email));
