-- Migration 105: Email marketing templates

CREATE TABLE IF NOT EXISTS email_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  subject     text NOT NULL,
  body_html   text NOT NULL,
  category    text NOT NULL DEFAULT 'general',
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_templates_select" ON email_templates FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "email_templates_insert" ON email_templates FOR INSERT
  WITH CHECK (public.is_super_admin());

CREATE POLICY "email_templates_update" ON email_templates FOR UPDATE
  USING (public.is_super_admin());

CREATE POLICY "email_templates_delete" ON email_templates FOR DELETE
  USING (public.is_super_admin());

GRANT ALL ON public.email_templates TO service_role;
GRANT ALL ON public.email_templates TO authenticated;
