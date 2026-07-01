-- SECURITY DEFINER function to get total storage bytes
-- Bypasses RLS on storage.objects which is not exposed to the API
-- Only super_admins can call this (checked inside the function)
CREATE OR REPLACE FUNCTION public.get_total_storage_bytes()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'storage, public'
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only super admins can query storage usage';
  END IF;
  RETURN COALESCE((SELECT SUM(size) FROM storage.objects), 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_total_storage_bytes() FROM public;
REVOKE ALL ON FUNCTION public.get_total_storage_bytes() FROM anon;
REVOKE ALL ON FUNCTION public.get_total_storage_bytes() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_total_storage_bytes() TO authenticated;
