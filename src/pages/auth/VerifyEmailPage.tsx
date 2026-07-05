import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { SEO } from '@/components/shared/SEO'
import { AuthTestimonials } from '@/components/auth/AuthTestimonials'
import styles from './Auth.module.css'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const showToast = useUIStore((s) => s.showToast)
  
  const emailParam = searchParams.get('email') || ''
  const [email, setEmail] = useState(emailParam)
  const [code, setCode] = useState('')
  const [resending, setResending] = useState(false)
  const [verifying, setVerifying] = useState(false)

  // Sync email from sign-up if available (fallback)
  useEffect(() => {
    if (!email) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user?.email) {
          setEmail(data.session.user.email)
        }
      })
    }
  }, [email])

  const handleResend = async () => {
    if (!email || resending) return
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      if (error) throw error
      showToast({ type: 'success', title: 'Verification code sent', body: 'Check your inbox for a new 6-digit code.' })
    } catch (err) {
      showToast({ type: 'error', title: 'Failed to resend', body: err instanceof Error ? err.message : 'Please try again.' })
    } finally {
      setResending(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6 || verifying || !email) return
    setVerifying(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup'
      })
      if (error) throw error

      showToast({ type: 'success', title: 'Email verified', body: 'Welcome to NaliGrid!' })
      
      // Update session in the store
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        useAuthStore.getState().setUser(session.user)
      }

      // Redirect to home/root where AuthGate will direct them appropriately
      navigate('/', { replace: true })
    } catch (err) {
      showToast({ type: 'error', title: 'Verification failed', body: err instanceof Error ? err.message : 'Invalid or expired code.' })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className={styles.container}>
      <SEO title="Verify Your Email" description="Please enter your 6-digit verification code to activate your NaliGrid account and start managing your event workflows." />
      
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
              We sent a 6-digit verification code to <strong style={{ color: 'var(--color-text)' }}>{email || 'your email'}</strong>. Enter the code below to activate your account.
            </p>
          </div>

          <form onSubmit={handleVerify} style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="input-wrapper">
              <label className="input-label" htmlFor="otpCode">Verification Code</label>
              <input
                id="otpCode"
                type="text"
                className={styles.inputField}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                style={{
                  textAlign: 'center',
                  letterSpacing: '0.4em',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'bold',
                  color: 'var(--color-accent)',
                  borderColor: code.length === 6 ? 'var(--color-accent)' : undefined
                }}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={verifying || code.length !== 6 || !email}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
            >
              {verifying ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
              {verifying ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleResend}
              disabled={resending || !email}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
            >
              {resending ? <Loader2 size={14} className="spin" /> : <Mail size={14} />}
              {resending ? 'Sending...' : 'Resend verification code'}
            </button>

            <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
