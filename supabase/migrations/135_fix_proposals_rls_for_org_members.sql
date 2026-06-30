-- Migration 135: Fix proposals RLS to allow org members (coordinators, planners) to insert/update
-- ================================================================================
-- The original policy "proposals_org_access" only allowed the org owner (organizations.owner_id)
-- to access proposals. Coordinators and planners who are org members (profiles.org_id is set)
-- were blocked with RLS violations.

DROP POLICY IF EXISTS "proposals_org_access" ON public.proposals;

CREATE POLICY "proposals_org_access"
  ON public.proposals FOR ALL
  USING (
    org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid()
        AND org_id IS NOT NULL
        AND role IN ('coordinator', 'planner')
    )
  )
  WITH CHECK (
    org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid()
        AND org_id IS NOT NULL
        AND role IN ('coordinator', 'planner')
    )
  );
