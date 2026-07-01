-- Migration 142: Client Quote Requests — clients request quotes from
-- planners, coordinators, and vendors.
--
-- Tables:
--   client_quote_requests    — RFQ created by client
--   client_quote_responses   — provider responses

-- ── 1. CLIENT QUOTE REQUESTS ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_quote_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES profiles(id),
  event_id          uuid REFERENCES events(id) ON DELETE SET NULL,
  title             text NOT NULL,
  description       text,
  event_type        text,
  event_date        date,
  guest_count       integer,
  budget_range      text,
  preferred_roles   text[] DEFAULT '{}',
  status            text DEFAULT 'open' CHECK (status IN ('open','negotiating','closed','cancelled')),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE public.client_quote_requests ENABLE ROW LEVEL SECURITY;

-- Client can manage their own requests
DROP POLICY IF EXISTS "cqr_client_manage" ON public.client_quote_requests;
CREATE POLICY "cqr_client_manage"
  ON public.client_quote_requests FOR ALL
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Providers can see open requests (to respond)
DROP POLICY IF EXISTS "cqr_provider_select" ON public.client_quote_requests;
CREATE POLICY "cqr_provider_select"
  ON public.client_quote_requests FOR SELECT
  USING (status = 'open' OR status = 'negotiating');

DROP POLICY IF EXISTS "cqr_super_admin" ON public.client_quote_requests;
CREATE POLICY "cqr_super_admin"
  ON public.client_quote_requests FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

GRANT ALL ON public.client_quote_requests TO authenticated;

-- ── 2. CLIENT QUOTE RESPONSES ────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_quote_responses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id  uuid NOT NULL REFERENCES client_quote_requests(id) ON DELETE CASCADE,
  respondent_id     uuid NOT NULL REFERENCES profiles(id),
  respondent_role   text NOT NULL CHECK (respondent_role IN ('planner','coordinator','vendor')),
  message           text,
  estimated_amount  bigint,
  portfolio_links   text[] DEFAULT '{}',
  status            text DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE public.client_quote_responses ENABLE ROW LEVEL SECURITY;

-- Provider can manage their own response
DROP POLICY IF EXISTS "cqres_respondent_manage" ON public.client_quote_responses;
CREATE POLICY "cqres_respondent_manage"
  ON public.client_quote_responses FOR ALL
  USING (respondent_id = auth.uid())
  WITH CHECK (respondent_id = auth.uid());

-- Client can see responses to their requests
DROP POLICY IF EXISTS "cqres_client_select" ON public.client_quote_responses;
CREATE POLICY "cqres_client_select"
  ON public.client_quote_responses FOR SELECT
  USING (
    quote_request_id IN (
      SELECT id FROM public.client_quote_requests WHERE client_id = auth.uid()
    )
  );

-- Client can accept/reject (update status)
DROP POLICY IF EXISTS "cqres_client_update" ON public.client_quote_responses;
CREATE POLICY "cqres_client_update"
  ON public.client_quote_responses FOR UPDATE
  USING (
    quote_request_id IN (
      SELECT id FROM public.client_quote_requests WHERE client_id = auth.uid()
    )
  )
  WITH CHECK (
    quote_request_id IN (
      SELECT id FROM public.client_quote_requests WHERE client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cqres_super_admin" ON public.client_quote_responses;
CREATE POLICY "cqres_super_admin"
  ON public.client_quote_responses FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

GRANT ALL ON public.client_quote_responses TO authenticated;
