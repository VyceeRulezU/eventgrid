-- Event Assets table for moodboards, documents, and planning files
CREATE TABLE public.event_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  asset_type TEXT NOT NULL DEFAULT 'image' CHECK (asset_type IN ('moodboard', 'image', 'document', 'other')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_assets ENABLE ROW LEVEL SECURITY;

-- SELECT: users with event access
CREATE POLICY "event_assets_select"
  ON public.event_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_access
      WHERE event_access.event_id = event_assets.event_id
      AND event_access.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_assets.event_id
      AND events.org_id IN (
        SELECT org_id FROM public.profiles WHERE id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- INSERT: users with event access
CREATE POLICY "event_assets_insert"
  ON public.event_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_access
      WHERE event_access.event_id = event_assets.event_id
      AND event_access.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_assets.event_id
      AND events.org_id IN (
        SELECT org_id FROM public.profiles WHERE id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- DELETE: event owner (org) or super_admin
CREATE POLICY "event_assets_delete"
  ON public.event_assets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_assets.event_id
      AND events.org_id IN (
        SELECT org_id FROM public.profiles WHERE id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

GRANT ALL ON public.event_assets TO authenticated;
GRANT ALL ON public.event_assets TO service_role;
