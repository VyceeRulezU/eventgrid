-- =============================================================================
-- EventGrid — Promo Codes System
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text NOT NULL UNIQUE,
  description       text,
  discount_type     text NOT NULL CHECK (discount_type IN ('percentage','fixed','free')),
  discount_value    integer DEFAULT 0,
  -- percentage: 0-100. fixed: amount in kobo. free: value ignored, final amount = 0.
  applies_to        text NOT NULL DEFAULT 'event_activation'
                     CHECK (applies_to IN ('event_activation','coordinator_project')),
  max_redemptions   integer,
  redemption_count  integer DEFAULT 0,
  expires_at        timestamptz,
  is_active         boolean DEFAULT true,
  created_by        uuid REFERENCES public.profiles(id),
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id   uuid NOT NULL REFERENCES public.promo_codes(id),
  user_id         uuid NOT NULL REFERENCES public.profiles(id),
  event_id        uuid REFERENCES public.events(id),
  reference       text,
  final_amount    bigint DEFAULT 0,
  redeemed_at     timestamptz DEFAULT now(),
  UNIQUE(promo_code_id, event_id)
);

-- RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promo_codes_admin_only" ON public.promo_codes FOR ALL
  USING ((SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true);

CREATE POLICY "promo_redemptions_admin_read" ON public.promo_redemptions FOR SELECT
  USING ((SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true);

CREATE POLICY "promo_redemptions_own" ON public.promo_redemptions FOR SELECT
  USING (user_id = auth.uid());

-- =============================================================================
-- validate_promo_code: server-side validation, return final_amount
-- =============================================================================
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  p_code text,
  p_context text,
  p_base_amount bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promo public.promo_codes;
  v_final_amount bigint;
BEGIN
  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE code = upper(trim(p_code))
    AND applies_to = p_context
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_redemptions IS NULL OR redemption_count < max_redemptions);

  IF v_promo IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Invalid or expired promo code');
  END IF;

  IF v_promo.discount_type = 'free' THEN
    v_final_amount := 0;
  ELSIF v_promo.discount_type = 'percentage' THEN
    v_final_amount := p_base_amount - (p_base_amount * v_promo.discount_value / 100);
  ELSE -- fixed
    v_final_amount := GREATEST(p_base_amount - v_promo.discount_value, 0);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'promo_code_id', v_promo.id,
    'code', v_promo.code,
    'discount_type', v_promo.discount_type,
    'final_amount', v_final_amount,
    'message', CASE
      WHEN v_final_amount = 0 THEN 'Free activation applied!'
      ELSE 'Discount applied'
    END
  );
END;
$$;

-- =============================================================================
-- increment_promo_redemption: atomically bump redemption count
-- =============================================================================
CREATE OR REPLACE FUNCTION public.increment_promo_redemption(p_promo_code_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.promo_codes
  SET redemption_count = redemption_count + 1
  WHERE id = p_promo_code_id;
$$;

-- =============================================================================
-- get_promo_expected_amount: returns the expected final amount for a promo code
-- Used by Edge Functions to validate payment amount server-side.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_promo_expected_amount(
  p_promo_code_id uuid,
  p_base_amount bigint
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promo public.promo_codes;
BEGIN
  SELECT * INTO v_promo FROM public.promo_codes WHERE id = p_promo_code_id;
  IF v_promo IS NULL THEN
    RETURN p_base_amount;
  END IF;

  IF v_promo.discount_type = 'free' THEN
    RETURN 0;
  ELSIF v_promo.discount_type = 'percentage' THEN
    RETURN GREATEST(p_base_amount - (p_base_amount * v_promo.discount_value / 100), 0);
  ELSE -- fixed
    RETURN GREATEST(p_base_amount - v_promo.discount_value, 0);
  END IF;
END;
$$;
