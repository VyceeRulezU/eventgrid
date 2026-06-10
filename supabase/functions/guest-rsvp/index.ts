import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const rateLimitCache = new Map<string, number[]>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const window = 60_000
  const max = 10
  const timestamps = (rateLimitCache.get(ip) || []).filter(t => now - t < window)
  if (timestamps.length >= max) return true
  timestamps.push(now)
  rateLimitCache.set(ip, timestamps)
  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  if (checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
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

      const { data: guests, error: guestErr } = await supabaseAdmin
        .from('guests')
        .select('id, first_name, last_name, rsvp_status, notes')
        .eq('event_id', event_id)
        .eq('email', email)
        .limit(1)

      if (guestErr) {
        console.error('Guest lookup error:', guestErr)
        return new Response(
          JSON.stringify({ error: `Database error: ${(guestErr as Error).message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!guests || guests.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Guest not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const guest = guests[0]

      const { data: events, error: eventErr } = await supabaseAdmin
        .from('events')
        .select('name, event_date, venue_name, venue_address')
        .eq('id', event_id)
        .limit(1)

      if (eventErr) {
        console.error('Event lookup error:', eventErr)
        return new Response(
          JSON.stringify({ error: `Event query error: ${(eventErr as Error).message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!events || events.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Event not found — it may have been deleted.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const event = events[0]

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
