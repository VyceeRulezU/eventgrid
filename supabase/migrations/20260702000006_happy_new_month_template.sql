-- Happy New Month email campaign template
INSERT INTO public.email_templates (name, subject, body_html)
VALUES (
  'Happy New Month',
  'Happy New Month from NaliGrid',
  $html$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Happy New Month from NaliGrid</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .content-pad { padding: 32px 20px !important; }
      .button { width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0B1120;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1120;padding:40px 16px;">
    <tr>
      <td align="center">
        <table class="container" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#1a2432;border:1px solid #2a3a4e;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4);">
          <tr>
            <td style="background-color:#1a1a2e;background-image:url('https://pub-962633edede94bf8a4e41b91db2b602a.r2.dev/emails/corporate_event_hall.png');background-size:cover;background-position:center;background-repeat:no-repeat;padding:0;">
              <div style="background:linear-gradient(135deg, rgba(11,17,32,0.95) 0%, rgba(11,17,32,0.75) 50%, rgba(11,17,32,0.6) 100%);padding:48px 32px 36px;text-align:center;">
                <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                  <tr><td style="width:44px;height:3px;background-color:#D4A017;border-radius:2px;"></td></tr>
                </table>
                <img src="https://naligrid.com/ng-logo-wg.svg" alt="NaliGrid" style="max-width:160px;height:auto;display:block;margin:0 auto;" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="content-pad" style="padding:44px 36px;background-color:#1a2432;">
              <h1 style="margin:0 0 8px;font-size:28px;font-weight:300;color:#ffffff;text-align:center;letter-spacing:-0.02em;">Happy New Month</h1>
              <p style="margin:0 0 24px;font-size:14px;color:#9CA3AF;text-align:center;">A fresh start awaits</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;"><tr><td style="width:64px;height:2px;background:linear-gradient(90deg,transparent,#D4A017,transparent);"></td></tr></table>
              <p style="margin:0 0 16px;font-size:15px;color:#E5E7EB;line-height:1.7;">Hello {{NAME}},</p>
              <p style="margin:0 0 16px;font-size:15px;color:#E5E7EB;line-height:1.7;">We're thrilled to welcome you to a brand new month. At NaliGrid, every new month brings fresh opportunities to create unforgettable events, build meaningful connections, and turn your visions into reality.</p>
              <p style="margin:0 0 16px;font-size:15px;color:#E5E7EB;line-height:1.7;">Whether you're planning a grand celebration, an intimate gathering, or a corporate event — we're here to help you every step of the way.</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="padding:12px 18px;background:linear-gradient(135deg,rgba(212,160,23,0.12),rgba(212,160,23,0.06));border:1px solid rgba(212,160,23,0.2);border-radius:12px;text-align:center;">
                    <p style="margin:0;font-size:24px;font-weight:300;color:#D4A017;letter-spacing:-0.02em;">Here's to a productive month ahead!</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:15px;color:#E5E7EB;line-height:1.7;">Log in to your dashboard to pick up where you left off.</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#D4A017,#B8860B);border-radius:10px;padding:0;">
                    <a href="https://naligrid.com" class="button" style="display:inline-block;padding:14px 36px;font-size:14px;font-weight:600;color:#0B1120;text-decoration:none;border-radius:10px;">Go to Dashboard</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:14px;color:#9CA3AF;line-height:1.7;text-align:center;">With gratitude,<br /><span style="color:#D4A017;font-weight:600;">The NaliGrid Team</span></p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #2a3a4e;background-color:#141e2a;text-align:center;">
              <img src="https://naligrid.com/ng-logo-wg.svg" alt="NaliGrid" style="max-width:100px;height:auto;display:block;margin:0 auto 16px;" />
              <p style="margin:0 0 4px;font-size:12px;color:#6B7280;line-height:1.6;">NaliGrid &mdash; Software for Event Pros</p>
              <p style="margin:0 0 4px;font-size:11px;color:#4B5563;line-height:1.6;">This email was sent to you because you have an account on <a href="https://naligrid.com" style="color:#D4A017;text-decoration:none;font-weight:600;">naligrid.com</a>.</p>
              <p style="margin:8px 0 0;font-size:11px;color:#4B5563;">&copy; 2026 NaliGrid. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$html$
)
ON CONFLICT (name) DO UPDATE
  SET subject = EXCLUDED.subject,
      body_html = EXCLUDED.body_html,
      updated_at = now();
