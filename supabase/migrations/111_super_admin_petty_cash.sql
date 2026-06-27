-- Grant super admins full access to petty_cash (missing from 028_super_admin_foundation)
DROP POLICY IF EXISTS "super_admin_petty_cash" ON public.petty_cash;
CREATE POLICY "super_admin_petty_cash" ON public.petty_cash FOR ALL
  USING (public.is_super_admin());
