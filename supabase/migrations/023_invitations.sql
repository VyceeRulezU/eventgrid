-- Migration 023: Track invitations sent to team members

CREATE TABLE invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email       text NOT NULL,
  invited_by  uuid REFERENCES profiles(id),
  role        text NOT NULL DEFAULT 'team_member',
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at  timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(event_id, email)
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Planners/coordinators can view invitations for their events
CREATE POLICY "invitations_select_planner" ON invitations FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );

-- Invited user can see their own invitation
CREATE POLICY "invitations_select_own" ON invitations FOR SELECT
  USING (email IN (SELECT email FROM profiles WHERE id = auth.uid()));

-- Planners/coordinators can insert invitations
CREATE POLICY "invitations_insert" ON invitations FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );

-- Invited user can mark their invitation as accepted
CREATE POLICY "invitations_update_self" ON invitations FOR UPDATE
  USING (email IN (SELECT email FROM profiles WHERE id = auth.uid()))
  WITH CHECK (
    email IN (SELECT email FROM profiles WHERE id = auth.uid())
    AND status IN ('accepted')
  );

CREATE INDEX idx_invitations_event ON invitations(event_id);
CREATE INDEX idx_invitations_email ON invitations(email);
