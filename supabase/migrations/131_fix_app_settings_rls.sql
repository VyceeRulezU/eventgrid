-- Migration 131: Fix app_settings RLS to restrict writes to super admins
-- Previously any authenticated user could modify global app settings.

DROP POLICY IF EXISTS "app_settings_insert_authenticated" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_update_authenticated" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_delete_authenticated" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_select_authenticated" ON public.app_settings;

-- All authenticated users can read settings (they're not sensitive)
CREATE POLICY "app_settings_select"
  ON public.app_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only super admins can modify settings
CREATE POLICY "app_settings_insert"
  ON public.app_settings FOR INSERT
  WITH CHECK (public.is_super_admin());

CREATE POLICY "app_settings_update"
  ON public.app_settings FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "app_settings_delete"
  ON public.app_settings FOR DELETE
  USING (public.is_super_admin());

REVOKE ALL ON public.app_settings FROM anon;
REVOKE ALL ON public.app_settings FROM authenticated;
GRANT SELECT ON public.app_settings TO authenticated;
