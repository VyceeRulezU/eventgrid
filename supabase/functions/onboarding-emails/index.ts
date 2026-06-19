import { createClient } from 'jsr:@supabase/supabase-js@2'
import { renderOnboardingEmail, OnboardingEmailType } from '../../../src/lib/emails/index.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
// Default to verified sender domain
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'NaliGrid <onboarding@naligrid.com>'
const APP_URL = Deno.env.get('APP_URL') ?? 'https://naligrid.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResendPayload {
  from: string
  to: string | string[]
  subject: string
  html: string
  text?: string
  reply_to?: string
}

/**
 * Sends email via Resend API
 */
async function sendOnboardingEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  const payload: ResendPayload = {
    from: FROM_EMAIL,
    to,
    subject,
    html,
    text,
    reply_to: 'support@naligrid.com'
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('Resend API onboarding email dispatch error:', res.status, body)
    return false
  }

  const data = await res.json()
  console.log('Onboarding email successfully sent:', data.id)
  return true
}

/**
 * Deno Edge Function Server
 */
Deno.serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      type,       // 'welcome' | 'quick_start' | 'trial_reminder' | 'feedback'
      email,      // recipient email
      first_name, // recipient first name
      meta,       // optional overrides / urls
    } = body

    if (!type || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required payload parameters: type and email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailTypes: OnboardingEmailType[] = ['welcome', 'quick_start', 'trial_reminder', 'feedback', 'payment']
    if (!emailTypes.includes(type)) {
      return new Response(
        JSON.stringify({ error: `Invalid email type. Must be one of: ${emailTypes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare dynamic template props
    const props = {
      first_name: first_name || 'there',
      dashboard_url: meta?.dashboard_url || `${APP_URL}/login`,
      create_event_url: meta?.create_event_url || `${APP_URL}/events/new`,
      financials_url: meta?.financials_url || `${APP_URL}/financials`,
      feedback_url: meta?.feedback_url || `${APP_URL}/settings`,
      // payment specific
      amount: meta?.amount || '₦0',
      event_name: meta?.event_name || 'Event',
      payment_method: meta?.payment_method || 'Card',
      portal_url: meta?.portal_url || `${APP_URL}/login`,
    }

    // Compile email template to HTML + Plain Text using React rendering helper
    const { subject, html, text } = renderOnboardingEmail(type as OnboardingEmailType, props)

    // Send email via Resend
    const success = await sendOnboardingEmail(email, subject, html, text)

    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Failed to send onboarding email via Resend client' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Onboarding email (${type}) sent successfully to ${email}.`,
        subject
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    console.error('onboarding-emails error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
