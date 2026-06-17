import { EmailWrapper } from './EmailWrapper.tsx'

export interface PaymentEmailProps {
  first_name: string
  event_name: string
  amount: string
  payment_method: string
  portal_url: string
}

export function PaymentEmail({
  first_name,
  event_name,
  amount,
  payment_method,
  portal_url,
}: PaymentEmailProps) {
  return (
    <EmailWrapper previewText={`Payment of ${amount} confirmed for ${event_name} — NaliGrid`}>
      <h1 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
        Payment Confirmed! 💳
      </h1>

      <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        Hi {first_name},
      </p>

      <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        We've successfully processed and confirmed a payment of <strong style={{ color: '#D4A017' }}>{amount}</strong> for the event <strong style={{ color: '#F9FAFB' }}>{event_name}</strong>.
      </p>

      <div style={{ backgroundColor: '#18202F', border: '1px solid #374151', borderRadius: '12px', padding: '24px', marginBottom: '28px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 800, color: '#F9FAFB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Transaction Summary
        </h3>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td style={{ paddingBottom: '10px', fontSize: '13px', color: '#9CA3AF' }}>Event Name:</td>
            <td style={{ paddingBottom: '10px', fontSize: '13px', color: '#F9FAFB', fontWeight: 600, textAlign: 'right' }}>{event_name}</td>
          </tr>
          <tr>
            <td style={{ paddingBottom: '10px', fontSize: '13px', color: '#9CA3AF' }}>Amount Confirmed:</td>
            <td style={{ paddingBottom: '10px', fontSize: '13px', color: '#D4A017', fontWeight: 700, textAlign: 'right' }}>{amount}</td>
          </tr>
          <tr>
            <td style={{ paddingBottom: '0px', fontSize: '13px', color: '#9CA3AF' }}>Payment Method:</td>
            <td style={{ paddingBottom: '0px', fontSize: '13px', color: '#F9FAFB', fontWeight: 600, textAlign: 'right' }}>{payment_method}</td>
          </tr>
        </table>
      </div>

      <table cellPadding="0" cellSpacing="0" style={{ margin: '0 auto 28px' }}>
        <tr>
          <td style={{ backgroundColor: '#D4A017', borderRadius: '10px' }}>
            <a className="button" href={portal_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '14px 32px', fontSize: '15px', fontWeight: 700, color: '#111827', textDecoration: 'none', borderRadius: '10px', boxShadow: '0 4px 12px rgba(212, 160, 23, 0.25)' }}>
              Open Event Portal →
            </a>
          </td>
        </tr>
      </table>

      <p style={{ margin: '24px 0 0', fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
        This transaction receipt is saved in your dashboard's financials tab for auditing.
        <br /><br />
        Cheers,
        <br />
        <strong>The NaliGrid Team</strong>
      </p>
    </EmailWrapper>
  )
}
