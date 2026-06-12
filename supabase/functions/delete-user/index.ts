import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TABLE_PRIORITY: { table: string; fk: string; nullable: boolean }[] = [
  { table: 'event_access',     fk: 'user_id',    nullable: false },
  { table: 'notifications',    fk: 'user_id',    nullable: false },
  { table: 'push_subscriptions', fk: 'user_id',  nullable: false },
  { table: 'client_payments',  fk: 'user_id',    nullable: false },
  { table: 'invitations',      fk: 'invited_by', nullable: true  },
  { table: 'vendors',          fk: 'portal_user_id', nullable: true },
  { table: 'tasks',            fk: 'assignee_id', nullable: true  },
  { table: 'events',           fk: 'coordinator_id', nullable: true },
  { table: 'events',           fk: 'client_id',   nullable: true  },
  { table: 'organizations',    fk: 'owner_id',    nullable: true  },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { user_id } = await req.json()
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const errors: string[] = []

    // 1. Clean up referencing rows — delete or nullify FKs
    for (const { table, fk, nullable } of TABLE_PRIORITY) {
      if (nullable) {
        const { error } = await supabaseAdmin.from(table as any).update({ [fk]: null }).eq(fk as any, user_id)
        if (error) errors.push(`${table}.${fk}: ${error.message}`)
      } else {
        const { error } = await supabaseAdmin.from(table as any).delete().eq(fk as any, user_id)
        if (error) errors.push(`${table}.${fk}: ${error.message}`)
      }
    }

    // 2. Delete events created by the user (created_by is NOT NULL)
    const { error: eventsErr } = await supabaseAdmin.from('events').delete().eq('created_by', user_id)
    if (eventsErr) errors.push('events.created_by: ' + eventsErr.message)

    // 3. Delete tasks created by the user
    const { error: tasksErr } = await supabaseAdmin.from('tasks').delete().eq('created_by', user_id)
    if (tasksErr) errors.push('tasks.created_by: ' + tasksErr.message)

    // 4. Delete profile
    const { error: profileErr } = await supabaseAdmin.from('profiles').delete().eq('id', user_id)
    if (profileErr) errors.push('profile: ' + profileErr.message)

    // 5. Delete auth user
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(user_id)
    if (authErr) errors.push('auth: ' + authErr.message)

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ success: false, error: errors.join('; ') }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('delete-user error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
