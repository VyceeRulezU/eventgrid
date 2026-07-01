-- Add column if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vendors'
      AND column_name = 'referred_by_code'
  ) THEN
    ALTER TABLE public.vendors ADD COLUMN referred_by_code text;
  END IF;
END $$;

-- Backfill existing vendors with referral codes from their profiles
UPDATE public.vendors v
SET referred_by_code = p.referred_by_code
FROM public.profiles p
WHERE v.claimed_by_vendor_id = p.id
  AND p.referred_by_code IS NOT NULL
  AND v.referred_by_code IS NULL;
