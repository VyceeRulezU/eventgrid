import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'EventGrid <noreply@eventgrid.ng>'
const APP_URL = Deno.env.get('APP_URL') ?? 'https://eventgrid.ng'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Email templates ─────────────────────────────────────────────────────────

function teamInviteEmail(opts: {
  invitedByName: string
  eventName: string
  inviteLink: string
}): { subject: string; html: string } {
  return {
    subject: `You've been invited to join the ${opts.eventName} team on EventGrid`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Team Invitation</title>
</head>
<body style="margin:0;padding:0;background:#111827;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1F2937;border:1px solid #374151;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#D4A017;padding:24px 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:10px;">
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                      <rect x="2" y="2" width="12" height="12" rx="3" fill="#111827" opacity="0.9"/>
                      <rect x="18" y="2" width="12" height="12" rx="3" fill="#111827" opacity="0.6"/>
                      <rect x="2" y="18" width="12" height="12" rx="3" fill="#111827" opacity="0.6"/>
                      <rect x="18" y="18" width="12" height="12" rx="3" fill="#111827" opacity="0.9"/>
                    </svg>
                  </td>
                  <td>
                    <span style="font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.01em;">EventGrid</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#F9FAFB;line-height:1.3;">
                You're invited to the team! 🎉
              </h1>
              <p style="margin:0 0 20px;font-size:15px;color:#9CA3AF;line-height:1.6;">
                <strong style="color:#F9FAFB;">${opts.invitedByName}</strong> has invited you to collaborate 
                on the event <strong style="color:#D4A017;">${opts.eventName}</strong> on EventGrid.
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#9CA3AF;line-height:1.6;">
                Click the button below to accept your invitation and set up your account. 
                This link expires in 7 days.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#D4A017;border-radius:10px;">
                    <a href="${opts.inviteLink}" 
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#111827;text-decoration:none;border-radius:10px;">
                      Accept Invitation →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.5;">
                If the button doesn't work, copy and paste this link:<br/>
                <a href="${opts.inviteLink}" style="color:#D4A017;word-break:break-all;">${opts.inviteLink}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #374151;">
              <p style="margin:0;font-size:12px;color:#4B5563;text-align:center;">
                EventGrid — Software for Event Pros · 
                <a href="${APP_URL}" style="color:#6B7280;text-decoration:none;">eventgrid.ng</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  }
}

function vendorInviteEmail(opts: {
  invitedByName: string
  eventName: string
  vendorName: string
  portalLink: string
  serviceName: string
}): { subject: string; html: string } {
  return {
    subject: `Vendor confirmation for ${opts.eventName} — EventGrid`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#111827;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1F2937;border:1px solid #374151;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
          <tr>
            <td style="background:#D4A017;padding:24px 32px;">
              <span style="font-size:20px;font-weight:700;color:#111827;">EventGrid</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#F9FAFB;">
                You've been booked for ${opts.eventName}
              </h1>
              <p style="margin:0 0 16px;font-size:15px;color:#9CA3AF;line-height:1.6;">
                Hi <strong style="color:#F9FAFB;">${opts.vendorName}</strong>,<br/>
                <strong style="color:#F9FAFB;">${opts.invitedByName}</strong> has confirmed you as the 
                <strong style="color:#D4A017;">${opts.serviceName}</strong> vendor for 
                <strong style="color:#F9FAFB;">${opts.eventName}</strong>.
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#9CA3AF;line-height:1.6;">
                Use your vendor portal to view your delivery checklist, confirm arrival, 
                and update your status on event day.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#D4A017;border-radius:10px;">
                    <a href="${opts.portalLink}" 
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#111827;text-decoration:none;">
                      Open Vendor Portal →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;color:#6B7280;">
                Portal link: <a href="${opts.portalLink}" style="color:#D4A017;">${opts.portalLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #374151;">
              <p style="margin:0;font-size:12px;color:#4B5563;text-align:center;">
                EventGrid · <a href="${APP_URL}" style="color:#6B7280;">eventgrid.ng</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  }
}

function clientPortalEmail(opts: {
  plannerName: string
  eventName: string
  clientName: string
  portalLink: string
  eventDate?: string
}): { subject: string; html: string } {
  return {
    subject: `Your event portal for ${opts.eventName} is ready`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#111827;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1F2937;border:1px solid #374151;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
          <tr>
            <td style="background:#D4A017;padding:24px 32px;">
              <span style="font-size:20px;font-weight:700;color:#111827;">EventGrid</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#F9FAFB;">
                Your event is in great hands ✨
              </h1>
              <p style="margin:0 0 16px;font-size:15px;color:#9CA3AF;line-height:1.6;">
                Hi <strong style="color:#F9FAFB;">${opts.clientName}</strong>,<br/>
                <strong style="color:#F9FAFB;">${opts.plannerName}</strong> has shared your private event portal 
                for <strong style="color:#D4A017;">${opts.eventName}</strong>${opts.eventDate ? ` on <strong style="color:#F9FAFB;">${opts.eventDate}</strong>` : ''}.
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#9CA3AF;line-height:1.6;">
                Track your event planning progress, view milestones, approve decisions, 
                and stay updated — all without needing to create an account.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#D4A017;border-radius:10px;">
                    <a href="${opts.portalLink}" 
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#111827;text-decoration:none;">
                      View My Event Portal →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;color:#6B7280;">
                Your private portal: <a href="${opts.portalLink}" style="color:#D4A017;word-break:break-all;">${opts.portalLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #374151;">
              <p style="margin:0;font-size:12px;color:#4B5563;text-align:center;">
                EventGrid · <a href="${APP_URL}" style="color:#6B7280;">eventgrid.ng</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  }
}

// ── Send email via Resend ────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('Resend API error:', res.status, body)
    return false
  }

  const data = await res.json()
  console.log('Email sent:', data.id)
  return true
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      type,           // 'team_member' | 'vendor' | 'client_portal'
      email,
      event_id,
      invited_by_name,
      // admin_monitor specific
      role,
      // vendor-specific
      vendor_name,
      service_name,
      portal_link,
      // client portal specific
      client_name,
      event_date,
    } = await req.json()

    if (!type || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (type !== 'admin_monitor' && !event_id) {
      return new Response(
        JSON.stringify({ error: 'event_id is required for this invite type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let event: { name: string; event_date: string | null } | null = null
    if (event_id) {
      const { data, error: eventError } = await supabaseAdmin
        .from('events')
        .select('name, event_date')
        .eq('id', event_id)
        .single()
      if (eventError || !data) {
        return new Response(
          JSON.stringify({ error: 'Event not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      event = data
    }

    let subject: string
    let html: string

    if (type === 'admin_monitor') {
      const adminRole = role || 'super_admin'
      const roleLabel = adminRole === 'super_admin' ? 'Super Admin'
        : adminRole === 'monitor' ? 'Monitor'
        : adminRole === 'admin_support' ? 'Support'
        : 'Admin'
      const inviteLink = `${APP_URL}/register?role=${adminRole}&invited_by=${encodeURIComponent(email)}`
      subject = `You've been invited as ${roleLabel} on EventGrid`
      html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#111827;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1F2937;border:1px solid #374151;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr><td style="background:#D4A017;padding:24px 32px;">
          <span style="font-size:20px;font-weight:700;color:#111827;">EventGrid</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#F9FAFB;">${roleLabel} Invitation</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#9CA3AF;line-height:1.6;">
            You've been invited to join EventGrid as a <strong style="color:#F9FAFB;">${roleLabel}</strong>. ${adminRole === 'super_admin' ? 'You will have full platform-wide access.' : adminRole === 'monitor' ? 'You will have read-only access to analytics and platform data.' : 'You will be able to manage feedback and platform users.'}
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="background:#D4A017;border-radius:10px;">
              <a href="${inviteLink}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#111827;text-decoration:none;border-radius:10px;">
                Accept Invitation →
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:12px;color:#6B7280;">
            Link: <a href="${inviteLink}" style="color:#D4A017;">${inviteLink}</a>
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #374151;">
          <p style="margin:0;font-size:12px;color:#4B5563;text-align:center;">EventGrid · <a href="${APP_URL}" style="color:#6B7280;">eventgrid.ng</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    } else if (type === 'team_member') {
      // Generate magic link invite
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email,
        options: {
          data: { role: 'team_member', event_id },
          redirectTo: `${APP_URL}/onboarding/team-member?event_id=${event_id}`,
        },
      })

      if (linkError || !linkData?.properties?.action_link) {
        console.error('Magic link error:', linkError)
        return new Response(
          JSON.stringify({ error: 'Failed to generate invite link' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const template = teamInviteEmail({
        invitedByName: invited_by_name ?? 'Your event planner',
        eventName: event.name,
        inviteLink: linkData.properties.action_link,
      })
      subject = template.subject
      html = template.html

    } else if (type === 'vendor') {
      const link = portal_link ?? `${APP_URL}/vendor-portal/${event_id}`
      const template = vendorInviteEmail({
        invitedByName: invited_by_name ?? 'Your event planner',
        eventName: event.name,
        vendorName: vendor_name ?? 'Vendor',
        portalLink: link,
        serviceName: service_name ?? 'your service',
      })
      subject = template.subject
      html = template.html

    } else if (type === 'client_portal') {
      if (!portal_link) {
        return new Response(
          JSON.stringify({ error: 'portal_link is required for client_portal type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const formattedDate = event_date
        ? new Date(event_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
        : undefined
      const template = clientPortalEmail({
        plannerName: invited_by_name ?? 'Your event planner',
        eventName: event.name,
        clientName: client_name ?? 'Valued Client',
        portalLink: portal_link,
        eventDate: formattedDate,
      })
      subject = template.subject
      html = template.html

    } else {
      return new Response(
        JSON.stringify({ error: `Unknown invite type: ${type}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const sent = await sendEmail(email, subject, html)

    if (!sent) {
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: `${type} invite sent to ${email}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('send-invite error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
