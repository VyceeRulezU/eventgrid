-- =============================================================================
-- NaliGrid — Seed BETA-NALIGRID Promo Code
-- =============================================================================

INSERT INTO public.promo_codes (code, description, discount_type, discount_value, applies_to, max_redemptions, expires_at, is_active)
VALUES (
  'BETA-NALIGRID',
  'Free event activation — exclusive early-access code for survey respondents',
  'free',
  0,
  'event_activation',
  NULL,
  '2026-12-31 23:59:59+00',
  true
)
ON CONFLICT (code) DO NOTHING;
