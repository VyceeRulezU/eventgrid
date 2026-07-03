-- Migration: Fix org-assets storage RLS to allow org members (not just owner)
-- ================================================================================
-- Problem: org_assets_insert / update / delete policies only check
--   owner_id = auth.uid(), blocking coordinators/planners from uploading logos.

-- ── 0. Ensure get_user_org_id (with role filter) exists ────────────────────────
-- SECURITY DEFINER so it bypasses RLS on profiles (prevents recursion).
CREATE OR REPLACE FUNCTION public.get_user_org_id(allowed_roles text[] DEFAULT NULL)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT org_id FROM public.profiles 
  WHERE id = auth.uid() 
    AND org_id IS NOT NULL
    AND (allowed_roles IS NULL OR role = ANY(allowed_roles))
$$;

-- ── 1. Org-assets storage policies ─────────────────────────────────────────────

DROP POLICY IF EXISTS "org_assets_select" ON storage.objects;
DROP POLICY IF EXISTS "org_assets_insert" ON storage.objects;
DROP POLICY IF EXISTS "org_assets_update" ON storage.objects;
DROP POLICY IF EXISTS "org_assets_delete" ON storage.objects;

CREATE POLICY "org_assets_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'org-assets'
    AND auth.role() = 'authenticated'
    AND (
      public.storage_path_org_id(storage.objects.name) IN (
        SELECT id FROM public.organizations WHERE owner_id = auth.uid()
      )
      OR
      public.storage_path_org_id(storage.objects.name) = public.get_user_org_id(ARRAY['coordinator', 'planner'])
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
      OR
      public.storage_path_org_id(storage.objects.name) = public.get_user_org_id(ARRAY['coordinator', 'planner'])
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
      OR
      public.storage_path_org_id(storage.objects.name) = public.get_user_org_id(ARRAY['coordinator', 'planner'])
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
      OR
      public.storage_path_org_id(storage.objects.name) = public.get_user_org_id(ARRAY['coordinator', 'planner'])
      OR public.is_super_admin()
    )
  );
