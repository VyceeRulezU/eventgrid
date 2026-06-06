-- Budget Allocation by Category
CREATE TABLE IF NOT EXISTS budget_allocations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category    text NOT NULL,
  allocated   bigint NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(event_id, category)
);

ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budget_allocations_planner_only" ON budget_allocations;
DROP POLICY IF EXISTS "budget_allocations_access" ON budget_allocations;
CREATE POLICY "budget_allocations_access"
  ON budget_allocations FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_budget_allocations_event ON budget_allocations(event_id);

GRANT ALL ON budget_allocations TO authenticated;
