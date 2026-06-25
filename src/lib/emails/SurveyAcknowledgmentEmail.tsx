import { EmailWrapper } from './EmailWrapper.tsx'

export interface SurveyAcknowledgmentEmailProps {
  name: string
  register_url: string
}

export function SurveyAcknowledgmentEmail({ name, register_url }: SurveyAcknowledgmentEmailProps) {
  return (
    <EmailWrapper previewText="Thank you for completing our survey — here is your early-access code.">
      <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
        Thank You, {name}!
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        Your survey response has been recorded. We appreciate your time and feedback — it helps us build a better platform for event professionals.
      </p>

      <div style={{ background: '#1a2432', border: '1px solid #2a3a4e', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
        <p style={{ margin: '0 0 8px', color: '#9CA3AF', fontSize: '14px' }}>Your exclusive early-access code</p>
        <p style={{ margin: '0', fontSize: '32px', fontWeight: 700, color: '#fff', letterSpacing: '4px' }}>BETA-NALIGRID</p>
      </div>

      <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        Ready to bring your event ideas to life? Create your free NaliGrid account and use the code above to start planning your first event. From timelines and budgets to vendors and guest lists — everything you need is waiting.
      </p>

      <table cellPadding="0" cellSpacing="0" style={{ margin: '0 auto 28px' }}>
        <tr>
          <td style={{ backgroundColor: '#D4A017', borderRadius: '10px' }}>
            <a className="button" href={register_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '14px 32px', fontSize: '15px', fontWeight: 700, color: '#111827', textDecoration: 'none', borderRadius: '10px', boxShadow: '0 4px 12px rgba(212, 160, 23, 0.25)' }}>
              Create Your Free Account →
            </a>
          </td>
        </tr>
      </table>

      <p style={{ margin: '24px 0 0', fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
        Keep this code safe — you will need it to create an event for free and explore the platform.
        <br /><br />
        Cheers,
        <br />
        <strong>The NaliGrid Team</strong>
      </p>
    </EmailWrapper>
  )
}
