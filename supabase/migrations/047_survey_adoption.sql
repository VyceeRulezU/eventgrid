ALTER TABLE public.survey_responses ADD COLUMN IF NOT EXISTS open_to_software BOOLEAN DEFAULT false;
ALTER TABLE public.survey_responses ADD COLUMN IF NOT EXISTS currently_using BOOLEAN DEFAULT false;
ALTER TABLE public.survey_responses ADD COLUMN IF NOT EXISTS current_software_names TEXT;
ALTER TABLE public.survey_responses ADD COLUMN IF NOT EXISTS preferred_billing TEXT;
ALTER TABLE public.survey_responses ADD COLUMN IF NOT EXISTS quarterly_amount TEXT;
