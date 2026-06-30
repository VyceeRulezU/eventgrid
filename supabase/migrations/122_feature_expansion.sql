-- Migration 122: Feature Expansion — Leads, Proposals, Invoices, Chat,
-- Checklists, Notebook, Questionnaires, Guest Messages, Calendar

-- ── 1. LEADS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  event_id        uuid REFERENCES events(id) ON DELETE SET NULL,
  created_by      uuid REFERENCES profiles(id) NOT NULL DEFAULT auth.uid(),
  client_name     text NOT NULL,
  client_email    text,
  client_phone    text,
  source          text DEFAULT 'other' CHECK (source IN ('referral','website','social','walk_in','email','call','other')),
  status          text DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','proposal_sent','negotiating','converted','lost')),
  notes           text,
  budget_range    text,
  event_type      text,
  preferred_date  date,
  guest_count_estimate integer,
  converted_to_event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_org_access" ON public.leads;
CREATE POLICY "leads_org_access"
  ON public.leads FOR ALL
  USING (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "leads_super_admin" ON public.leads;
CREATE POLICY "leads_super_admin"
  ON public.leads FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

GRANT ALL ON public.leads TO authenticated;

-- ── 2. PROPOSALS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.proposals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid REFERENCES events(id) ON DELETE CASCADE,
  lead_id         uuid REFERENCES leads(id) ON DELETE SET NULL,
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES profiles(id) NOT NULL DEFAULT auth.uid(),
  title           text NOT NULL,
  description     text,
  valid_until     date,
  status          text DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','accepted','rejected','expired')),
  sections        jsonb DEFAULT '[]'::jsonb,
  total_amount    bigint DEFAULT 0,
  sent_at         timestamptz,
  viewed_at       timestamptz,
  responded_at    timestamptz,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proposals_org_access" ON public.proposals;
CREATE POLICY "proposals_org_access"
  ON public.proposals FOR ALL
  USING (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "proposals_event_access" ON public.proposals;
CREATE POLICY "proposals_event_access"
  ON public.proposals FOR SELECT
  USING (
    event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid() AND role = 'client')
    OR event_id IN (SELECT id FROM events WHERE coordinator_id = auth.uid())
  );

DROP POLICY IF EXISTS "proposals_super_admin" ON public.proposals;
CREATE POLICY "proposals_super_admin"
  ON public.proposals FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

GRANT ALL ON public.proposals TO authenticated;

-- ── 3. INVOICES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES profiles(id) NOT NULL DEFAULT auth.uid(),
  invoice_number  text NOT NULL,
  client_name     text,
  client_email    text,
  items           jsonb DEFAULT '[]'::jsonb,
  subtotal        bigint DEFAULT 0,
  discount        bigint DEFAULT 0,
  total           bigint DEFAULT 0,
  amount_paid     bigint DEFAULT 0,
  status          text DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  due_date        date,
  issued_date     date DEFAULT CURRENT_DATE,
  paid_at         timestamptz,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_owner_access" ON public.invoices;
CREATE POLICY "invoices_owner_access"
  ON public.invoices FOR ALL
  USING (
    event_id IN (SELECT id FROM events WHERE
      org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
      OR created_by = auth.uid()
    )
  )
  WITH CHECK (
    event_id IN (SELECT id FROM events WHERE
      org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
      OR coordinator_id = auth.uid()
      OR created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "invoices_client_view" ON public.invoices;
CREATE POLICY "invoices_client_view"
  ON public.invoices FOR SELECT
  USING (
    event_id IN (SELECT event_id FROM client_portals WHERE client_email = auth.email() AND is_active = true)
  );

DROP POLICY IF EXISTS "invoices_super_admin" ON public.invoices;
CREATE POLICY "invoices_super_admin"
  ON public.invoices FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_invoices_event ON public.invoices(event_id);
GRANT ALL ON public.invoices TO authenticated;

-- ── 4. EVENT CHAT ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_chat_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id),
  message         text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.event_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_event_access_select" ON public.event_chat_messages;
CREATE POLICY "chat_event_access_select"
  ON public.event_chat_messages FOR SELECT
  USING (
    event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid() AND accepted_at IS NOT NULL)
    OR event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
    OR event_id IN (SELECT id FROM events WHERE org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "chat_event_access_insert" ON public.event_chat_messages;
CREATE POLICY "chat_event_access_insert"
  ON public.event_chat_messages FOR INSERT
  WITH CHECK (
    event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid() AND accepted_at IS NOT NULL)
    OR event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
    OR event_id IN (SELECT id FROM events WHERE org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "chat_super_admin" ON public.event_chat_messages;
CREATE POLICY "chat_super_admin"
  ON public.event_chat_messages FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_chat_event_created ON public.event_chat_messages(event_id, created_at ASC);
GRANT ALL ON public.event_chat_messages TO authenticated;

-- ── 5. CHECKLISTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.checklists (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  phase_id        uuid REFERENCES event_phases(id) ON DELETE SET NULL,
  created_by      uuid REFERENCES profiles(id) NOT NULL DEFAULT auth.uid(),
  title           text NOT NULL,
  description     text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.checklist_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id    uuid NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  text            text NOT NULL,
  is_checked      boolean DEFAULT false,
  checked_by      uuid REFERENCES profiles(id),
  checked_at      timestamptz,
  sort_order      integer DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklists_event_access" ON public.checklists;
CREATE POLICY "checklists_event_access"
  ON public.checklists FOR ALL
  USING (
    event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid() AND accepted_at IS NOT NULL)
    OR event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
    OR event_id IN (SELECT id FROM events WHERE org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  )
  WITH CHECK (
    event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid() AND accepted_at IS NOT NULL)
    OR event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
    OR event_id IN (SELECT id FROM events WHERE org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "checklist_items_event_access" ON public.checklist_items;
CREATE POLICY "checklist_items_event_access"
  ON public.checklist_items FOR ALL
  USING (
    checklist_id IN (SELECT id FROM checklists WHERE
      event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid() AND accepted_at IS NOT NULL)
      OR event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
      OR event_id IN (SELECT id FROM events WHERE org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
    )
  )
  WITH CHECK (
    checklist_id IN (SELECT id FROM checklists WHERE
      event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid() AND accepted_at IS NOT NULL)
      OR event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
      OR event_id IN (SELECT id FROM events WHERE org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "checklists_super_admin" ON public.checklists;
CREATE POLICY "checklists_super_admin"
  ON public.checklists FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

DROP POLICY IF EXISTS "checklist_items_super_admin" ON public.checklist_items;
CREATE POLICY "checklist_items_super_admin"
  ON public.checklist_items FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

GRANT ALL ON public.checklists TO authenticated;
GRANT ALL ON public.checklist_items TO authenticated;

-- ── 6. NOTEBOOK / EVENT NOTES ────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_notes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES profiles(id) NOT NULL DEFAULT auth.uid(),
  title           text NOT NULL,
  content         text DEFAULT '',
  category        text DEFAULT 'general' CHECK (category IN ('general','ideas','todo','notes','important')),
  is_pinned       boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.event_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notes_event_access" ON public.event_notes;
CREATE POLICY "notes_event_access"
  ON public.event_notes FOR ALL
  USING (
    event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid() AND accepted_at IS NOT NULL)
    OR event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
    OR event_id IN (SELECT id FROM events WHERE org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  )
  WITH CHECK (
    event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid() AND accepted_at IS NOT NULL)
    OR event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
    OR event_id IN (SELECT id FROM events WHERE org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "notes_super_admin" ON public.event_notes;
CREATE POLICY "notes_super_admin"
  ON public.event_notes FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

GRANT ALL ON public.event_notes TO authenticated;

-- ── 7. QUESTIONNAIRES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.questionnaires (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid REFERENCES events(id) ON DELETE CASCADE,
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES profiles(id) NOT NULL DEFAULT auth.uid(),
  title           text NOT NULL,
  description     text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.questionnaire_questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  question_text   text NOT NULL,
  question_type   text NOT NULL DEFAULT 'text' CHECK (question_type IN ('text','textarea','select','radio','checkbox','rating')),
  options         jsonb DEFAULT '[]'::jsonb,
  is_required     boolean DEFAULT false,
  sort_order      integer DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.questionnaire_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  event_id        uuid REFERENCES events(id) ON DELETE CASCADE,
  respondent_name text NOT NULL,
  respondent_email text,
  answers         jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at    timestamptz DEFAULT now()
);

ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "questionnaires_org_access" ON public.questionnaires;
CREATE POLICY "questionnaires_org_access"
  ON public.questionnaires FOR ALL
  USING (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "questionnaires_event_select" ON public.questionnaires;
CREATE POLICY "questionnaires_event_select"
  ON public.questionnaires FOR SELECT
  USING (event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid() AND accepted_at IS NOT NULL));

DROP POLICY IF EXISTS "questionnaire_questions_access" ON public.questionnaire_questions;
CREATE POLICY "questionnaire_questions_access"
  ON public.questionnaire_questions FOR ALL
  USING (
    questionnaire_id IN (SELECT id FROM questionnaires WHERE
      org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
      OR event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid() AND accepted_at IS NOT NULL)
    )
  )
  WITH CHECK (
    questionnaire_id IN (SELECT id FROM questionnaires WHERE
      org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "questionnaire_responses_insert" ON public.questionnaire_responses;
CREATE POLICY "questionnaire_responses_insert"
  ON public.questionnaire_responses FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "questionnaire_responses_select" ON public.questionnaire_responses;
CREATE POLICY "questionnaire_responses_select"
  ON public.questionnaire_responses FOR SELECT
  USING (
    questionnaire_id IN (SELECT id FROM questionnaires WHERE
      org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
      OR event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "questionnaires_super_admin" ON public.questionnaires;
CREATE POLICY "questionnaires_super_admin"
  ON public.questionnaires FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

DROP POLICY IF EXISTS "questionnaire_questions_super_admin" ON public.questionnaire_questions;
CREATE POLICY "questionnaire_questions_super_admin"
  ON public.questionnaire_questions FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

DROP POLICY IF EXISTS "questionnaire_responses_super_admin" ON public.questionnaire_responses;
CREATE POLICY "questionnaire_responses_super_admin"
  ON public.questionnaire_responses FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

GRANT ALL ON public.questionnaires TO authenticated;
GRANT ALL ON public.questionnaire_questions TO authenticated;
GRANT ALL ON public.questionnaire_responses TO authenticated;
GRANT INSERT ON public.questionnaire_responses TO anon, authenticated;

-- ── 8. GUEST MESSAGES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.guest_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  subject         text NOT NULL,
  body            text NOT NULL,
  sent_by         uuid REFERENCES profiles(id) NOT NULL DEFAULT auth.uid(),
  recipient_filter text DEFAULT 'all' CHECK (recipient_filter IN ('all','vip','pending_rsvp','confirmed','declined','maybe','checked_in')),
  sent_count      integer DEFAULT 0,
  opened_count    integer DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.guest_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guest_messages_event_access" ON public.guest_messages;
CREATE POLICY "guest_messages_event_access"
  ON public.guest_messages FOR ALL
  USING (
    event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid() AND accepted_at IS NOT NULL)
    OR event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
    OR event_id IN (SELECT id FROM events WHERE org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  )
  WITH CHECK (
    event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid() AND accepted_at IS NOT NULL)
    OR event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
    OR event_id IN (SELECT id FROM events WHERE org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "guest_messages_super_admin" ON public.guest_messages;
CREATE POLICY "guest_messages_super_admin"
  ON public.guest_messages FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_guest_messages_event ON public.guest_messages(event_id, created_at DESC);
GRANT ALL ON public.guest_messages TO authenticated;

-- Add event_chat_messages to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'event_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE event_chat_messages;
  END IF;
END $$;
