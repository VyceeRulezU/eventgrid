-- Migration 123: Allow vendors to self-insert into vendors table
-- ============================================================
-- Vendors who self-register via onboarding need to insert their own
-- record into the vendors table to appear in the vendor directory.

-- 1. Make org_id nullable so vendors without an org can still list themselves
ALTER TABLE public.vendors ALTER COLUMN org_id DROP NOT NULL;

-- 2. Drop the old INSERT policy and replace with one that also allows vendor self-registration
DROP POLICY IF EXISTS "vendors_insert_org_members" ON public.vendors;

CREATE POLICY "vendors_insert_org_members" ON public.vendors FOR INSERT
  WITH CHECK (
    -- Planners/coordinators with an org can insert
    org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
    OR
    org_id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid()
        AND org_id IS NOT NULL
        AND role IN ('coordinator', 'planner')
    )
    OR
    -- Vendors can self-register (insert their own profile into vendors directory)
    (
      claimed_by_vendor_id = auth.uid()
      AND is_verified = false
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'vendor'
      )
    )
  );
