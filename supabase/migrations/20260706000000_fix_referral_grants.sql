-- Grant full access to all roles for referral tables to prevent "permission denied" errors
GRANT ALL ON public.referral_partners TO service_role;
GRANT ALL ON public.referral_redemptions TO service_role;
GRANT ALL ON public.referral_partners TO anon;
GRANT ALL ON public.referral_redemptions TO anon;
GRANT ALL ON public.referral_partners TO authenticated;
GRANT ALL ON public.referral_redemptions TO authenticated;
