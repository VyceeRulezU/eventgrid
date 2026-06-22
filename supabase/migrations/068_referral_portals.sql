CREATE TABLE IF NOT EXISTS public.referral_portals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.referral_partners(id) ON DELETE CASCADE,
  token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

-- only one active portal per partner
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_portals_active_partner
  ON public.referral_portals (partner_id) WHERE is_active = true;

ALTER TABLE public.referral_portals ENABLE ROW LEVEL SECURITY;

-- super admins can do everything
DROP POLICY IF EXISTS referral_portals_admin_all ON public.referral_portals;
CREATE POLICY referral_portals_admin_all ON public.referral_portals
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- anyone can read an active portal by token (no auth)
DROP POLICY IF EXISTS referral_portals_public_read ON public.referral_portals;
CREATE POLICY referral_portals_public_read ON public.referral_portals
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

GRANT ALL ON public.referral_portals TO anon;
GRANT ALL ON public.referral_portals TO authenticated;
