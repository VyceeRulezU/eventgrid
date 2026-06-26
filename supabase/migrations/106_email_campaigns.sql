-- Migration 106: Email marketing campaigns

CREATE TABLE IF NOT EXISTS email_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject         text NOT NULL,
  body_html       text NOT NULL,
  body_text       text,
  content_mode    text NOT NULL DEFAULT 'manual' CHECK (content_mode IN ('manual', 'template', 'ai')),
  template_id     uuid REFERENCES email_templates(id),
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_for   timestamptz,
  sent_at         timestamptz,
  recipient_count int DEFAULT 0,
  created_by      uuid REFERENCES profiles(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_campaigns_select" ON email_campaigns;
DROP POLICY IF EXISTS "email_campaigns_insert" ON email_campaigns;
DROP POLICY IF EXISTS "email_campaigns_update" ON email_campaigns;
DROP POLICY IF EXISTS "email_campaigns_delete" ON email_campaigns;

CREATE POLICY "email_campaigns_select" ON email_campaigns FOR SELECT USING (public.is_super_admin());
CREATE POLICY "email_campaigns_insert" ON email_campaigns FOR INSERT WITH CHECK (public.is_super_admin());
CREATE POLICY "email_campaigns_update" ON email_campaigns FOR UPDATE USING (public.is_super_admin());
CREATE POLICY "email_campaigns_delete" ON email_campaigns FOR DELETE USING (public.is_super_admin());

GRANT ALL ON public.email_campaigns TO service_role;
GRANT ALL ON public.email_campaigns TO authenticated;
