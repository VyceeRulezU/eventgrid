-- Grant full access to all roles for referral_portals table to prevent "permission denied" errors
GRANT ALL ON public.referral_portals TO service_role;
GRANT ALL ON public.referral_portals TO anon;
GRANT ALL ON public.referral_portals TO authenticated;
