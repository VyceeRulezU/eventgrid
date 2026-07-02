-- Add 'accepted' to vendor_quote_invitations status check constraint
-- so that when a planner accepts a quote, the vendor sees the updated status

ALTER TABLE public.vendor_quote_invitations
  DROP CONSTRAINT IF EXISTS vendor_quote_invitations_status_check;

ALTER TABLE public.vendor_quote_invitations
  ADD CONSTRAINT vendor_quote_invitations_status_check
  CHECK (status IN ('pending', 'declined', 'quoted', 'accepted'));
