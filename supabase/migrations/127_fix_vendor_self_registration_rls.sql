-- Migration 127: Fix vendor self-registration RLS
-- ============================================================
-- Problem: VendorOnboarding.tsx does two sequential requests:
--   1. UPDATE profiles SET role='vendor'
--   2. INSERT INTO vendors
-- The second request's RLS policy requires `SELECT FROM profiles WHERE role='vendor'`.
-- If the UPDATE hasn't fully propagated by the time the INSERT runs (separate HTTP requests),
-- the RLS check fails and the vendor record is never created.
--
-- Fix: Simplify the vendor self-registration condition to only check
-- `claimed_by_vendor_id = auth.uid()` — the vendors table itself carries
-- ownership, so the additional profile role check is redundant and fragile.

-- 1. Ensure org_id is nullable (in case migration 123 was missed)
ALTER TABLE public.vendors ALTER COLUMN org_id DROP NOT NULL;

-- 2. Drop the existing INSERT policy
DROP POLICY IF EXISTS "vendors_insert_org_members" ON public.vendors;

-- 3. Recreate with relaxed vendor self-registration condition
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
    -- No redundant profile role check; claimed_by_vendor_id IS the proof of ownership
    (
      claimed_by_vendor_id = auth.uid()
      AND is_verified = false
    )
  );
