import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async () => {
  try {
    const { data, error } = await supabaseAdmin.rpc('list_auth_users' as any)
    if (error) {
      // fallback to admin API if RPC doesn't exist
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) throw listError
      return new Response(
        JSON.stringify({ users: users?.users || [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }
    return new Response(
      JSON.stringify({ users: data || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
