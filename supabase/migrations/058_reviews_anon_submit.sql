ALTER TABLE public.reviews ALTER COLUMN reviewer_id DROP NOT NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own"
  ON public.reviews FOR INSERT
  WITH CHECK (
    (auth.uid() = reviewer_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('vendor', 'client')))
    OR
    (reviewer_id IS NULL AND reviewer_name IS NOT NULL)
  );
