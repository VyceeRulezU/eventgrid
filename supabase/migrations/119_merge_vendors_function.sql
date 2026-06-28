-- Migration 119: Atomic Vendor Merging RPC for Super Admins
-- =========================================================

CREATE OR REPLACE FUNCTION public.merge_vendors(source_id UUID, target_id UUID)
RETURNS void AS $$
BEGIN
  -- 1. Enforce super admin permission check using platform's standard helper
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied. Only super admins can merge vendors.';
  END IF;

  -- 2. Verify source and target vendors exist
  IF NOT EXISTS (SELECT 1 FROM public.vendors WHERE id = source_id AND deleted_at IS NULL) OR
     NOT EXISTS (SELECT 1 FROM public.vendors WHERE id = target_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Both source and target vendors must exist and not be deleted.';
  END IF;

  -- 3. Prevent merging a vendor into itself
  IF source_id = target_id THEN
    RAISE EXCEPTION 'Source and target vendors cannot be the same.';
  END IF;

  -- 4. Reassign references in event_vendors
  UPDATE public.event_vendors
  SET vendor_id = target_id
  WHERE vendor_id = source_id;

  -- 5. Reassign references in vendor_claims
  UPDATE public.vendor_claims
  SET vendor_id = target_id
  WHERE vendor_id = source_id;

  -- 6. Reassign references in vendor_edit_suggestions
  UPDATE public.vendor_edit_suggestions
  SET vendor_id = target_id
  WHERE vendor_id = source_id;

  -- 7. Soft-delete the source vendor
  UPDATE public.vendors
  SET deleted_at = now()
  WHERE id = source_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
