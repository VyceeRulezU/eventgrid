-- Migration 136: Fix organizations RLS + org-assets storage RLS for org members
-- ================================================================================
-- Problem:
--   1. organizations RLS only allows the org owner (owner_id = auth.uid()) to SELECT/UPDATE.
--      Coordinators and planners who are org members get RLS violations.
--   2. org-assets storage RLS has the same issue + the path extraction doesn't match
--      the org-logos/{orgId}-{timestamp}.ext pattern.

-- ── 1. Organizations table ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "orgs_select_own" ON public.organizations;

CREATE POLICY "orgs_select_own"
  ON public.organizations FOR SELECT
  USING (
    owner_id = auth.uid()
    OR
    id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid()
        AND org_id IS NOT NULL
        AND role IN ('coordinator', 'planner')
    )
  );

DROP POLICY IF EXISTS "orgs_update_own" ON public.organizations;

CREATE POLICY "orgs_update_own"
  ON public.organizations FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR
    id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid()
        AND org_id IS NOT NULL
        AND role IN ('coordinator', 'planner')
    )
  );

-- ── 2. Org-assets storage bucket ────────────────────────────────────────────────
-- The org_id is stored in the second path segment for org-logos/ paths:
--   org-logos/{orgId}-{timestamp}.ext  →  orgId is the first UUID after org-logos/
-- For other paths, the first segment is the org_id (legacy).

CREATE OR REPLACE FUNCTION public.storage_path_org_id(path text)
RETURNS uuid LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(
    -- org-logos/{orgId}-{timestamp}.ext
    (SUBSTRING(path FROM '^org-logos/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'))::uuid,
    -- {orgId}/... (legacy)
    (SUBSTRING(path FROM '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/'))::uuid
  );
$$;

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
      public.storage_path_org_id(storage.objects.name) IN (
        SELECT org_id FROM public.profiles
        WHERE id = auth.uid()
          AND org_id IS NOT NULL
          AND role IN ('coordinator', 'planner')
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
      OR
      public.storage_path_org_id(storage.objects.name) IN (
        SELECT org_id FROM public.profiles
        WHERE id = auth.uid()
          AND org_id IS NOT NULL
          AND role IN ('coordinator', 'planner')
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
      OR
      public.storage_path_org_id(storage.objects.name) IN (
        SELECT org_id FROM public.profiles
        WHERE id = auth.uid()
          AND org_id IS NOT NULL
          AND role IN ('coordinator', 'planner')
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
      OR
      public.storage_path_org_id(storage.objects.name) IN (
        SELECT org_id FROM public.profiles
        WHERE id = auth.uid()
          AND org_id IS NOT NULL
          AND role IN ('coordinator', 'planner')
      )
      OR public.is_super_admin()
    )
  );
