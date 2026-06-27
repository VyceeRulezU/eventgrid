-- Grant super admins full access to budget_allocations (missing from 028_super_admin_foundation)
DROP POLICY IF EXISTS "super_admin_budget_allocations" ON public.budget_allocations;
CREATE POLICY "super_admin_budget_allocations" ON public.budget_allocations FOR ALL
  USING (public.is_super_admin());
