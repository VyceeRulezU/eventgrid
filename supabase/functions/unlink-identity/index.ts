import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

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
      return new Response(
        JSON.stringify({ error: 'Missing authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { user_id, provider } = await req.json()
    if (!user_id || !provider) {
      return new Response(
        JSON.stringify({ error: 'user_id and provider are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (caller.id !== user_id) {
      return new Response(
        JSON.stringify({ error: 'You can only unlink your own identities' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch user via admin API to check has_password and find identity
    const userRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${user_id}`,
      {
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )
    if (!userRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const userDoc = await userRes.json()
    console.log('unlink-identity admin response keys:', Object.keys(userDoc), 'has_password:', userDoc?.has_password, 'has_password_in:', 'has_password' in userDoc)

    if (!userDoc?.id) {
      return new Response(
        JSON.stringify({ error: 'User not found in admin API' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const identity = userDoc?.identities?.find((i: any) => i.provider === provider)
    if (!identity) {
      return new Response(
        JSON.stringify({ error: `${provider} identity not found for this user` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const deleteRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${user_id}/identities/${identity.id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!deleteRes.ok) {
      const errBody = await deleteRes.text()
      return new Response(
        JSON.stringify({ error: errBody || `Failed to delete identity (${deleteRes.status})` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('unlink-identity error:', err instanceof Error ? err.stack || err.message : err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? `${err.name}: ${err.message}` : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
