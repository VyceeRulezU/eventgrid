-- Two fixes:
--
-- 1. Re-create the SECURITY DEFINER function and vqr_vendor_access policy
--    (must run AFTER 20260702000007 to ensure the non-recursive version is in place).
--
-- 2. Allow planners/coordinators to insert notifications for vendors they
--    have invited to quote — the current notifications_insert policy only
--    allows own, super-admin-to-any, or any-to-super-admin, missing the
--    planner→vendor case.

-- ── 1. SECURITY DEFINER function for vendor invite check ──────────
CREATE OR REPLACE FUNCTION public.is_vendor_invited_to_quote(req_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM vendor_quote_invitations vqi
    JOIN vendors v ON v.id = vqi.vendor_id
    WHERE vqi.quote_request_id = req_id
      AND v.claimed_by_vendor_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "vqr_vendor_access" ON public.vendor_quote_requests;
CREATE POLICY "vqr_vendor_access"
  ON public.vendor_quote_requests FOR SELECT
  USING (public.is_vendor_invited_to_quote(id));

-- ── 2. Allow planner→vendor notifications ────────────────────────
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = notifications.user_id AND is_super_admin = true)
    OR EXISTS (
      SELECT 1
      FROM vendor_quote_invitations vqi
      JOIN vendor_quote_requests vqr ON vqr.id = vqi.quote_request_id
      JOIN vendors v ON v.id = vqi.vendor_id
      WHERE vqr.created_by = auth.uid()
        AND v.claimed_by_vendor_id = notifications.user_id
    )
  );
