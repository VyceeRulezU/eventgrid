import { createClient } from 'jsr:@supabase/supabase-js@2'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'NaliGrid <noreply@naligrid.com>'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { campaign_id } = await req.json()

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: campaign_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Fetch campaign
    const { data: campaign, error: campErr } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campErr || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Fetch all active profile emails + survey respondent emails
    const [profilesRes, surveysRes] = await Promise.all([
      supabase.from('profiles').select('email, display_name').eq('is_active', true).not('email', 'is', null),
      supabase.from('survey_responses').select('respondent_email, respondent_name').not('respondent_email', 'is', null),
    ])

    const seen = new Set<string>()
    const recipients: { email: string; name: string }[] = []

    if (profilesRes.data) {
      for (const p of profilesRes.data) {
        const email = p.email?.trim().toLowerCase()
        if (!email || seen.has(email)) continue
        seen.add(email)
        recipients.push({ email, name: p.display_name || email.split('@')[0] })
      }
    }

    if (surveysRes.data) {
      for (const s of surveysRes.data) {
        const email = s.respondent_email?.trim().toLowerCase()
        if (!email || seen.has(email)) continue
        seen.add(email)
        recipients.push({ email, name: s.respondent_name || email.split('@')[0] })
      }
    }

    // Send via Brevo transactional email
    let sent = 0
    let failed = 0

    for (const r of recipients) {
      const personalHtml = campaign.body_html
        .replaceAll('{{NAME}}', r.name)
        .replaceAll('{{EMAIL}}', r.email)

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { email: FROM_EMAIL.match(/<(.+)>/)?.[1] || FROM_EMAIL, name: FROM_EMAIL.match(/^(.+)</)?.[1]?.trim() || 'NaliGrid' },
          to: [{ email: r.email, name: r.name }],
          subject: campaign.subject,
          htmlContent: personalHtml,
          textContent: campaign.body_text || undefined,
        }),
      })

      if (res.ok) {
        sent++
      } else {
        failed++
        console.error(`Failed to send to ${r.email}:`, await res.text())
      }
    }

    // Update campaign status
    await supabase
      .from('email_campaigns')
      .update({ status: 'sent', sent_at: new Date().toISOString(), recipient_count: sent })
      .eq('id', campaign_id)

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: recipients.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('brevo-send error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
