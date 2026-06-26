import { createClient } from 'jsr:@supabase/supabase-js@2'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BrevoContact {
  email: string
  attributes: {
    NOM?: string
    PRENOM?: string
    ROLE?: string
    SOURCE?: string
  }
  listIds: number[]
  updateEnabled: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    // Fetch all active profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('email, display_name, role')
      .eq('is_active', true)
      .not('email', 'is', null)

    // Fetch survey respondents
    const { data: surveyEmails } = await supabase
      .from('survey_responses')
      .select('respondent_email, respondent_name, respondent_role')
      .not('respondent_email', 'is', null)

    // Deduplicate by email
    const seen = new Set<string>()
    const contacts: BrevoContact[] = []

    if (profiles) {
      for (const p of profiles) {
        if (!p.email || seen.has(p.email)) continue
        seen.add(p.email)
        contacts.push({
          email: p.email,
          attributes: {
            NOM: p.display_name || undefined,
            ROLE: p.role || undefined,
            SOURCE: 'profile',
          },
          listIds: [],
          updateEnabled: true,
        })
      }
    }

    if (surveyEmails) {
      for (const s of surveyEmails) {
        const email = s.respondent_email?.trim().toLowerCase()
        if (!email || seen.has(email)) continue
        seen.add(email)
        const nameParts = (s.respondent_name || '').split(' ')
        contacts.push({
          email,
          attributes: {
            PRENOM: nameParts[0] || undefined,
            NOM: nameParts.slice(1).join(' ') || undefined,
            ROLE: s.respondent_role || undefined,
            SOURCE: 'survey',
          },
          listIds: [],
          updateEnabled: true,
        })
      }
    }

    // Batch upsert to Brevo (max 100 per batch)
    let imported = 0
    let failed = 0
    const BATCH_SIZE = 100

    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE)
      const res = await fetch('https://api.brevo.com/v3/contacts/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
          fileBody: btoa(JSON.stringify(batch.map(c => ({
            email: c.email,
            ...c.attributes,
          })))),
          listIds: [],
          updateExistingContacts: true,
        }),
      })

      if (res.ok) {
        imported += batch.length
      } else {
        failed += batch.length
        console.error('Brevo import batch failed:', await res.text())
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
