ALTER TABLE public.survey_responses
  ADD COLUMN open_to_software BOOLEAN DEFAULT false,
  ADD COLUMN currently_using BOOLEAN DEFAULT false,
  ADD COLUMN current_software_names TEXT,
  ADD COLUMN preferred_billing TEXT,
  ADD COLUMN quarterly_amount TEXT;