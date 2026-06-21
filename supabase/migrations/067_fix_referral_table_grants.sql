-- New tables need explicit GRANTs — the blanket GRANT in 007 only covered
-- tables that existed at the time.
GRANT ALL ON public.referral_partners TO authenticated;
GRANT ALL ON public.referral_redemptions TO authenticated;
