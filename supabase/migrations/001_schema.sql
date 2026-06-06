-- EventGrid Database Schema
-- Migration 001: Core tables, RLS, triggers, and storage buckets

-- ============================================================
-- TRIGGER FUNCTIONS (defined first so tables can reference them)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_event_phases()
RETURNS TRIGGER AS $$
DECLARE
  phase_names text[] := ARRAY[
    'Lead & Client Onboarding',
    'Event Planning & Strategy',
    'Vendor Management',
    'Team Coordination',
    'Guest Management',
    'Pre-Event Finalization',
    'Event Day Operations',
    'Event Closeout',
    'Post-Event Analysis'
  ];
  i integer;
BEGIN
  FOR i IN 1..9 LOOP
    INSERT INTO event_phases (event_id, phase_number, phase_name)
    VALUES (NEW.id, i, phase_names[i]);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- TABLES
-- ============================================================

-- 1. profiles
CREATE TABLE profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  display_name  text,
  phone         text,
  avatar_url    text,
  role          text NOT NULL CHECK (role IN ('planner', 'coordinator', 'vendor', 'client')),
  org_id        uuid,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 2. organizations
CREATE TABLE organizations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  owner_id      uuid NOT NULL REFERENCES profiles(id),
  logo_url      text,
  website       text,
  instagram     text,
  address       text,
  city          text DEFAULT 'Abuja',
  state         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Add org_id FK now that organizations exists
ALTER TABLE profiles
  ADD CONSTRAINT profiles_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES organizations(id);

-- 3. events
CREATE TABLE events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations(id),
  created_by        uuid NOT NULL REFERENCES profiles(id),
  name              text NOT NULL,
  event_type        text NOT NULL,
  event_date        date,
  end_date          date,
  venue_name        text,
  venue_address     text,
  guest_count       integer,
  size_tier         text CHECK (size_tier IN ('intimate', 'standard', 'large')),
  budget_total      bigint,
  status            text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'in_progress', 'completed', 'cancelled')),
  payment_status    text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  paystack_ref      text,
  current_phase     integer DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 9),
  client_id         uuid REFERENCES profiles(id),
  coordinator_id    uuid REFERENCES profiles(id),
  notes             text,
  deleted_at        timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- 4. event_access
CREATE TABLE event_access (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('coordinator', 'team_member', 'vendor', 'client')),
  invited_by  uuid REFERENCES profiles(id),
  accepted_at timestamptz,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 5. event_phases
CREATE TABLE event_phases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  phase_number  integer NOT NULL CHECK (phase_number BETWEEN 1 AND 9),
  phase_name    text NOT NULL,
  status        text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked')),
  owner_id      uuid REFERENCES profiles(id),
  due_date      date,
  completed_at  timestamptz,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(event_id, phase_number)
);

-- 6. vendors
CREATE TABLE vendors (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(id),
  name          text NOT NULL,
  category      text NOT NULL,
  contact_name  text,
  phone         text,
  email         text,
  instagram     text,
  rating        numeric(2,1) CHECK (rating BETWEEN 1.0 AND 5.0),
  notes         text,
  is_verified   boolean DEFAULT false,
  deleted_at    timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 7. event_vendors
CREATE TABLE event_vendors (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  vendor_id         uuid REFERENCES vendors(id),
  vendor_name       text NOT NULL,
  category          text NOT NULL,
  service_desc      text,
  quantity          integer DEFAULT 1,
  total_amount      bigint NOT NULL,
  advance_paid      bigint DEFAULT 0,
  balance           bigint GENERATED ALWAYS AS (total_amount - advance_paid) STORED,
  payment_status    text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'advance', 'paid', 'cancelled')),
  booking_status    text DEFAULT 'sourcing' CHECK (booking_status IN ('sourcing', 'quoted', 'negotiating', 'confirmed', 'paid', 'cancelled')),
  contract_url      text,
  payment_date      date,
  notes             text,
  portal_user_id    uuid REFERENCES profiles(id),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- 8. financial_entries
CREATE TABLE financial_entries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_vendor_id   uuid REFERENCES event_vendors(id),
  vendor_name       text NOT NULL,
  description       text NOT NULL,
  category          text NOT NULL,
  quantity          integer DEFAULT 1,
  total_amount      bigint NOT NULL,
  advance_paid      bigint DEFAULT 0,
  balance           bigint GENERATED ALWAYS AS (total_amount - advance_paid) STORED,
  payment_status    text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'advance', 'paid')),
  payment_date      date,
  receipt_url       text,
  notes             text,
  sort_order        integer DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- 9. tasks
CREATE TABLE tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text,
  assignee_id   uuid REFERENCES profiles(id),
  created_by    uuid NOT NULL REFERENCES profiles(id),
  due_datetime  timestamptz,
  priority      text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status        text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'blocked')),
  completed_at  timestamptz,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 10. seating_tables (must exist before guests references it)
CREATE TABLE seating_tables (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  table_name  text NOT NULL,
  capacity    integer DEFAULT 10,
  is_vip      boolean DEFAULT false,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

-- 11. guests
CREATE TABLE guests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  first_name    text NOT NULL,
  last_name     text,
  phone         text,
  email         text,
  rsvp_status   text DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'confirmed', 'declined', 'maybe')),
  table_id      uuid REFERENCES seating_tables(id),
  seat_number   integer,
  is_vip        boolean DEFAULT false,
  group_name    text,
  plus_one      boolean DEFAULT false,
  checked_in    boolean DEFAULT false,
  checked_in_at timestamptz,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 12. live_board_items
CREATE TABLE live_board_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  station_name  text NOT NULL,
  category      text,
  status        text DEFAULT 'grey' CHECK (status IN ('green', 'yellow', 'red', 'grey')),
  status_label  text,
  updated_by    uuid REFERENCES profiles(id),
  sort_order    integer DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 13. issues
CREATE TABLE issues (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id),
  board_item_id uuid REFERENCES live_board_items(id),
  title         text NOT NULL,
  description   text,
  severity      text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  photo_url     text,
  raised_by     uuid NOT NULL REFERENCES profiles(id),
  raised_at     timestamptz DEFAULT now(),
  resolved_at   timestamptz,
  resolution    text,
  resolved_by   uuid REFERENCES profiles(id),
  created_at    timestamptz DEFAULT now()
);

-- 14. media
CREATE TABLE media (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id),
  uploader_id   uuid NOT NULL REFERENCES profiles(id),
  url           text NOT NULL,
  storage_path  text NOT NULL,
  tag           text,
  phase_number  integer,
  caption       text,
  file_size     integer,
  created_at    timestamptz DEFAULT now()
);

-- 15. client_portals
CREATE TABLE client_portals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  client_name   text NOT NULL,
  client_email  text,
  client_phone  text,
  access_token  text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active     boolean DEFAULT true,
  expires_at    timestamptz,
  last_accessed timestamptz,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(event_id)
);

-- 16. notifications
CREATE TABLE notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id      uuid REFERENCES events(id),
  type          text NOT NULL,
  title         text NOT NULL,
  body          text,
  is_read       boolean DEFAULT false,
  read_at       timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- 17. run_sheet_items
CREATE TABLE run_sheet_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  time          time NOT NULL,
  duration_mins integer DEFAULT 15,
  title         text NOT NULL,
  description   text,
  owner         text,
  status        text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'delayed', 'skipped')),
  actual_time   time,
  notes         text,
  sort_order    integer DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- update_updated_at for all applicable tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON event_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON event_vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON financial_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON guests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON live_board_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON run_sheet_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on sign-up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-create event phases on event creation
CREATE TRIGGER on_event_created
  AFTER INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION create_event_phases();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- 1. profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_select_event_members" ON profiles FOR SELECT
  USING (
    id IN (
      SELECT user_id FROM event_access
      WHERE event_id IN (
        SELECT id FROM events WHERE org_id = (
          SELECT org_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

-- 2. organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orgs_select_own" ON organizations FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "orgs_insert_own" ON organizations FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "orgs_update_own" ON organizations FOR UPDATE USING (owner_id = auth.uid());

-- 3. events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select_planner" ON events FOR SELECT
  USING (
    org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    AND deleted_at IS NULL
  );
CREATE POLICY "events_select_coordinator" ON events FOR SELECT
  USING (coordinator_id = auth.uid() AND deleted_at IS NULL);
CREATE POLICY "events_insert_planner" ON events FOR INSERT
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));
CREATE POLICY "events_update_planner" ON events FOR UPDATE
  USING (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- 4. event_access
ALTER TABLE event_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_access_select_planner" ON event_access FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE org_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
      )
    )
  );
CREATE POLICY "event_access_select_own" ON event_access FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "event_access_insert_planner" ON event_access FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE org_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
      )
    )
  );

-- 5. event_phases
ALTER TABLE event_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_phases_select" ON event_phases FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
    OR event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid())
  );
CREATE POLICY "event_phases_update_planner_coordinator" ON event_phases FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );

-- 6. vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendors_select_own_org" ON vendors FOR SELECT
  USING (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()) AND deleted_at IS NULL);
CREATE POLICY "vendors_insert_own_org" ON vendors FOR INSERT
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));
CREATE POLICY "vendors_update_own_org" ON vendors FOR UPDATE
  USING (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- 7. event_vendors
ALTER TABLE event_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_vendors_planner" ON event_vendors FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE org_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
      )
    )
  );
CREATE POLICY "event_vendors_coordinator_select" ON event_vendors FOR SELECT
  USING (event_id IN (SELECT id FROM events WHERE coordinator_id = auth.uid()));
CREATE POLICY "event_vendors_vendor_own" ON event_vendors FOR SELECT
  USING (portal_user_id = auth.uid());

-- 8. financial_entries
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "financial_entries_planner_only" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_access" ON financial_entries;
CREATE POLICY "financial_entries_access" ON financial_entries FOR ALL
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

-- 9. tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_select_planner_coordinator" ON tasks FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );
CREATE POLICY "tasks_select_assignee" ON tasks FOR SELECT
  USING (assignee_id = auth.uid());
CREATE POLICY "tasks_update_assignee" ON tasks FOR UPDATE
  USING (assignee_id = auth.uid())
  WITH CHECK (assignee_id = auth.uid());

-- 10. seating_tables
ALTER TABLE seating_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seating_planner_coordinator" ON seating_tables FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );

-- 11. guests
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guests_planner_coordinator_full" ON guests FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );
CREATE POLICY "guests_team_checkin" ON guests FOR UPDATE
  USING (event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid()));

-- 12. live_board_items
ALTER TABLE live_board_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live_board_planner_coordinator" ON live_board_items FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );
CREATE POLICY "live_board_team_update" ON live_board_items FOR UPDATE
  USING (event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid()));

-- 13. issues
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "issues_planner_coordinator_full" ON issues FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );
CREATE POLICY "issues_team_insert" ON issues FOR INSERT
  WITH CHECK (
    event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid())
    AND raised_by = auth.uid()
  );
CREATE POLICY "issues_team_select" ON issues FOR SELECT
  USING (event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid()));

-- 14. media
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_planner_coordinator_full" ON media FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );
CREATE POLICY "media_team_insert_select" ON media FOR INSERT
  WITH CHECK (
    event_id IN (SELECT event_id FROM event_access WHERE user_id = auth.uid())
    AND uploader_id = auth.uid()
  );

-- 15. client_portals
ALTER TABLE client_portals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_portals_planner_only" ON client_portals FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE org_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
      )
    )
  );

-- 16. notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON notifications FOR ALL
  USING (user_id = auth.uid());

-- 17. run_sheet_items
ALTER TABLE run_sheet_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "run_sheet_planner_coordinator" ON run_sheet_items FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('org-assets', 'org-assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('event-media', 'event-media', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('event-docs', 'event-docs', false) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE RLS POLICIES
-- ============================================================

-- Avatars: authenticated users can upload/read their own
CREATE POLICY "avatars_select_own"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Org assets: org members can manage
CREATE POLICY "org_assets_select_own_org"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-assets' AND auth.role() = 'authenticated');
CREATE POLICY "org_assets_insert_own_org"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'org-assets' AND auth.role() = 'authenticated');

-- Event media: authenticated users with event access
CREATE POLICY "event_media_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-media' AND auth.role() = 'authenticated');
CREATE POLICY "event_media_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-media' AND auth.role() = 'authenticated');

-- Event docs: same pattern
CREATE POLICY "event_docs_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-docs' AND auth.role() = 'authenticated');
CREATE POLICY "event_docs_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-docs' AND auth.role() = 'authenticated');

-- Enable Realtime for live board tables
ALTER PUBLICATION supabase_realtime ADD TABLE live_board_items;
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
