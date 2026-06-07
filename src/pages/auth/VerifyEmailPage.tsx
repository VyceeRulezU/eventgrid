import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { SEO } from '@/components/shared/SEO'

export function VerifyEmailPage() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: 'var(--space-4)',
      textAlign: 'center',
    }}>
      <SEO title="Verify Your Email" description="Please verify your email address to activate your EventGrid account and start managing your event workflows." />
      <div style={{ maxWidth: 400 }}>
        <div style={{
          width: 64,
          height: 64,
          margin: '0 auto var(--space-6)',
          backgroundColor: 'var(--color-accent-muted)',
          color: 'var(--color-accent)',
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Mail size={32} />
        </div>
        <h2>Check your email</h2>
        <p style={{
          marginTop: 'var(--space-2)',
          color: 'var(--color-text-secondary)',
        }}>
          We sent a verification link to your email. Click the link to activate your account.
        </p>
        <p style={{
          marginTop: 'var(--space-4)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
        }}>
          Didn't get the email?{' '}
          <Link to="/login">Try signing in</Link>
        </p>
      </div>
    </div>
  )
}
