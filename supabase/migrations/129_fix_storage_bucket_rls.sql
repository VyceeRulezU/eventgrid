-- Migration 129: Fix storage bucket RLS policies
-- Problem: All policies only check auth.role() = 'authenticated',
-- meaning any authenticated user can read/write/delete any file in any bucket.
-- Fix: Add ownership and event membership checks.

-- === AVATARS ===
-- Only the owner can manage their own avatar
DROP POLICY IF EXISTS "avatars_select_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;

CREATE POLICY "avatars_select_own"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (storage.objects.name LIKE auth.uid()::text || '%'));

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (storage.objects.name LIKE auth.uid()::text || '%'));

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (storage.objects.name LIKE auth.uid()::text || '%'));

-- === ORG ASSETS ===
-- Org assets: restrict to org members via organization owner check
DROP POLICY IF EXISTS "org_assets_select_own_org" ON storage.objects;
DROP POLICY IF EXISTS "org_assets_insert_own_org" ON storage.objects;
DROP POLICY IF EXISTS "org_assets_update_own_org" ON storage.objects;

-- Extract org_id from first segment of the path
CREATE OR REPLACE FUNCTION public.storage_path_org_id(path text)
RETURNS uuid LANGUAGE sql IMMUTABLE AS $$
  SELECT (SUBSTRING(path FROM '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/'))::uuid;
$$;

CREATE POLICY "org_assets_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'org-assets'
    AND auth.role() = 'authenticated'
    AND (
      public.storage_path_org_id(storage.objects.name) IN (
        SELECT id FROM public.organizations WHERE owner_id = auth.uid()
      )
      OR public.is_super_admin()
    )
  );

CREATE POLICY "org_assets_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'org-assets'
    AND auth.role() = 'authenticated'
    AND (
      public.storage_path_org_id(storage.objects.name) IN (
        SELECT id FROM public.organizations WHERE owner_id = auth.uid()
      )
      OR public.is_super_admin()
    )
  );

CREATE POLICY "org_assets_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'org-assets'
    AND auth.role() = 'authenticated'
    AND (
      public.storage_path_org_id(storage.objects.name) IN (
        SELECT id FROM public.organizations WHERE owner_id = auth.uid()
      )
      OR public.is_super_admin()
    )
  );

CREATE POLICY "org_assets_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'org-assets'
    AND auth.role() = 'authenticated'
    AND (
      public.storage_path_org_id(storage.objects.name) IN (
        SELECT id FROM public.organizations WHERE owner_id = auth.uid()
      )
      OR public.is_super_admin()
    )
  );

-- === EVENT MEDIA ===
-- Public bucket for reading, but restrict write to event members
DROP POLICY IF EXISTS "event_media_select" ON storage.objects;
DROP POLICY IF EXISTS "event_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "event_media_update" ON storage.objects;
DROP POLICY IF EXISTS "event_media_delete" ON storage.objects;

CREATE POLICY "event_media_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-media' AND auth.role() = 'authenticated');

-- Extract event_id from path (first segment) for membership check
CREATE OR REPLACE FUNCTION public.storage_path_event_id(path text)
RETURNS uuid LANGUAGE sql IMMUTABLE AS $$
  SELECT (SUBSTRING(path FROM '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/'))::uuid;
$$;

CREATE POLICY "event_media_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-media'
    AND auth.role() = 'authenticated'
    AND (
      public.storage_path_event_id(storage.objects.name) IN (
        SELECT event_id FROM public.event_access WHERE user_id = auth.uid()
      )
      OR
      public.storage_path_event_id(storage.objects.name) IN (
        SELECT id FROM public.events WHERE created_by = auth.uid()
      )
      OR public.is_super_admin()
    )
  );

CREATE POLICY "event_media_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'event-media'
    AND auth.role() = 'authenticated'
    AND (
      public.storage_path_event_id(storage.objects.name) IN (
        SELECT event_id FROM public.event_access WHERE user_id = auth.uid()
      )
      OR
      public.storage_path_event_id(storage.objects.name) IN (
        SELECT id FROM public.events WHERE created_by = auth.uid()
      )
      OR public.is_super_admin()
    )
  );

CREATE POLICY "event_media_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-media'
    AND auth.role() = 'authenticated'
    AND (
      public.storage_path_event_id(storage.objects.name) IN (
        SELECT event_id FROM public.event_access WHERE user_id = auth.uid()
      )
      OR
      public.storage_path_event_id(storage.objects.name) IN (
        SELECT id FROM public.events WHERE created_by = auth.uid()
      )
      OR public.is_super_admin()
    )
  );

-- === EVENT DOCS ===
-- Same pattern as event-media
DROP POLICY IF EXISTS "event_docs_select" ON storage.objects;
DROP POLICY IF EXISTS "event_docs_insert" ON storage.objects;
DROP POLICY IF EXISTS "event_docs_update" ON storage.objects;

CREATE POLICY "event_docs_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-docs' AND auth.role() = 'authenticated');

CREATE POLICY "event_docs_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-docs'
    AND auth.role() = 'authenticated'
    AND (
      public.storage_path_event_id(storage.objects.name) IN (
        SELECT event_id FROM public.event_access WHERE user_id = auth.uid()
      )
      OR
      public.storage_path_event_id(storage.objects.name) IN (
        SELECT id FROM public.events WHERE created_by = auth.uid()
      )
      OR public.is_super_admin()
    )
  );

CREATE POLICY "event_docs_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'event-docs'
    AND auth.role() = 'authenticated'
    AND (
      public.storage_path_event_id(storage.objects.name) IN (
        SELECT event_id FROM public.event_access WHERE user_id = auth.uid()
      )
      OR
      public.storage_path_event_id(storage.objects.name) IN (
        SELECT id FROM public.events WHERE created_by = auth.uid()
      )
      OR public.is_super_admin()
    )
  );

CREATE POLICY "event_docs_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-docs'
    AND auth.role() = 'authenticated'
    AND (
      public.storage_path_event_id(storage.objects.name) IN (
        SELECT event_id FROM public.event_access WHERE user_id = auth.uid()
      )
      OR
      public.storage_path_event_id(storage.objects.name) IN (
        SELECT id FROM public.events WHERE created_by = auth.uid()
      )
      OR public.is_super_admin()
    )
  );
