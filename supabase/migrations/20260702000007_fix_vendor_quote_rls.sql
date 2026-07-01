-- Fix: Vendors could not read quote requests they were invited to
-- because RLS on vendor_quote_requests only allowed org owners
-- and event members, not the invited vendors themselves.
--
-- A SECURITY DEFINER function is needed to avoid infinite recursion:
--   vqr_vendor_access → vendor_quote_invitations → vqi_org_access
--   → vendor_quote_requests → vqr_vendor_access (loop!)

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
