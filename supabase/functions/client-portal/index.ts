import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate portal token
    const { data: portal, error: portalError } = await supabaseAdmin
      .from('client_portals')
      .select('event_id, is_active, expires_at')
      .eq('access_token', token)
      .single()

    if (portalError || !portal) {
      return new Response(
        JSON.stringify({ error: 'Portal not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!portal.is_active) {
      return new Response(
        JSON.stringify({ error: 'This portal link has been deactivated by your event planner.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (portal.expires_at && new Date(portal.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'This portal link has expired. Contact your event planner for a new link.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update last_accessed timestamp
    await supabaseAdmin
      .from('client_portals')
      .update({ last_accessed: new Date().toISOString() })
      .eq('access_token', token)

    // Fetch safe event data — no financials, no vendor details
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select(`
        name,
        event_type,
        event_date,
        created_by,
        venue_name,
        guest_count,
        event_phases (
          phase_number,
          phase_name,
          status,
          completed_at
        )
      `)
      .eq('id', portal.event_id)
      .single()

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event data unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sort phases by phase_number
    if (event.event_phases) {
      event.event_phases.sort((a: { phase_number: number }, b: { phase_number: number }) => a.phase_number - b.phase_number)
    }

    return new Response(
      JSON.stringify({ event }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('client-portal error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
