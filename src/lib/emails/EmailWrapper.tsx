import type { ReactNode } from 'react'

interface EmailWrapperProps {
  previewText: string
  children: ReactNode
  appUrl?: string
  heroImage?: string
}

export function EmailWrapper({
  previewText,
  children,
  appUrl = 'https://eventgrid.ng',
  heroImage = appUrl + '/emails/corporate_event_hall.png',
}: EmailWrapperProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>EventGrid</title>
        <style>{`
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; max-width: 100% !important; }
            .content-pad { padding: 32px 20px !important; }
            .button { width: 100% !important; text-align: center !important; box-sizing: border-box !important; display: block !important; }
          }
        `}</style>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0B1120', fontFamily: "'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" }}>
        <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden', fontSize: 1, lineHeight: 1, color: '#0B1120', opacity: 0 }}>
          {previewText}
        </div>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#0B1120', padding: '40px 16px' }}>
          <tr>
            <td align="center">
              <table className="container" width="560" cellPadding="0" cellSpacing="0" style={{ maxWidth: '560px', width: '100%', backgroundColor: '#1a2432', border: '1px solid #2a3a4e', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>

                {/* Hero image header */}
                <tr>
                  <td style={{ backgroundColor: '#1a1a2e', backgroundImage: 'url(' + heroImage + ')', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', padding: 0 }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(11,17,32,0.92) 0%, rgba(11,17,32,0.55) 50%, rgba(11,17,32,0.3) 100%)', padding: '52px 32px 44px', textAlign: 'center' }}>
                      <table cellPadding="0" cellSpacing="0" style={{ margin: '0 auto 18px' }}>
                        <tr>
                          <td style={{ width: '44px', height: '3px', backgroundColor: '#D4A017', borderRadius: '2px' }} />
                        </tr>
                      </table>
                      <table cellPadding="0" cellSpacing="0" style={{ margin: '0 auto' }}>
                        <tr>
                          <td style={{ verticalAlign: 'middle', paddingRight: '12px' }}>
                            <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
                              <rect x="2" y="2" width="12" height="12" rx="3" fill="#D4A017" opacity="0.9" />
                              <rect x="18" y="2" width="12" height="12" rx="3" fill="#D4A017" opacity="0.6" />
                              <rect x="2" y="18" width="12" height="12" rx="3" fill="#D4A017" opacity="0.6" />
                              <rect x="18" y="18" width="12" height="12" rx="3" fill="#D4A017" opacity="0.9" />
                            </svg>
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            <span style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>EventGrid</span>
                          </td>
                        </tr>
                      </table>
                      <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
                        Software for Event Pros
                      </p>
                    </div>
                  </td>
                </tr>

                {/* Content body */}
                <tr>
                  <td className="content-pad" style={{ padding: '44px 36px', backgroundColor: '#1a2432' }}>
                    {children}
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ padding: '24px 32px', borderTop: '1px solid #2a3a4e', backgroundColor: '#141e2a' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6B7280', textAlign: 'center', lineHeight: 1.6 }}>
                      EventGrid &mdash; Software for Event Pros
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#4B5563', textAlign: 'center', lineHeight: 1.6 }}>
                      This email was sent to you because you have an account on{' '}
                      <a href={appUrl} style={{ color: '#D4A017', textDecoration: 'none', fontWeight: 600 }}>eventgrid.ng</a>.
                    </p>
                    <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#4B5563', textAlign: 'center' }}>
                      &copy; {new Date().getFullYear()} EventGrid. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}
