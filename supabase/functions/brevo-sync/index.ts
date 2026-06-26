import { createClient } from 'jsr:@supabase/supabase-js@2'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')!
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
    const { data: profiles } = await supabase
      .from('profiles')
      .select('email, display_name, role')
      .eq('is_active', true)
      .not('email', 'is', null)

    const { data: surveyEmails } = await supabase
      .from('survey_responses')
      .select('respondent_email, respondent_name, respondent_role')
      .not('respondent_email', 'is', null)

    const seen = new Set<string>()
    interface SyncItem { email: string; name: string | null; role: string | null }
    const contacts: SyncItem[] = []

    if (profiles) {
      for (const p of profiles) {
        if (!p.email || seen.has(p.email)) continue
        seen.add(p.email)
        contacts.push({ email: p.email, name: p.display_name, role: p.role })
      }
    }

    if (surveyEmails) {
      for (const s of surveyEmails) {
        const email = s.respondent_email?.trim().toLowerCase()
        if (!email || seen.has(email)) continue
        seen.add(email)
        contacts.push({ email, name: s.respondent_name, role: s.respondent_role })
      }
    }

    let imported = 0
    let failed = 0

    for (const c of contacts) {
      const attributes: Record<string, string> = {}
      if (c.name) attributes.NOM = c.name
      if (c.role) attributes.ROLE = c.role

      const res = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(c.email)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
          email: c.email,
          attributes,
          updateEnabled: true,
        }),
      })

      if (res.ok || res.status === 204) {
        imported++
      } else {
        const errText = await res.text()
        // 404 means contact doesn't exist — try creating via POST
        if (res.status === 404) {
          const createRes = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': BREVO_API_KEY,
            },
            body: JSON.stringify({
              email: c.email,
              attributes,
            }),
          })
          if (createRes.ok) {
            imported++
          } else {
            failed++
            console.error(`Failed to create contact ${c.email}:`, await createRes.text())
          }
        } else {
          failed++
          console.error(`Brevo upsert failed for ${c.email}:`, errText)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, imported, failed, total: contacts.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('brevo-sync error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
