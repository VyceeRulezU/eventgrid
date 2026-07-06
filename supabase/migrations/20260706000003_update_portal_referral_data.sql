-- Drop the old function before recreating it to avoid parameter name conflict errors
DROP FUNCTION IF EXISTS public.get_portal_referral_data(text);

-- Recreate security definer function to fetch unified referral data for the public partner portal using token or code
CREATE OR REPLACE FUNCTION public.get_portal_referral_data(portal_identifier text)
RETURNS TABLE (
  id uuid,
  display_name text,
  email text,
  org_name text,
  status text,
  commission_amount numeric,
  activated_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH partner_info AS (
    SELECT p.id AS partner_id, p.code
    FROM public.referral_partners p
    LEFT JOIN public.referral_portals rp ON rp.partner_id = p.id
    WHERE (rp.token::text = portal_identifier OR p.code::text = upper(portal_identifier))
      AND p.is_active = true
    LIMIT 1
  ),
  signups AS (
    SELECT pr.id AS user_id, pr.display_name, pr.email, o.name AS org_name, pr.created_at
    FROM public.profiles pr
    CROSS JOIN partner_info pi
    LEFT JOIN public.organizations o ON o.id = pr.org_id
    WHERE pr.referred_by_code::text = pi.code::text
  )
  SELECT 
    s.user_id AS id,
    coalesce(s.display_name, 'Unknown'::text) AS display_name,
    coalesce(s.email, ''::text) AS email,
    coalesce(s.org_name, '—'::text) AS org_name,
    coalesce(r.status, 'pending_activation'::text) AS status,
    coalesce(r.commission_amount, 0::numeric) AS commission_amount,
    r.activated_at,
    r.paid_at,
    s.created_at
  FROM signups s
  CROSS JOIN partner_info pi
  LEFT JOIN public.referral_redemptions r ON r.referred_user_id = s.user_id AND r.partner_id = pi.partner_id
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_portal_referral_data(text) TO anon, authenticated;
