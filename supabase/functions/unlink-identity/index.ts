import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing auth token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { user_id, provider } = await req.json()
    if (!user_id || !provider) {
      return new Response(JSON.stringify({ error: 'user_id and provider are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (caller.id !== user_id) {
      return new Response(JSON.stringify({ error: 'Cannot unlink others' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Delete the identity row directly from auth.identities via PostgREST with service_role
    const deleteRes = await fetch(
      `${SUPABASE_URL}/rest/v1/identities?user_id=eq.${user_id}&provider=eq.${provider}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Accept-Profile': 'auth',
          'Content-Profile': 'auth',
        },
      }
    )

    const bodyText = await deleteRes.text()

    if (!deleteRes.ok) {
      return new Response(JSON.stringify({ error: bodyText || deleteRes.statusText, debug: { status: deleteRes.status } }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('unlink-identity error:', err instanceof Error ? err.stack || err.message : err)
    return new Response(JSON.stringify({ error: err instanceof Error ? `${err.name}: ${err.message}` : 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
