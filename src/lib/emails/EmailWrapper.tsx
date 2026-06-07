import type { ReactNode } from 'react'

interface EmailWrapperProps {
  previewText: string
  children: ReactNode
  appUrl?: string
}

export function EmailWrapper({
  previewText,
  children,
  appUrl = 'https://eventgrid.ng',
}: EmailWrapperProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>EventGrid</title>
        <style>{`
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 20px 10px !important; }
            .content-card { border-radius: 12px !important; padding: 24px 16px !important; }
            .button { width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
          }
        `}</style>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#111827', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
        {/* Hidden preview text for email client list views */}
        <div style={{ display: 'none', maxLines: 0, opacity: 0, overflow: 'hidden', fontSize: 1 }}>
          {previewText}
        </div>

        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#111827', padding: '40px 16px' }}>
          <tr>
            <td align="center">
              <table className="container" width="560" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '16px', overflow: 'hidden', maxWidth: '560px', width: '100%', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)' }}>
                {/* Header Section */}
                <tr>
                  <td style={{ backgroundColor: '#D4A017', padding: '24px 32px' }}>
                    <table cellPadding="0" cellSpacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <table cellPadding="0" cellSpacing="0">
                            <tr>
                              <td style={{ paddingRight: '10px', verticalAlign: 'middle' }}>
                                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                                  <rect x="2" y="2" width="12" height="12" rx="3" fill="#111827" opacity="0.9"/>
                                  <rect x="18" y="2" width="12" height="12" rx="3" fill="#111827" opacity="0.6"/>
                                  <rect x="2" y="18" width="12" height="12" rx="3" fill="#111827" opacity="0.6"/>
                                  <rect x="18" y="18" width="12" height="12" rx="3" fill="#111827" opacity="0.9"/>
                                </svg>
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>
                                <span style={{ fontSize: '22px', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em' }}>EventGrid</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Main Content Area */}
                <tr>
                  <td className="content-card" style={{ padding: '40px 32px' }}>
                    {children}
                  </td>
                </tr>

                {/* Footer Section */}
                <tr>
                  <td style={{ padding: '24px 32px', borderTop: '1px solid #374151', backgroundColor: '#18202F' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', textAlign: 'center', lineHeight: 1.5 }}>
                      EventGrid — Software for Event Pros
                      <br />
                      This email was sent to you because you created an account on{' '}
                      <a href={appUrl} style={{ color: '#D4A017', textDecoration: 'none', fontWeight: 600 }}>eventgrid.ng</a>.
                    </p>
                    <p style={{ margin: '12px 0 0', fontSize: '11px', color: '#4B5563', textAlign: 'center' }}>
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
