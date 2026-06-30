-- Migration 130: Add RLS to payment_idempotency_keys
-- This table stores payment idempotency data and response blobs.
-- It had NO row-level security, exposing potentially sensitive payment data.

ALTER TABLE public.payment_idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Only super admins can read idempotency records (audit purposes)
CREATE POLICY "idempotency_select_super_admin"
  ON public.payment_idempotency_keys FOR SELECT
  USING (public.is_super_admin());

-- The verify-payment edge function uses the service role key,
-- so it bypasses RLS. Anon/authenticated users should never
-- read or write these records directly.
-- (No INSERT/UPDATE/DELETE policies = no access for regular users)
