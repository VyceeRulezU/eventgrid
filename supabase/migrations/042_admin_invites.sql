-- Migration 042: Track admin team invitations (super_admin, monitor, admin_support)

CREATE TABLE IF NOT EXISTS admin_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL UNIQUE,
  role        text NOT NULL CHECK (role IN ('super_admin', 'monitor', 'admin_support')),
  invited_by  uuid REFERENCES profiles(id),
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled')),
  created_at  timestamptz DEFAULT now(),
  accepted_at timestamptz
);

ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;

-- Super admins can view all admin invites
CREATE POLICY "admin_invites_select" ON admin_invites FOR SELECT
  USING (public.is_super_admin());

-- Super admins can insert invites
CREATE POLICY "admin_invites_insert" ON admin_invites FOR INSERT
  WITH CHECK (public.is_super_admin());

-- Super admins can update invites (cancel, change role)
CREATE POLICY "admin_invites_update" ON admin_invites FOR UPDATE
  USING (public.is_super_admin());

-- Super admins can delete invites
CREATE POLICY "admin_invites_delete" ON admin_invites FOR DELETE
  USING (public.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_admin_invites_email ON admin_invites(email);
CREATE INDEX IF NOT EXISTS idx_admin_invites_status ON admin_invites(status);

GRANT ALL ON public.admin_invites TO service_role;
GRANT ALL ON public.admin_invites TO authenticated;
