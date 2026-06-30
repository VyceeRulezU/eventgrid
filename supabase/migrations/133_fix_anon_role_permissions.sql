-- Migration 133: Fix anon role permissions
-- The blanket GRANT ALL TO anon from migration 007 gives the anonymous
-- role table-level access to every table. Combined with permissive
-- RLS policies, this allows unauthenticated data access.

-- Revoke blanket grants (safe - RLS policies control actual access)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Re-grant only what anon needs explicitly:
-- Survey responses (public submission forms)
GRANT INSERT ON public.survey_responses TO anon;
-- Questionnaire responses (public forms)
GRANT INSERT ON public.questionnaire_responses TO anon;
-- Testimonials (public viewing)
GRANT SELECT ON public.testimonials TO anon;
-- Referral portals (public token lookup)
GRANT SELECT ON public.referral_portals TO anon;
