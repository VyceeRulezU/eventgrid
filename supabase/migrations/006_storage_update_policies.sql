-- Migration 006: Add storage UPDATE policies to allow avatar and media upserts
-- To allow upsert: true in Supabase storage, UPDATE policies are required on storage.objects.

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "org_assets_update_own_org"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'org-assets' AND auth.role() = 'authenticated');

CREATE POLICY "event_media_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'event-media' AND auth.role() = 'authenticated');

CREATE POLICY "event_docs_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'event-docs' AND auth.role() = 'authenticated');
