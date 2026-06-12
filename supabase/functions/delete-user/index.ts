import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    const { user_id } = await req.json()
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Delete from profiles first (respects FK constraints)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user_id)
    if (profileError) {
      console.error('Profile delete error:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete profile: ' + profileError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Then delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id)
    if (authError) {
      console.error('Auth delete error:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete auth user: ' + authError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('delete-user error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
