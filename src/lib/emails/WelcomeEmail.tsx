import { EmailWrapper } from './EmailWrapper.tsx'

export interface WelcomeEmailProps {
  first_name: string
  dashboard_url: string
}

export function WelcomeEmail({ first_name, dashboard_url }: WelcomeEmailProps) {
  return (
    <EmailWrapper previewText={`Welcome to NaliGrid, ${first_name}! Let's get your first event set up.`}>
      <h1 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
        Welcome to the grid, {first_name}! 🥂
      </h1>

      <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        We are thrilled to help you elevate your event workflows. NaliGrid is built specifically for event professionals to collaborate with teams, vendors, and clients — all from a single dashboard.
      </p>

      <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        Here is what you can get done right out of the gate:
      </p>

      <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '32px' }}>
        <tr>
          <td style={{ paddingBottom: '16px', verticalAlign: 'top' }}>
            <span style={{ fontSize: '18px', marginRight: '8px' }}>🚀</span>
          </td>
          <td style={{ paddingBottom: '16px', fontSize: '14px', color: '#D1D5DB', lineHeight: 1.5 }}>
            <strong style={{ color: '#F9FAFB', display: 'block', marginBottom: '2px' }}>Interactive 9-Phase Tracker</strong>
            Follow a structured workflow from lead capture to final post-event report.
          </td>
        </tr>
        <tr>
          <td style={{ paddingBottom: '16px', verticalAlign: 'top' }}>
            <span style={{ fontSize: '18px', marginRight: '8px' }}>💰</span>
          </td>
          <td style={{ paddingBottom: '16px', fontSize: '14px', color: '#D1D5DB', lineHeight: 1.5 }}>
            <strong style={{ color: '#F9FAFB', display: 'block', marginBottom: '2px' }}>Naira-Native Financials</strong>
            Track vendor payments, client budget deposits, and outstanding balance schedules.
          </td>
        </tr>
        <tr>
          <td style={{ paddingBottom: '0px', verticalAlign: 'top' }}>
            <span style={{ fontSize: '18px', marginRight: '8px' }}>✨</span>
          </td>
          <td style={{ paddingBottom: '0px', fontSize: '14px', color: '#D1D5DB', lineHeight: 1.5 }}>
            <strong style={{ color: '#F9FAFB', display: 'block', marginBottom: '2px' }}>Client Portals</strong>
            Generate read-only portals for clients to check timelines without constant messaging.
          </td>
        </tr>
      </table>

      <table cellPadding="0" cellSpacing="0" style={{ margin: '0 auto 28px' }}>
        <tr>
          <td style={{ backgroundColor: '#D4A017', borderRadius: '10px' }}>
            <a className="button" href={dashboard_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '14px 32px', fontSize: '15px', fontWeight: 700, color: '#111827', textDecoration: 'none', borderRadius: '10px', boxShadow: '0 4px 12px rgba(212, 160, 23, 0.25)' }}>
              Open My Workspace →
            </a>
          </td>
        </tr>
      </table>

      <p style={{ margin: '24px 0 0', fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
        If you have any questions or need a hand, reply directly to this email. We're here to help you shine.
        <br /><br />
        Cheers,
        <br />
        <strong>The NaliGrid Team</strong>
      </p>
    </EmailWrapper>
  )
}
