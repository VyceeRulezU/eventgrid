-- Migration 141: Vendor Quote Requests — planners/coordinators request quotes
-- from vendors, vendors submit quotes back.
--
-- Tables:
--   vendor_quote_requests      — RFQ created by planner/coordinator per event
--   vendor_quote_invitations   — which vendors are invited to quote
--   vendor_quotes              — submitted quotes from vendors

-- ── 1. VENDOR QUOTE REQUESTS ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendor_quote_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  org_id            uuid REFERENCES organizations(id) ON DELETE CASCADE,
  created_by        uuid NOT NULL REFERENCES profiles(id),
  title             text NOT NULL,
  description       text,
  category          text,
  budget_range_min  bigint,
  budget_range_max  bigint,
  response_deadline timestamptz,
  status            text DEFAULT 'open' CHECK (status IN ('open','closed','cancelled')),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE public.vendor_quote_requests ENABLE ROW LEVEL SECURITY;

-- Org owners + org members (planner/coordinator with event_access) can manage
DROP POLICY IF EXISTS "vqr_org_access" ON public.vendor_quote_requests;
CREATE POLICY "vqr_org_access"
  ON public.vendor_quote_requests FOR ALL
  USING (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- Event-level access for coordinators/team members
DROP POLICY IF EXISTS "vqr_event_access" ON public.vendor_quote_requests;
CREATE POLICY "vqr_event_access"
  ON public.vendor_quote_requests FOR SELECT
  USING (
    event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid())
    OR event_id IN (SELECT id FROM events WHERE coordinator_id = auth.uid())
  );

DROP POLICY IF EXISTS "vqr_super_admin" ON public.vendor_quote_requests;
CREATE POLICY "vqr_super_admin"
  ON public.vendor_quote_requests FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

GRANT ALL ON public.vendor_quote_requests TO authenticated;

-- ── 2. VENDOR QUOTE INVITATIONS ───────────────────────────
CREATE TABLE IF NOT EXISTS public.vendor_quote_invitations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id  uuid NOT NULL REFERENCES vendor_quote_requests(id) ON DELETE CASCADE,
  vendor_id         uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  status            text DEFAULT 'pending' CHECK (status IN ('pending','declined','quoted')),
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.vendor_quote_invitations ENABLE ROW LEVEL SECURITY;

-- Vendors can see invitations sent to them (via claimed profile)
DROP POLICY IF EXISTS "vqi_vendor_access" ON public.vendor_quote_invitations;
CREATE POLICY "vqi_vendor_access"
  ON public.vendor_quote_invitations FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE claimed_by_vendor_id = auth.uid()
    )
  );

-- Org owners can manage invitations
DROP POLICY IF EXISTS "vqi_org_access" ON public.vendor_quote_invitations;
CREATE POLICY "vqi_org_access"
  ON public.vendor_quote_invitations FOR ALL
  USING (
    quote_request_id IN (
      SELECT id FROM public.vendor_quote_requests
      WHERE org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    )
  )
  WITH CHECK (
    quote_request_id IN (
      SELECT id FROM public.vendor_quote_requests
      WHERE org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "vqi_super_admin" ON public.vendor_quote_invitations;
CREATE POLICY "vqi_super_admin"
  ON public.vendor_quote_invitations FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

GRANT ALL ON public.vendor_quote_invitations TO authenticated;

-- ── 3. VENDOR QUOTES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendor_quotes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id  uuid NOT NULL REFERENCES vendor_quote_requests(id) ON DELETE CASCADE,
  vendor_id         uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount            bigint,
  description       text,
  line_items        jsonb DEFAULT '[]'::jsonb,
  notes             text,
  status            text DEFAULT 'submitted' CHECK (status IN ('submitted','accepted','rejected','revised')),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE public.vendor_quotes ENABLE ROW LEVEL SECURITY;

-- Vendors can CRUD their own quotes
DROP POLICY IF EXISTS "vq_vendor_manage" ON public.vendor_quotes;
CREATE POLICY "vq_vendor_manage"
  ON public.vendor_quotes FOR ALL
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE claimed_by_vendor_id = auth.uid()
    )
  )
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE claimed_by_vendor_id = auth.uid()
    )
  );

-- Org owners can view/manage quotes for their RFQs
DROP POLICY IF EXISTS "vq_org_access" ON public.vendor_quotes;
CREATE POLICY "vq_org_access"
  ON public.vendor_quotes FOR SELECT
  USING (
    quote_request_id IN (
      SELECT id FROM public.vendor_quote_requests
      WHERE org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    )
  );

-- Event-level access for reading quotes
DROP POLICY IF EXISTS "vq_event_access" ON public.vendor_quotes;
CREATE POLICY "vq_event_access"
  ON public.vendor_quotes FOR SELECT
  USING (
    quote_request_id IN (
      SELECT id FROM public.vendor_quote_requests
      WHERE event_id IN (
        SELECT event_id FROM event_access WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "vq_super_admin" ON public.vendor_quotes;
CREATE POLICY "vq_super_admin"
  ON public.vendor_quotes FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

GRANT ALL ON public.vendor_quotes TO authenticated;
