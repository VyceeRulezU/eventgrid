-- Make event-media bucket publicly readable so images load in <img> tags (browser can't auth)
UPDATE storage.buckets SET public = true WHERE name = 'event-media';

-- Add DELETE policy so users can remove uploaded photos
CREATE POLICY "event_media_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'event-media' AND auth.role() = 'authenticated');
