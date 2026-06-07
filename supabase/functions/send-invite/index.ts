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

// ── Shared email shell ──────────────────────────────────────────────────────

const HERO_IMAGE = APP_URL + '/emails/corporate_event_hall.png'

function emailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .content-pad { padding: 32px 20px !important; }
      .button { width: 100% !important; text-align: center !important; box-sizing: border-box !important; display: block !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0B1120;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1120;padding:40px 16px;">
    <tr>
      <td align="center">
        <table class="container" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#1a2432;border:1px solid #2a3a4e;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4);">
          <tr>
            <td style="background-color:#1a1a2e;background-image:url('${HERO_IMAGE}');background-size:cover;background-position:center;background-repeat:no-repeat;padding:0;">
              <div style="background:linear-gradient(135deg, rgba(11,17,32,0.95) 0%, rgba(11,17,32,0.75) 50%, rgba(11,17,32,0.6) 100%);padding:52px 32px 44px;text-align:center;">
                <table cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
                  <tr><td style="width:44px;height:3px;background-color:#D4A017;border-radius:2px;"></td></tr>
                </table>
                <img src="${APP_URL}/EventGrid-logo-white.svg" alt="EventGrid" style="max-width:180px;height:auto;display:block;margin:0 auto;" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="content-pad" style="padding:44px 36px;background-color:#1a2432;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #2a3a4e;background-color:#141e2a;text-align:center;">
              <img src="${APP_URL}/EventGrid-logo-white.svg" alt="EventGrid" style="max-width:120px;height:auto;display:block;margin:0 auto 16px;" />
              <p style="margin:0 0 4px;font-size:12px;color:#6B7280;line-height:1.6;">EventGrid &mdash; Software for Event Pros</p>
              <p style="margin:0;font-size:11px;color:#4B5563;line-height:1.6;">This email was sent to you because you have an account on <a href="${APP_URL}" style="color:#D4A017;text-decoration:none;font-weight:600;">eventgrid.ng</a>.</p>
              <p style="margin:8px 0 0;font-size:11px;color:#4B5563;">&copy; 2026 EventGrid. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Email builders ──────────────────────────────────────────────────────────

function teamInviteEmail(opts: {
  invitedByName: string
  eventName: string
  inviteLink: string
}): { subject: string; html: string } {
  return {
    subject: `You've been invited to join the ${opts.eventName} team on EventGrid`,
    html: emailShell('Team Invitation', `
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#F9FAFB;line-height:1.3;letter-spacing:-0.02em;">
                You're invited to the team!
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
                  <td style="background-color:#D4A017;border-radius:10px;">
                    <a href="${opts.inviteLink}" class="button"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#111827;text-decoration:none;border-radius:10px;box-shadow:0 4px 12px rgba(212,160,23,0.25);">
                      Accept Invitation &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.5;">
                If the button doesn't work, copy and paste this link:<br/>
                <a href="${opts.inviteLink}" style="color:#D4A017;word-break:break-all;">${opts.inviteLink}</a>
              </p>`),
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
    html: emailShell('Vendor Confirmation', `
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#F9FAFB;line-height:1.3;letter-spacing:-0.02em;">
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
                  <td style="background-color:#D4A017;border-radius:10px;">
                    <a href="${opts.portalLink}" class="button"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#111827;text-decoration:none;border-radius:10px;box-shadow:0 4px 12px rgba(212,160,23,0.25);">
                      Open Vendor Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;color:#6B7280;">
                Portal link: <a href="${opts.portalLink}" style="color:#D4A017;">${opts.portalLink}</a>
              </p>`),
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
    html: emailShell('Client Portal', `
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#F9FAFB;line-height:1.3;letter-spacing:-0.02em;">
                Your event is in great hands
              </h1>
              <p style="margin:0 0 16px;font-size:15px;color:#9CA3AF;line-height:1.6;">
                Hi <strong style="color:#F9FAFB;">${opts.clientName}</strong>,<br/>
                <strong style="color:#F9FAFB;">${opts.plannerName}</strong> has shared your private event portal 
                for <strong style="color:#D4A017;">${opts.eventName}</strong>${opts.eventDate ? ` on <strong style="color:#F9FAFB;">${opts.eventDate}</strong>` : ''}.
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#9CA3AF;line-height:1.6;">
                Track your event planning progress, view milestones, approve decisions, 
                and stay updated &mdash; all without needing to create an account.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:#D4A017;border-radius:10px;">
                    <a href="${opts.portalLink}" class="button"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#111827;text-decoration:none;border-radius:10px;box-shadow:0 4px 12px rgba(212,160,23,0.25);">
                      View My Event Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;color:#6B7280;">
                Your private portal: <a href="${opts.portalLink}" style="color:#D4A017;word-break:break-all;">${opts.portalLink}</a>
              </p>`),
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
      type,           // 'team_member' | 'vendor' | 'client_portal' | 'coordinator_invite' | 'admin_monitor'
      email,
      event_id,
      invited_by_name,
      org_id,         // coordinator_invite specific
      org_name,       // coordinator_invite specific
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

    // coordinator_invite and admin_monitor don't require event_id
    const needsEventId = !['admin_monitor', 'coordinator_invite'].includes(type)
    if (needsEventId && !event_id) {
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
      html = emailShell(`${roleLabel} Invitation`, `
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#F9FAFB;line-height:1.3;letter-spacing:-0.02em;">${roleLabel} Invitation</h1>
              <p style="margin:0 0 20px;font-size:15px;color:#9CA3AF;line-height:1.6;">
                You've been invited to join EventGrid as a <strong style="color:#F9FAFB;">${roleLabel}</strong>. ${adminRole === 'super_admin' ? 'You will have full platform-wide access.' : adminRole === 'monitor' ? 'You will have read-only access to analytics and platform data.' : 'You will be able to manage feedback and platform users.'}
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:#D4A017;border-radius:10px;">
                    <a href="${inviteLink}" class="button"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#111827;text-decoration:none;border-radius:10px;box-shadow:0 4px 12px rgba(212,160,23,0.25);">
                      Accept Invitation &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;color:#6B7280;">
                Link: <a href="${inviteLink}" style="color:#D4A017;">${inviteLink}</a>
              </p>`)

    // Query to see if the user is already registered in the profiles table
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (type === 'coordinator_invite') {
      // Invite an existing or new coordinator to join an org (no event_id required)
      if (!org_id) {
        return new Response(
          JSON.stringify({ error: 'org_id is required for coordinator_invite' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const redirectUrl = `${APP_URL}/onboarding/coordinator?org_id=${org_id}&invited_by=${encodeURIComponent(invited_by_name ?? '')}`;  
      let linkData: any
      let linkError: any

      if (existingProfile) {
        // User already exists, generate a login link that redirects to coordinator onboarding to associate with org
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: {
            redirectTo: redirectUrl,
          },
        })
        linkData = data
        linkError = error
      } else {
        // User does not exist, generate an invite link which also creates the user record
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
          type: 'invite',
          email,
          options: {
            data: { role: 'coordinator', org_id },
            redirectTo: redirectUrl,
          },
        })
        linkData = data
        linkError = error
      }

      if (linkError || !linkData?.properties?.action_link) {
        console.error('Coordinator invite link error:', linkError)
        return new Response(
          JSON.stringify({ error: 'Failed to generate invite link: ' + (linkError?.message ?? 'unknown') }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const displayOrgName = org_name ?? 'an event planning team'
      subject = `You've been invited to join ${displayOrgName} on EventGrid`
      html = emailShell('Coordinator Invitation', `
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#F9FAFB;line-height:1.3;letter-spacing:-0.02em;">
                You're invited as a Coordinator
              </h1>
              <p style="margin:0 0 20px;font-size:15px;color:#9CA3AF;line-height:1.6;">
                <strong style="color:#F9FAFB;">${invited_by_name ?? 'An event planner'}</strong> has invited you
                to join <strong style="color:#D4A017;">${displayOrgName}</strong> as a Coordinator on EventGrid.
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#9CA3AF;line-height:1.6;">
                Accept your invitation to set up your profile, receive task assignments, and manage
                events in real-time. This link expires in 7 days.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:#D4A017;border-radius:10px;">
                    <a href="${linkData.properties.action_link}" class="button"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#111827;text-decoration:none;border-radius:10px;box-shadow:0 4px 12px rgba(212,160,23,0.25);">
                      Accept Invitation &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.5;">
                If the button doesn't work, copy and paste this link:<br/>
                <a href="${linkData.properties.action_link}" style="color:#D4A017;word-break:break-all;">${linkData.properties.action_link}</a>
              </p>`)

    } else if (type === 'team_member') {
      const redirectUrl = `${APP_URL}/onboarding/team-member?event_id=${event_id}`;
      let linkData: any
      let linkError: any

      if (existingProfile) {
        // User already exists, generate a login link that redirects to team member onboarding to add event access
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: {
            redirectTo: redirectUrl,
          },
        })
        linkData = data
        linkError = error
      } else {
        // User does not exist, generate an invite link which also creates the user record
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
          type: 'invite',
          email,
          options: {
            data: { role: 'team_member', event_id },
            redirectTo: redirectUrl,
          },
        })
        linkData = data
        linkError = error
      }

      if (linkError || !linkData?.properties?.action_link) {
        console.error('Magic link error:', linkError)
        return new Response(
          JSON.stringify({ error: 'Failed to generate invite link: ' + (linkError?.message ?? 'unknown') }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const template = teamInviteEmail({
        invitedByName: invited_by_name ?? 'Your event planner',
        eventName: event!.name,
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
