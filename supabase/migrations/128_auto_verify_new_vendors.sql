-- Migration 128: Auto-verify new vendor self-registrations
-- ============================================================
-- Problem: New vendors are now inserted with is_verified = true
-- (see VendorOnboarding.tsx), but the INSERT RLS policy from
-- migration 127 still requires is_verified = false, blocking inserts.
--
-- Fix: Remove the is_verified = false check from the vendor
-- self-registration branch. claimed_by_vendor_id = auth.uid()
-- alone is sufficient proof of ownership.

DROP POLICY IF EXISTS "vendors_insert_org_members" ON public.vendors;

CREATE POLICY "vendors_insert_org_members" ON public.vendors FOR INSERT
  WITH CHECK (
    org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
    OR
    org_id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid()
        AND org_id IS NOT NULL
        AND role IN ('coordinator', 'planner')
    )
    OR
    claimed_by_vendor_id = auth.uid()
  );
