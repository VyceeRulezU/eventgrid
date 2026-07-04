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
      return respond(401, { error: 'Missing authorization token' })
    }

    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !caller) {
      return respond(401, { error: 'Invalid authorization token' })
    }

    const { user_id, provider } = await req.json()
    if (!user_id || !provider) {
      return respond(400, { error: 'user_id and provider are required' })
    }

    if (caller.id !== user_id) {
      return respond(403, { error: 'You can only unlink your own identities' })
    }

    const deleteRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${user_id}/identities/${provider}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const statusText = deleteRes.status === 404 ? 'Identity not found' : deleteRes.statusText
    const bodyText = await deleteRes.text()

    if (!deleteRes.ok) {
      return respond(500, {
        error: bodyText || statusText,
        _debug: { status: deleteRes.status, statusText: deleteRes.statusText },
      })
    }

    return respond(200, { success: true })
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : 'Internal error'
    console.error('unlink-identity error:', msg)
    return respond(500, { error: msg })
  }

  function respond(status: number, body: Record<string, unknown>) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
