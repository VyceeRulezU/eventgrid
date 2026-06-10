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
    const { action, event_id, email, guest_id, rsvp_status, rsvp_note } = await req.json()

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'lookup') {
      if (!event_id || !email) {
        return new Response(
          JSON.stringify({ error: 'event_id and email are required for lookup' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: guest, error: guestErr } = await supabaseAdmin
        .from('guests')
        .select('id, first_name, last_name, rsvp_status')
        .eq('event_id', event_id)
        .eq('email', email)
        .maybeSingle()

      if (guestErr) {
        console.error('Guest lookup error:', guestErr)
        return new Response(
          JSON.stringify({ error: 'Database error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!guest) {
        return new Response(
          JSON.stringify({ error: 'Guest not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: event, error: eventErr } = await supabaseAdmin
        .from('events')
        .select('name, event_date, location, description')
        .eq('id', event_id)
        .single()

      if (eventErr || !event) {
        return new Response(
          JSON.stringify({ error: 'Event not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ guest, event }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (action === 'rsvp') {
      if (!guest_id || !rsvp_status) {
        return new Response(
          JSON.stringify({ error: 'guest_id and rsvp_status are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!['confirmed', 'declined', 'maybe'].includes(rsvp_status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid rsvp_status. Must be confirmed, declined, or maybe' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const update: Record<string, unknown> = { rsvp_status }
      if (typeof rsvp_note === 'string') {
        update.notes = rsvp_note || null
      }

      const { error: updateErr } = await supabaseAdmin
        .from('guests')
        .update(update)
        .eq('id', guest_id)

      if (updateErr) {
        console.error('RSVP update error:', updateErr)
        return new Response(
          JSON.stringify({ error: 'Failed to update RSVP' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (err) {
    console.error('guest-rsvp error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
