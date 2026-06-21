-- Grant super admins full access to event_phases (missing from 028_super_admin_foundation)
DROP POLICY IF EXISTS "super_admin_event_phases" ON public.event_phases;
CREATE POLICY "super_admin_event_phases" ON public.event_phases FOR ALL
  USING (public.is_super_admin());
