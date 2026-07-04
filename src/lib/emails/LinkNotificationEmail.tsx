import { EmailWrapper } from './EmailWrapper.tsx'

export interface LinkNotificationEmailProps {
  first_name: string
  provider: string
  action: 'linked' | 'unlinked'
  settings_url: string
}

export function LinkNotificationEmail({ first_name, provider, action, settings_url }: LinkNotificationEmailProps) {
  const providerLabel = provider === 'google' ? 'Google' : 'Facebook'
  const headline = action === 'linked'
    ? `${providerLabel} account linked`
    : `${providerLabel} account unlinked`

  return (
    <EmailWrapper previewText={`Your ${providerLabel} account has been ${action === 'linked' ? 'linked' : 'unlinked'} from NaliGrid.`}>
      <h1 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 300, color: '#F9FAFB', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
        {headline}
      </h1>

      <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        Hi {first_name},
      </p>

      <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        {action === 'linked' ? (
          <>You've successfully linked your <strong>{providerLabel}</strong> account to NaliGrid. You can now sign in using {providerLabel}.</>
        ) : (
          <>Your <strong>{providerLabel}</strong> account has been unlinked from NaliGrid. You'll need another sign-in method to access your account.</>
        )}
      </p>

      <table cellPadding="0" cellSpacing="0" style={{ margin: '0 auto 28px' }}>
        <tr>
          <td style={{ backgroundColor: '#D4A017', borderRadius: '10px' }}>
            <a className="button" href={settings_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '14px 32px', fontSize: '15px', fontWeight: 700, color: '#111827', textDecoration: 'none', borderRadius: '10px', boxShadow: '0 4px 12px rgba(212, 160, 23, 0.25)' }}>
              Account Settings →
            </a>
          </td>
        </tr>
      </table>

      <p style={{ margin: '24px 0 0', fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
        If you didn't make this change, please contact us immediately at{' '}
        <a href="mailto:support@naligrid.com" style={{ color: '#D4A017', textDecoration: 'none', fontWeight: 600 }}>support@naligrid.com</a>.
        <br /><br />
        Warmly,
        <br />
        <strong>The NaliGrid Team</strong>
      </p>
    </EmailWrapper>
  )
}
