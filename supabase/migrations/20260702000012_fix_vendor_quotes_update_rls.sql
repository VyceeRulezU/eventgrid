-- Add UPDATE policy for org owners on vendor_quotes
-- The existing vq_org_access was FOR SELECT only, blocking planners from accepting/rejecting quotes

DROP POLICY IF EXISTS "vq_org_access_update" ON public.vendor_quotes;
CREATE POLICY "vq_org_access_update"
  ON public.vendor_quotes FOR UPDATE
  USING (
    quote_request_id IN (
      SELECT id FROM public.vendor_quote_requests
      WHERE org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    )
  )
  WITH CHECK (
    quote_request_id IN (
      SELECT id FROM public.vendor_quote_requests
      WHERE org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    )
  );
