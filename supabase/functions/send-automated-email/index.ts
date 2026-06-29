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

interface SendRequest {
  template_name: string
  to: { email: string; name?: string }
  variables?: Record<string, string>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json()
    const { template_name, to, variables = {}, attachment, attachments } = body

    if (!template_name || !to?.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: template_name, to.email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: template } = await supabase
      .from('email_templates')
      .select('subject, body_html')
      .eq('name', template_name)
      .single()

    let subject = ''
    let html = ''

    if (!template) {
      if (variables.subject && variables.body_html) {
        subject = variables.subject
        html = variables.body_html
      } else {
        return new Response(
          JSON.stringify({ error: `Template "${template_name}" not found` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    } else {
      subject = template.subject
      html = template.body_html
    }

    const allVars: Record<string, string> = {
      '{{contact.NOM}}': to.name || to.email.split('@')[0],
      '{{contact.VITE_APP_URL}}': Deno.env.get('APP_URL') ?? 'https://naligrid.com',
      ...variables,
    }

    for (const [key, val] of Object.entries(allVars)) {
      subject = subject.replaceAll(key, val)
      html = html.replaceAll(key, val)
    }

    const sender = {
      email: FROM_EMAIL.match(/<(.+)>/)?.[1] || FROM_EMAIL,
      name: FROM_EMAIL.match(/^(.+)</)?.[1]?.trim() || 'NaliGrid',
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
      body: JSON.stringify({
        sender,
        to: [{ email: to.email, name: to.name || to.email.split('@')[0] }],
        subject,
        htmlContent: html,
        attachment: attachments || (attachment ? [attachment] : undefined),
        options: { trackLinks: 'none' },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Brevo send error:', res.status, errText)
      return new Response(
        JSON.stringify({ error: `Brevo API error: ${res.status}`, details: errText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ success: true, to: to.email, template: template_name }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('send-automated-email error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
