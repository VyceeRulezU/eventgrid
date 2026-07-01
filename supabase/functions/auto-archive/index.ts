import { createClient } from 'jsr:@supabase/supabase-js@2'
import { reportError } from '../_shared/sentry.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('events')
      .update({ status: 'archived', archived_at: now, archived_until: null, updated_at: now })
      .or(`and(payment_status.eq.paid,event_date.lt.${today},status.neq.archived,status.neq.cancelled,status.neq.draft),and(archived_until.lt.${now},status.neq.archived,status.neq.cancelled)`)
      .is('archived_at', null)
      .select('id, name')

    if (error) {
      console.error('auto-archive error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const count = data?.length || 0
    console.log(`Auto-archived ${count} event(s)`)
    return new Response(
      JSON.stringify({ success: true, archived: count }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('auto-archive error:', err)
    await reportError(err, { function: 'auto-archive' })
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
