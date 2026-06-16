CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('vendor', 'client')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_reviews_unique_per_event ON public.reviews (reviewer_id, event_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_insert_own"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('vendor', 'client'))
    )
  );

CREATE POLICY "reviews_select_reviewed"
  ON public.reviews FOR SELECT
  USING (
    auth.uid() = reviewed_id
    OR auth.uid() = reviewer_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

GRANT INSERT ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO authenticated;
