-- Migration 115: Claimable Vendor Directory & Edit Suggestions
-- ============================================================

-- 1. Add new columns to vendors table
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS claimed_by_vendor_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS claim_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by_admin_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS website TEXT;

-- 2. Create vendor_claims table
CREATE TABLE IF NOT EXISTS public.vendor_claims (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id               UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_email          TEXT,
  business_phone          TEXT,
  proof_url               TEXT,
  status                  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes             TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create vendor_edit_suggestions table
CREATE TABLE IF NOT EXISTS public.vendor_edit_suggestions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id               UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  suggested_by            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  suggested_data          JSONB NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.vendor_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_edit_suggestions ENABLE ROW LEVEL SECURITY;

-- 5. Drop old vendors select & update policies
DROP POLICY IF EXISTS "vendors_select_org_members" ON public.vendors;
DROP POLICY IF EXISTS "vendors_update_org_members" ON public.vendors;
DROP POLICY IF EXISTS "vendors_select_all_authenticated" ON public.vendors;
DROP POLICY IF EXISTS "vendors_update_policy" ON public.vendors;

-- 6. Create new vendors SELECT policy (Global Directory Read)
CREATE POLICY "vendors_select_all_authenticated" ON public.vendors 
  FOR SELECT 
  USING (deleted_at IS NULL AND auth.role() = 'authenticated');

-- 7. Create new vendors UPDATE policy
CREATE POLICY "vendors_update_policy" ON public.vendors 
  FOR UPDATE
  USING (
    deleted_at IS NULL AND (
      -- Super admins can edit any vendor
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'super_admin'
      )
      OR
      -- Verified vendor owner can edit their own business details
      (is_verified = true AND claimed_by_vendor_id = auth.uid())
      OR
      -- If unclaimed, org owners or planners/coordinators of the creating organization can edit
      (is_verified = false AND (
        org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
        OR
        org_id IN (
          SELECT org_id FROM public.profiles p
          WHERE p.id = auth.uid() 
            AND p.org_id IS NOT NULL 
            AND p.role IN ('planner', 'coordinator')
        )
      ))
    )
  );

-- 8. Create vendor_claims RLS policies
DROP POLICY IF EXISTS "claims_select_own" ON public.vendor_claims;
CREATE POLICY "claims_select_own" ON public.vendor_claims
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "claims_insert_own" ON public.vendor_claims;
CREATE POLICY "claims_insert_own" ON public.vendor_claims
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "claims_update_admin" ON public.vendor_claims;
CREATE POLICY "claims_update_admin" ON public.vendor_claims
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- 9. Create vendor_edit_suggestions RLS policies
DROP POLICY IF EXISTS "suggestions_select" ON public.vendor_edit_suggestions;
CREATE POLICY "suggestions_select" ON public.vendor_edit_suggestions
  FOR SELECT
  USING (
    suggested_by = auth.uid()
    -- Vendor owner of target listing can see suggestions
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.claimed_by_vendor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "suggestions_insert" ON public.vendor_edit_suggestions;
CREATE POLICY "suggestions_insert" ON public.vendor_edit_suggestions
  FOR INSERT
  WITH CHECK (suggested_by = auth.uid());

DROP POLICY IF EXISTS "suggestions_update" ON public.vendor_edit_suggestions;
CREATE POLICY "suggestions_update" ON public.vendor_edit_suggestions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
    -- Vendor owner of target listing can approve/reject suggestions
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.claimed_by_vendor_id = auth.uid() AND v.is_verified = true
    )
  );
