-- Re-run the referred_by_code backfill for vendors whose profile has
-- a referral code but the vendors row was created before the column existed
-- (or was missed by the original backfill). The WHERE clause ensures we
-- never overwrite an already-populated value.
DO $$
BEGIN
  UPDATE public.vendors v
  SET referred_by_code = p.referred_by_code
  FROM public.profiles p
  WHERE v.claimed_by_vendor_id = p.id
    AND p.referred_by_code IS NOT NULL
    AND v.referred_by_code IS NULL;
END $$;
