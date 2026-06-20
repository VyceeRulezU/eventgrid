import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
import { AuthTestimonials } from '@/components/auth/AuthTestimonials'
import styles from './Auth.module.css'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const showToast = useUIStore((s) => s.showToast)
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Sync email from sign-up if available
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) {
        setEmail(data.session.user.email)
      }
    })
  }, [])

  const handleResend = async () => {
    if (!email || resending) return
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: import.meta.env.VITE_APP_URL },
      })
      if (error) throw error
      showToast({ type: 'success', title: 'Verification email sent', body: 'Check your inbox for the new confirmation link.' })
    } catch (err) {
      showToast({ type: 'error', title: 'Failed to resend', body: err instanceof Error ? err.message : 'Please try again.' })
    } finally {
      setResending(false)
    }
  }

  const handleConfirmNow = async () => {
    if (!email || confirming) return
    setConfirming(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ email }),
        }
      )
      const body = await res.json()
      if (body?.success === true) {
        showToast({ type: 'success', title: 'Email confirmed', body: 'Your email has been verified. You can now sign in.' })
        navigate('/login', { replace: true })
      } else {
        showToast({ type: 'error', title: 'Confirmation failed', body: body?.error || 'Could not confirm your email. Try signing in.' })
      }
    } catch {
      showToast({ type: 'error', title: 'Confirmation failed', body: 'Could not reach the server. Try signing in.' })
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className={styles.container}>
      <SEO title="Verify Your Email" description="Please verify your email address to activate your NaliGrid account and start managing your event workflows." />
      
      <AuthTestimonials />

      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          <div style={{
            width: 64,
            height: 64,
            backgroundColor: 'var(--color-accent-muted)',
            color: 'var(--color-accent)',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-6)',
          }}>
            <Mail size={32} />
          </div>

          <div className={styles.formHeader}>
            <h1 style={{ fontSize: 'var(--text-title-lg)', fontWeight: 'var(--weight-extrabold)', marginBottom: 'var(--space-2)' }}>Check your email</h1>
            <p className={styles.formSubtitle}>
              We sent a verification link to your email. Click the link in the message to activate your account.
            </p>
          </div>

          <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Didn't get the email? Check your spam folder or try one of the options below.
            </p>

            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleConfirmNow}
              disabled={confirming || !email}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
            >
              {confirming ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
              {confirming ? 'Confirming...' : 'Confirm my email now'}
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleResend}
              disabled={resending || !email}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
            >
              {resending ? <Loader2 size={14} className="spin" /> : <Mail size={14} />}
              {resending ? 'Sending...' : 'Resend verification email'}
            </button>

            <Link to="/login" className={styles.submitBtn} style={{ textDecoration: 'none', textAlign: 'center' }}>
              Sign In to NaliGrid
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

