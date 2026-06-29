-- Migration 126: Add Proposal Delivery email template

ALTER TABLE public.email_templates ADD CONSTRAINT email_templates_name_key UNIQUE (name);

INSERT INTO public.email_templates (name, subject, body_html)
VALUES (
  'Proposal Delivery',
  '{{subject_content}}',
  '{{body_html_content}}'
)
ON CONFLICT (name) DO UPDATE
  SET subject = EXCLUDED.subject,
      body_html = EXCLUDED.body_html,
      updated_at = now();
