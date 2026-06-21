-- Referral partners (influencers/affiliates)
CREATE TABLE IF NOT EXISTS public.referral_partners (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  code             text NOT NULL UNIQUE,
  commission_type  text DEFAULT 'per_activation'
                   CHECK (commission_type IN ('per_activation', 'percentage')),
  commission_amount bigint NOT NULL DEFAULT 0,  -- kobo
  is_active        boolean DEFAULT true,
  notes            text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.referral_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_partners_select_authenticated"
  ON public.referral_partners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "referral_partners_all_super_admin"
  ON public.referral_partners FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Referral redemptions (earned commissions)
CREATE TABLE IF NOT EXISTS public.referral_redemptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id        uuid NOT NULL REFERENCES public.referral_partners(id),
  referred_user_id  uuid NOT NULL REFERENCES public.profiles(id),
  event_id          uuid REFERENCES public.events(id),
  commission_amount bigint NOT NULL DEFAULT 0,  -- kobo
  status            text DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid', 'cancelled')),
  activated_at      timestamptz,
  paid_at           timestamptz,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.referral_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_redemptions_select_partner"
  ON public.referral_redemptions FOR SELECT
  TO authenticated
  USING (
    partner_id IN (SELECT id FROM public.referral_partners)
    OR public.is_super_admin()
  );

CREATE POLICY "referral_redemptions_insert_trigger"
  ON public.referral_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "referral_redemptions_update_super_admin"
  ON public.referral_redemptions FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Add referral tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by_code text;

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_code
  ON public.profiles(referred_by_code);

CREATE INDEX IF NOT EXISTS idx_referral_redemptions_partner
  ON public.referral_redemptions(partner_id);

CREATE INDEX IF NOT EXISTS idx_referral_redemptions_status
  ON public.referral_redemptions(status);

-- Insert Qmaravie partner record
INSERT INTO public.referral_partners (name, code, commission_amount, notes)
VALUES ('Qmaravie', 'QMARAVIE', 500000, '₦5,000 per referred signup who activates an event')
ON CONFLICT (code) DO NOTHING;

-- Update handle_new_user trigger to capture referred_by_code from auth metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_is_super_admin boolean;
  v_referred_by_code text;
BEGIN
  v_role := TRIM(NEW.raw_user_meta_data->>'role');
  v_is_super_admin := (NEW.raw_user_meta_data->>'is_super_admin') = 'true';
  v_referred_by_code := NULLIF(TRIM(NEW.raw_user_meta_data->>'referred_by_code'), '');

  IF v_role IS NULL OR v_role NOT IN ('planner', 'coordinator', 'vendor', 'client', 'team_member') THEN
    v_role := 'planner';
  END IF;

  INSERT INTO public.profiles (id, email, display_name, role, phone, is_super_admin, referred_by_code)
  VALUES (
    NEW.id,
    NEW.email,
    TRIM(NEW.raw_user_meta_data->>'display_name'),
    v_role,
    TRIM(NEW.raw_user_meta_data->>'phone'),
    v_is_super_admin,
    v_referred_by_code
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
