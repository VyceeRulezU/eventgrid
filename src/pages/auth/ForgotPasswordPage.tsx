import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
import { AuthTestimonials } from '@/components/auth/AuthTestimonials'
import styles from './Auth.module.css'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const showToast = useUIStore((s) => s.showToast)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) {
      showToast({ type: 'error', title: 'Failed to send reset email', body: error.message })
      return
    }

    setSent(true)
  }

  return (
    <div className={styles.container}>
      <SEO title="Forgot Password — NaliGrid" description="Reset your NaliGrid account password and regain access to your event management workspace." />
      <AuthTestimonials />

      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          <div className={styles.formHeader}>
            <h1>Reset your password</h1>
            <p className={styles.formSubtitle}>
              {sent
                ? 'Check your email for the reset link.'
                : 'Enter your email and we will send you a reset link.'}
            </p>
          </div>

          {sent ? (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
              <div style={{
                width: 64, height: 64,
                backgroundColor: 'var(--color-accent-muted)',
                color: 'var(--color-accent)',
                borderRadius: 'var(--radius-full)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto var(--space-4)',
              }}>
                <Mail size={32} />
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 var(--space-4)' }}>
                We sent a password reset link to <strong>{email}</strong>.
                Click the link in the email to create a new password.
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                Did not get the email? Check your spam folder or{' '}
                <button type="button" className={styles.formLink} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', padding: 0 }} onClick={() => setSent(false)}>
                  try again
                </button>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="input-wrapper">
                <label className="input-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className={styles.inputField}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading || !email.trim()}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'var(--space-5)', gap: 'var(--space-2)' }}>
            <Link to="/login" className={styles.formLink} style={{ fontSize: 'var(--text-sm)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
            <Link to="/" className={styles.backToLanding}>
              <ArrowLeft size={16} />
              Back to main site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
