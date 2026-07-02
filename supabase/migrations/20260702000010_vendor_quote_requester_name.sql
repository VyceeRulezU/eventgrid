-- Vendors can't see the planner's display_name via direct profiles SELECT
-- because RLS restricts profile visibility. Create a SECURITY DEFINER helper
-- (matching the pattern used by get_user_event_ids) so the vendor can
-- display who requested the quote.

CREATE OR REPLACE FUNCTION public.get_user_display_name(uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT display_name FROM profiles WHERE id = uid;
$$;
