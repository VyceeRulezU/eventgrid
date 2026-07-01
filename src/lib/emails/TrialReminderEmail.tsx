import { EmailWrapper } from './EmailWrapper.tsx'

export interface TrialReminderEmailProps {
  first_name: string
  financials_url: string
}

export function TrialReminderEmail({ first_name, financials_url }: TrialReminderEmailProps) {
  return (
    <EmailWrapper previewText={`Friendly reminder, ${first_name}: Track Naira payments and vendor budgets with zero stress.`}>
      <h1 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 300, color: '#F9FAFB', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
        Tired of messy Excel budgets? 💸
      </h1>

      <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        Hi {first_name}, spreadsheets are great, but they don't capture vendor payment reminders, calculate client deposits in real time, or link invoices directly to event execution dates.
      </p>

      <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        With NaliGrid's Naira Financials and Budget dashboards, you can:
      </p>

      <ul style={{ margin: '0 0 28px', paddingLeft: '20px', fontSize: '14px', color: '#D1D5DB', lineHeight: 1.6 }}>
        <li style={{ marginBottom: '8px' }}>
          <strong>Monitor Cash Flow:</strong> Add advance payments, track outstanding balances, and check vendor status.
        </li>
        <li style={{ marginBottom: '8px' }}>
          <strong>Lock In Vendor Rates:</strong> Upload vendor contracts and associate payments directly with milestone tasks.
        </li>
        <li style={{ marginBottom: '0px' }}>
          <strong>Integrated Gateways:</strong> Initiate instant payments via Paystack and Korapay right from the platform.
        </li>
      </ul>

      <table cellPadding="0" cellSpacing="0" style={{ margin: '0 auto 28px' }}>
        <tr>
          <td style={{ backgroundColor: '#D4A017', borderRadius: '10px' }}>
            <a className="button" href={financials_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '14px 32px', fontSize: '15px', fontWeight: 700, color: '#111827', textDecoration: 'none', borderRadius: '10px', boxShadow: '0 4px 12px rgba(212, 160, 23, 0.25)' }}>
              Open Financial Dashboard →
            </a>
          </td>
        </tr>
      </table>

      <p style={{ margin: '24px 0 0', fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
        No credit card required. Explore Naira budgeting toolsets today to keep your margins clear.
        <br /><br />
        Cheers,
        <br />
        <strong>The NaliGrid Team</strong>
      </p>
    </EmailWrapper>
  )
}
