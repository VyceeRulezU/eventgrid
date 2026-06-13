CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_name TEXT,
  respondent_email TEXT,
  respondent_role TEXT,
  pay_per_event TEXT,
  prefers_monthly BOOLEAN DEFAULT false,
  monthly_amount TEXT,
  prefers_yearly BOOLEAN DEFAULT false,
  yearly_amount TEXT,
  important_features TEXT[] DEFAULT '{}',
  wanted_features TEXT,
  additional_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "survey_responses_insert"
  ON public.survey_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "survey_responses_select_admin"
  ON public.survey_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

GRANT INSERT ON public.survey_responses TO anon;
GRANT INSERT ON public.survey_responses TO authenticated;
GRANT SELECT ON public.survey_responses TO authenticated;
