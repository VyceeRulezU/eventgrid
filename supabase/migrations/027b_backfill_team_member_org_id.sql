-- Backfill org_id for existing team members who have event_access
-- but no org_id set on their profile

UPDATE profiles p
SET org_id = e.org_id
FROM event_access ea
JOIN events e ON e.id = ea.event_id
WHERE p.id = ea.user_id
  AND p.org_id IS NULL;
