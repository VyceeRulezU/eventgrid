-- Migration 132: Fix SECURITY DEFINER functions missing SET search_path
-- Uses ALTER FUNCTION to add search_path without changing function bodies.

ALTER FUNCTION public.validate_promo_code SET search_path = public;
ALTER FUNCTION public.increment_promo_redemption SET search_path = public;
ALTER FUNCTION public.get_promo_expected_amount SET search_path = public;
ALTER FUNCTION public.auto_archive_events() SET search_path = public;
ALTER FUNCTION public.event_is_paid SET search_path = public;
ALTER FUNCTION public.event_has_budget SET search_path = public;
ALTER FUNCTION public.merge_vendors SET search_path = public;
ALTER FUNCTION public.notify_task_assigned() SET search_path = public;
ALTER FUNCTION public.notify_issue_raised() SET search_path = public;
ALTER FUNCTION public.notify_issue_resolved() SET search_path = public;
