-- EventGrid Seed Data — Single CTE Chain
-- Replace '<YOUR_USER_ID>' with your Supabase Auth user UUID.
-- Run the entire block at once in Supabase SQL editor.

WITH
usr AS (SELECT 'c6ef456e-3617-41ab-8cc0-41905e0f12dc'::uuid AS id),

org AS (
  INSERT INTO organizations (owner_id, name, city, state, website, instagram)
  SELECT id, 'NaliTech Events', 'Abuja', 'FCT', 'https://nalitech.ng', '@nalitech_events' FROM usr
  RETURNING id
),

evt1 AS (
  INSERT INTO events (org_id, created_by, name, event_type, event_date, venue_name, venue_address, guest_count, size_tier, budget_total, status, payment_status, current_phase)
  SELECT id, (SELECT id FROM usr), 'Smith & Johnson Wedding', 'Wedding', '2026-08-15', 'Transcorp Hilton', '1 Aguiyi Ironsi St, Abuja', 200, 'standard', 5000000, 'active', 'paid', 3 FROM org RETURNING id
),
evt2 AS (
  INSERT INTO events (org_id, created_by, name, event_type, event_date, venue_name, venue_address, guest_count, size_tier, budget_total, status, payment_status, current_phase)
  SELECT id, (SELECT id FROM usr), 'Tech Innovators Summit', 'Conference', '2026-09-20', 'Landmark Centre', 'Plot 2, Water Corporation Rd, Lagos', 500, 'large', 15000000, 'active', 'paid', 5 FROM org RETURNING id
),
evt3 AS (
  INSERT INTO events (org_id, created_by, name, event_type, event_date, venue_name, venue_address, guest_count, size_tier, budget_total, status, payment_status, current_phase)
  SELECT id, (SELECT id FROM usr), 'Aisha 40th Birthday', 'Birthday', '2026-07-10', 'Jabi Lake Mall', 'Jabi Lake, Abuja', 80, 'intimate', 1200000, 'active', 'paid', 7 FROM org RETURNING id
),
evt4 AS (
  INSERT INTO events (org_id, created_by, name, event_type, event_date, venue_name, venue_address, guest_count, size_tier, budget_total, status, payment_status, current_phase)
  SELECT id, (SELECT id FROM usr), 'Okafor & Nnamdi Wedding', 'Wedding', '2026-12-05', 'Eko Hotels', 'Plot 1415 Adetokunbo Ademola St, Victoria Island', 300, 'standard', 8000000, 'draft', 'unpaid', 1 FROM org RETURNING id
),
evt5 AS (
  INSERT INTO events (org_id, created_by, name, event_type, event_date, venue_name, venue_address, guest_count, size_tier, budget_total, status, payment_status, current_phase)
  SELECT id, (SELECT id FROM usr), 'Green Energy Product Launch', 'Product Launch', '2026-06-30', 'Four Points by Sheraton', 'Lagos', 150, 'standard', 3000000, 'active', 'paid', 9 FROM org RETURNING id
),

ven1 AS (
  INSERT INTO vendors (org_id, name, category, contact_name, phone, email, rating, is_verified)
  SELECT id, 'Signature Catering', 'Catering', 'Chidi Okonkwo', '+234 803 000 0001', 'chidi@signaturecatering.com', 5, true FROM org RETURNING id
),
ven2 AS (
  INSERT INTO vendors (org_id, name, category, contact_name, phone, email, rating, is_verified)
  SELECT id, 'LensCraft Studio', 'Photography', 'Tunde Bakare', '+234 803 000 0002', 'tunde@lenscraft.com', 4, true FROM org RETURNING id
),
ven3 AS (
  INSERT INTO vendors (org_id, name, category, contact_name, phone, email, rating, is_verified)
  SELECT id, 'Royal Tents & Decor', 'Decoration', 'Ngozi Eze', '+234 803 000 0003', 'ngozi@royaltents.com', 5, true FROM org RETURNING id
),
ven4 AS (
  INSERT INTO vendors (org_id, name, category, contact_name, phone, email, rating, is_verified)
  SELECT id, 'Groove Masters DJ', 'Entertainment', 'Wale Thompson', '+234 803 000 0004', 'wale@groovemasters.com', 4, true FROM org RETURNING id
),
ven5 AS (
  INSERT INTO vendors (org_id, name, category, contact_name, phone, email, rating, is_verified)
  SELECT id, 'Bloom Floristry', 'Floral', 'Amara Okafor', '+234 803 000 0005', 'amara@bloom.com', 3, false FROM org RETURNING id
),
ven6 AS (
  INSERT INTO vendors (org_id, name, category, contact_name, phone, email, rating, is_verified)
  SELECT id, 'Sugar Rush Bakery', 'Cake', 'Funmi Adebayo', '+234 803 000 0006', 'funmi@sugarrush.com', 5, true FROM org RETURNING id
),
ven7 AS (
  INSERT INTO vendors (org_id, name, category, contact_name, phone, email, rating, is_verified)
  SELECT id, 'Asoebi by Kemi', 'Fashion', 'Kemi Alabi', '+234 803 000 0007', 'kemi@asoebibykemi.com', 4, true FROM org RETURNING id
),
ven8 AS (
  INSERT INTO vendors (org_id, name, category, contact_name, phone, email, rating, is_verified)
  SELECT id, 'Elite Security Services', 'Security', 'John Musa', '+234 803 000 0008', 'john@elitesecurity.com', 4, true FROM org RETURNING id
),
ven9 AS (
  INSERT INTO vendors (org_id, name, category, contact_name, phone, email, rating, is_verified)
  SELECT id, 'Pure Water Logistics', 'Logistics', 'Emeka Nwosu', '+234 803 000 0009', 'emeka@purewaterlogistics.com', 3, false FROM org RETURNING id
),
ven10 AS (
  INSERT INTO vendors (org_id, name, category, contact_name, phone, email, rating, is_verified)
  SELECT id, 'Golden Sounds Band', 'Entertainment', 'Segun Adewale', '+234 803 000 0010', 'segun@goldensounds.com', 5, true FROM org RETURNING id
),
ven11 AS (
  INSERT INTO vendors (org_id, name, category, contact_name, phone, email, rating, is_verified)
  SELECT id, 'The Makeup Studio', 'Beauty', 'Zainab Abdullah', '+234 803 000 0011', 'zainab@makeupstudio.com', 4, true FROM org RETURNING id
),
ven12 AS (
  INSERT INTO vendors (org_id, name, category, contact_name, phone, email, rating, is_verified)
  SELECT id, 'Frosty AC Rentals', 'Equipment', 'Kayode Ogun', '+234 803 000 0012', 'kayode@frostyac.com', 3, false FROM org RETURNING id
),

ev_vendor1 AS (
  INSERT INTO event_vendors (event_id, vendor_id, vendor_name, category, service_desc, quantity, total_amount, advance_paid, payment_status, booking_status)
  SELECT evt1.id, ven1.id, 'Signature Catering', 'Catering', 'Buffet service for 200 guests', 200, 2500000, 1250000, 'advance', 'confirmed' FROM evt1, ven1 RETURNING id
),
ev_vendor2 AS (
  INSERT INTO event_vendors (event_id, vendor_id, vendor_name, category, service_desc, quantity, total_amount, advance_paid, payment_status, booking_status)
  SELECT evt1.id, ven2.id, 'LensCraft Studio', 'Photography', 'Full-day coverage + 2 photographers', 1, 500000, 250000, 'advance', 'confirmed' FROM evt1, ven2 RETURNING id
),
ev_vendor3 AS (
  INSERT INTO event_vendors (event_id, vendor_id, vendor_name, category, service_desc, quantity, total_amount, advance_paid, payment_status, booking_status)
  SELECT evt1.id, ven3.id, 'Royal Tents & Decor', 'Decoration', 'Venue decoration', 1, 800000, 400000, 'advance', 'confirmed' FROM evt1, ven3 RETURNING id
),
ev_vendor4 AS (
  INSERT INTO event_vendors (event_id, vendor_id, vendor_name, category, service_desc, quantity, total_amount, advance_paid, payment_status, booking_status)
  SELECT evt1.id, ven4.id, 'Groove Masters DJ', 'Entertainment', 'DJ + PA system', 1, 300000, 150000, 'advance', 'confirmed' FROM evt1, ven4 RETURNING id
),
ev_vendor5 AS (
  INSERT INTO event_vendors (event_id, vendor_id, vendor_name, category, service_desc, quantity, total_amount, advance_paid, payment_status, booking_status)
  SELECT evt1.id, ven6.id, 'Sugar Rush Bakery', 'Cake', '4-tier wedding cake', 1, 200000, 100000, 'advance', 'confirmed' FROM evt1, ven6 RETURNING id
),
ev_vendor6 AS (
  INSERT INTO event_vendors (event_id, vendor_id, vendor_name, category, service_desc, quantity, total_amount, advance_paid, payment_status, booking_status)
  SELECT evt2.id, ven4.id, 'Groove Masters DJ', 'Entertainment', 'Sound system for conference hall', 2, 600000, 300000, 'advance', 'confirmed' FROM evt2, ven4 RETURNING id
),
ev_vendor7 AS (
  INSERT INTO event_vendors (event_id, vendor_id, vendor_name, category, service_desc, quantity, total_amount, advance_paid, payment_status, booking_status)
  SELECT evt2.id, ven8.id, 'Elite Security Services', 'Security', 'Event security — 10 guards', 10, 400000, 200000, 'advance', 'confirmed' FROM evt2, ven8 RETURNING id
),
ev_vendor8 AS (
  INSERT INTO event_vendors (event_id, vendor_id, vendor_name, category, service_desc, quantity, total_amount, advance_paid, payment_status, booking_status)
  SELECT evt3.id, ven1.id, 'Signature Catering', 'Catering', 'Small plates & cocktails for 80 guests', 80, 400000, 200000, 'advance', 'quoted' FROM evt3, ven1 RETURNING id
),
ev_vendor9 AS (
  INSERT INTO event_vendors (event_id, vendor_id, vendor_name, category, service_desc, quantity, total_amount, advance_paid, payment_status, booking_status)
  SELECT evt3.id, ven5.id, 'Bloom Floristry', 'Floral', 'Table centrepieces', 10, 150000, 0, 'unpaid', 'sourcing' FROM evt3, ven5 RETURNING id
),

tasks AS (
  INSERT INTO tasks (event_id, title, description, assignee_id, due_datetime, priority, status)
  SELECT evt1.id, 'Confirm menu tasting', 'Schedule and confirm menu tasting', (SELECT id FROM usr), '2026-07-01 10:00:00+01', 'high', 'in_progress' FROM evt1
  UNION ALL
  SELECT evt1.id, 'Send invitations', 'Print and dispatch wedding invitations', (SELECT id FROM usr), '2026-06-15 10:00:00+01', 'urgent', 'pending' FROM evt1
  UNION ALL
  SELECT evt1.id, 'Book hotel rooms', 'Reserve guest room block at Transcorp Hilton', (SELECT id FROM usr), '2026-07-20 10:00:00+01', 'medium', 'pending' FROM evt1
  UNION ALL
  SELECT evt1.id, 'Finalise seating chart', 'Complete table assignments', (SELECT id FROM usr), '2026-08-01 10:00:00+01', 'high', 'pending' FROM evt1
  UNION ALL
  SELECT evt1.id, 'Order wedding rings', 'Collect rings from jeweller', (SELECT id FROM usr), '2026-08-10 10:00:00+01', 'medium', 'done' FROM evt1
  UNION ALL
  SELECT evt2.id, 'Confirm speaker lineup', 'Finalise all conference speakers', (SELECT id FROM usr), '2026-08-15 10:00:00+01', 'high', 'in_progress' FROM evt2
  UNION ALL
  SELECT evt2.id, 'Arrange AV equipment', 'Coordinate with Groove Masters', (SELECT id FROM usr), '2026-09-01 10:00:00+01', 'high', 'pending' FROM evt2
  RETURNING id
),

board_items AS (
  INSERT INTO live_board_items (event_id, station_name, category, status, status_label)
  SELECT evt1.id, 'Registration Table', 'Check-In', 'green', 'On track' FROM evt1
  UNION ALL
  SELECT evt1.id, 'Catering Setup', 'Catering', 'green', 'On schedule' FROM evt1
  UNION ALL
  SELECT evt1.id, 'Decoration Final', 'Decoration', 'yellow', 'Awaiting florist' FROM evt1
  UNION ALL
  SELECT evt1.id, 'Sound Check', 'Audio', 'green', 'All clear' FROM evt1
  UNION ALL
  SELECT evt1.id, 'Photography', 'Media', 'green', 'Crew arrived' FROM evt1
  UNION ALL
  SELECT evt1.id, 'Bridal Suite', 'Logistics', 'grey', 'Not started' FROM evt1
  UNION ALL
  SELECT evt2.id, 'Registration', 'Check-In', 'green', 'Ready' FROM evt2
  UNION ALL
  SELECT evt2.id, 'Main Hall Setup', 'Venue', 'yellow', 'Stage assembly in progress' FROM evt2
  UNION ALL
  SELECT evt2.id, 'Speaker Ready Room', 'Logistics', 'green', 'Prepared' FROM evt2
  RETURNING id
),

issues AS (
  INSERT INTO issues (event_id, board_item_id, title, description, severity, raised_by)
  SELECT evt1.id, (SELECT id FROM board_items WHERE station_name = 'Catering Setup'), 'Catering staff shortage', 'Caterer reports 2 staff called in sick', 'high', (SELECT id FROM usr) FROM evt1
  UNION ALL
  SELECT evt1.id, (SELECT id FROM board_items WHERE station_name = 'Decoration Final'), 'Floral delivery delay', 'Bloom Floristry delayed by 2 hours', 'medium', (SELECT id FROM usr) FROM evt1
  UNION ALL
  SELECT evt2.id, (SELECT id FROM board_items WHERE station_name = 'Main Hall Setup'), 'Stage lighting issue', 'One lighting truss not functioning', 'high', (SELECT id FROM usr) FROM evt2
  RETURNING id
),

tables AS (
  INSERT INTO seating_tables (event_id, table_name, capacity, is_vip)
  SELECT evt1.id, 'Table 1 — Head', 10, true FROM evt1
  UNION ALL
  SELECT evt1.id, 'Table 2', 8, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Table 3', 8, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Table 4', 8, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Table 5', 8, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Table 6 — Family', 10, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Table 7', 8, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Table 8', 8, false FROM evt1
  RETURNING id
),

guests AS (
  INSERT INTO guests (event_id, first_name, last_name, phone, rsvp_status, table_id, is_vip, group_name, plus_one, checked_in)
  SELECT evt1.id, 'Chioma', 'Okafor', '+234 803 111 0001', 'confirmed', (SELECT id FROM tables WHERE table_name = 'Table 1 — Head'), true, 'Family', false, true FROM evt1
  UNION ALL
  SELECT evt1.id, 'Emeka', 'Okafor', '+234 803 111 0002', 'confirmed', (SELECT id FROM tables WHERE table_name = 'Table 1 — Head'), true, 'Family', false, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Ngozi', 'Johnson', '+234 803 111 0003', 'confirmed', (SELECT id FROM tables WHERE table_name = 'Table 1 — Head'), true, 'Family', true, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Tunde', 'Bamigboye', '+234 803 111 0004', 'confirmed', (SELECT id FROM tables WHERE table_name = 'Table 2'), false, 'Friends', true, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Amara', 'Nwosu', '+234 803 111 0005', 'confirmed', (SELECT id FROM tables WHERE table_name = 'Table 2'), false, 'Friends', false, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Kunle', 'Adebayo', '+234 803 111 0006', 'pending', NULL, false, 'Colleagues', true, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Zainab', 'Musa', '+234 803 111 0007', 'pending', NULL, false, 'Colleagues', false, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Femi', 'Olawale', '+234 803 111 0008', 'declined', NULL, false, 'Friends', false, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Simi', 'Adebayo', '+234 803 111 0009', 'confirmed', (SELECT id FROM tables WHERE table_name = 'Table 3'), false, 'Friends', true, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Dayo', 'Ogundipe', '+234 803 111 0010', 'confirmed', (SELECT id FROM tables WHERE table_name = 'Table 3'), false, 'Friends', false, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Bola', 'Akinlade', '+234 803 111 0011', 'maybe', NULL, false, 'Colleagues', true, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Yetunde', 'Balogun', '+234 803 111 0012', 'confirmed', (SELECT id FROM tables WHERE table_name = 'Table 4'), false, 'Family', true, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Chidi', 'Okonkwo', '+234 803 111 0013', 'confirmed', (SELECT id FROM tables WHERE table_name = 'Table 4'), false, 'Family', false, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Ifeanyi', 'Eze', '+234 803 111 0014', 'pending', NULL, false, 'Colleagues', false, false FROM evt1
  UNION ALL
  SELECT evt1.id, 'Temidayo', 'Ogun', '+234 803 111 0015', 'confirmed', (SELECT id FROM tables WHERE table_name = 'Table 5'), false, 'Friends', true, false FROM evt1
  RETURNING id
),

portal AS (
  INSERT INTO client_portals (event_id, client_name, client_email, access_token, is_active)
  SELECT evt1.id, 'Chioma Smith (Client)', 'chioma.smith@example.com', 'demo-token-001-abcdef123456', true FROM evt1
  RETURNING id
),

media AS (
  INSERT INTO media (event_id, uploader_id, url, storage_path, tag, caption)
  SELECT evt1.id, (SELECT id FROM usr), 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400', 'demo/wedding-venue.jpg', 'client_share', 'Venue setup' FROM evt1
  UNION ALL
  SELECT evt1.id, (SELECT id FROM usr), 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400', 'demo/wedding-cake.jpg', 'client_share', 'Cake tasting' FROM evt1
  UNION ALL
  SELECT evt1.id, (SELECT id FROM usr), 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400', 'demo/floral-arrangement.jpg', 'client_share', 'Floral centrepiece' FROM evt1
  RETURNING id
),

run_sheet AS (
  INSERT INTO run_sheet_items (event_id, time, duration_mins, title, description, owner, status, sort_order)
  SELECT evt1.id, '14:00', 60, 'Venue Access', 'Decorators and caterers arrive', 'Royal Tents & Decor', 'pending', 1 FROM evt1
  UNION ALL
  SELECT evt1.id, '16:00', 30, 'Sound Check', 'Test all audio equipment', 'Groove Masters DJ', 'pending', 2 FROM evt1
  UNION ALL
  SELECT evt1.id, '17:00', 60, 'Guest Arrival', 'Welcome drinks and canapés', 'Signature Catering', 'pending', 3 FROM evt1
  UNION ALL
  SELECT evt1.id, '18:00', 30, 'Ceremony', 'Main wedding ceremony begins', 'Planner', 'pending', 4 FROM evt1
  UNION ALL
  SELECT evt1.id, '18:30', 60, 'Reception', 'Dinner, toasts, and dancing', 'Planner', 'pending', 5 FROM evt1
  UNION ALL
  SELECT evt1.id, '22:00', 30, 'Pack Down', 'Vendor load-out', 'All vendors', 'pending', 6 FROM evt1
  RETURNING id
),

fin_entries AS (
  INSERT INTO financial_entries (event_id, event_vendor_id, vendor_name, description, category, quantity, total_amount, advance_paid, balance, payment_status, payment_date)
  SELECT evt1.id, NULL, 'Venue Deposit', 'Transcorp Hilton deposit', 'Venue', 1, 1000000, 1000000, 0, 'paid', '2026-04-01' FROM evt1
  UNION ALL
  SELECT evt1.id, NULL, 'Printing & Signs', 'Invitation cards + banners', 'Printing', 1, 150000, 75000, 75000, 'advance', '2026-05-10' FROM evt1
  UNION ALL
  SELECT evt2.id, NULL, 'Landmark Centre', 'Venue rental for summit', 'Venue', 1, 3000000, 1500000, 1500000, 'advance', '2026-05-20' FROM evt2
  UNION ALL
  SELECT evt2.id, NULL, 'Branding & Signage', 'Conference banners', 'Printing', 1, 350000, 175000, 175000, 'advance', '2026-06-01' FROM evt2
  UNION ALL
  SELECT evt1.id, ev_vendor1.id, 'Signature Catering', 'Buffet catering', 'Catering', 200, 2500000, 1250000, 1250000, 'advance', '2026-06-01' FROM evt1, ev_vendor1
  UNION ALL
  SELECT evt1.id, ev_vendor2.id, 'LensCraft Studio', 'Photography', 'Photography', 1, 500000, 250000, 250000, 'advance', '2026-06-15' FROM evt1, ev_vendor2
  RETURNING id
)

SELECT 'Seed complete' AS result;
