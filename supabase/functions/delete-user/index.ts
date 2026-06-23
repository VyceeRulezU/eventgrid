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
    // ── Verify caller is a super admin ──────────────────────────────────────
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
    // Check super_admin table directly — is_super_admin() RPC uses auth.uid() which
    // returns null when invoked via the service role client, so it always fails here.
    const { data: sa } = await supabaseAdmin
      .from('super_admins')
      .select('user_id')
      .eq('user_id', caller.id)
      .maybeSingle()
    if (!sa) {
      return new Response(
        JSON.stringify({ error: 'Only super admins can delete users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { user_id } = await req.json()
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const errors: string[] = []

    // -- Get orgs owned by this user --
    const { data: userOrgs } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('owner_id', user_id)
    const orgIds = (userOrgs ?? []).map(o => o.id)

    // -- Nullify profiles.org_id that reference our orgs (circular FK) --
    if (orgIds.length > 0) {
      const { error: nullifyErr } = await supabaseAdmin
        .from('profiles')
        .update({ org_id: null })
        .in('org_id', orgIds)
      if (nullifyErr) errors.push('nullify_profiles_org_id: ' + nullifyErr.message)
    }

    // -- Nullify nullable FK references targeted at our user --
    for (const q of [
      supabaseAdmin.from('events').update({ coordinator_id: null }).eq('coordinator_id', user_id),
      supabaseAdmin.from('events').update({ client_id: null }).eq('client_id', user_id),
      supabaseAdmin.from('tasks').update({ assignee_id: null }).eq('assignee_id', user_id),
      supabaseAdmin.from('event_vendors').update({ portal_user_id: null }).eq('portal_user_id', user_id),
      supabaseAdmin.from('invitations').update({ invited_by: null }).eq('invited_by', user_id),
      supabaseAdmin.from('event_activity').update({ actor_id: null }).eq('actor_id', user_id),
      supabaseAdmin.from('vendors').update({ owner_id: null }).eq('owner_id', user_id),
      supabaseAdmin.from('live_board_items').update({ updated_by: null }).eq('updated_by', user_id),
      supabaseAdmin.from('issues').update({ resolved_by: null }).eq('resolved_by', user_id),
      supabaseAdmin.from('petty_cash').update({ logged_by: null }).eq('logged_by', user_id),
    ]) { await q }

    // -- Delete event_vendors referencing vendors in our orgs (FK event_vendors.vendor_id → vendors.id) --
    if (orgIds.length > 0) {
      const vendorIds = (await supabaseAdmin.from('vendors').select('id').in('org_id', orgIds)).data?.map(v => v.id) ?? []
      if (vendorIds.length > 0) {
        const { error: evErr } = await supabaseAdmin.from('event_vendors').delete().in('vendor_id', vendorIds)
        if (evErr) errors.push('event_vendors: ' + evErr.message)
      }
    }

    // -- Delete rows in tables referencing our orgs (these precede org deletion) --
    if (orgIds.length > 0) {
      for (const [table, col] of [
        ['vendors', 'org_id'],
        ['events', 'org_id'],
      ] as [string, string][]) {
        const { error } = await supabaseAdmin.from(table as any).delete().in(col as any, orgIds)
        if (error && !error.message.includes('Found 0 rows')) errors.push(`${table}_by_org: ${error.message}`)
      }
    }

    // -- Delete NOT NULL FK rows referencing our user --
    for (const [table, col] of [
      ['organizations', 'owner_id'],
      ['events', 'created_by'],
      ['tasks', 'created_by'],
      ['issues', 'raised_by'],
      ['media', 'uploader_id'],
      ['task_comments', 'user_id'],
      ['live_feed_posts', 'user_id'],
    ] as [string, string][]) {
      const { error } = await supabaseAdmin.from(table as any).delete().eq(col as any, user_id)
      if (error) errors.push(`${table}: ${error.message}`)
    }

    // -- Delete super_admins entry --
    const { error: saErr } = await supabaseAdmin.from('super_admins').delete().eq('user_id', user_id)
    if (saErr) errors.push('super_admins: ' + saErr.message)

    // -- Delete profile (cascades to event_access, notifications, push_subscriptions) --
    const { error: profileErr } = await supabaseAdmin.from('profiles').delete().eq('id', user_id)
    if (profileErr) errors.push('profile: ' + profileErr.message)

    // -- Delete auth user --
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
    console.error('delete-user error:', err instanceof Error ? err.stack || err.message : err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? `${err.name}: ${err.message}` : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
