import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Mail, Key, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
import { AuthTestimonials } from '@/components/auth/AuthTestimonials'
import { useCaptchaToken, CaptchaField, hasCaptcha } from '@/lib/captcha'
import styles from './Auth.module.css'

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const prefilledEmail = searchParams.get('email') || ''
  const isVerified = searchParams.get('verified') === 'true'
  const [email, setEmail] = useState(prefilledEmail)
  const [emailLocked] = useState(!!prefilledEmail)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { token: captchaTokenValue, setToken: setCaptchaToken, getToken: getCaptchaToken } = useCaptchaToken()
  const [magicLinkMode, setMagicLinkMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const navigate = useNavigate()
  const showToast = useUIStore((s) => s.showToast)

  useEffect(() => {
    if (isVerified && prefilledEmail) {
      showToast({ type: 'success', title: 'Email verified', body: 'Your email has been confirmed. Sign in with your password.' })
    }
  }, [])

  async function authRequestWithTimeout<T>(promise: Promise<T>, timeoutMs = 15000) {
    let timeoutId: number | null = null
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error('Authentication request timed out. Check your network and Supabase configuration.'))
      }, timeoutMs)
    })

    try {
      return await Promise.race([promise, timeout]) as T
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (magicLinkMode) {
        const { error } = await authRequestWithTimeout(supabase.auth.signInWithOtp({ email }))
        if (error) throw error

        showToast({ type: 'success', title: 'Magic link sent', body: 'Check your email for the login link.' })
        return
      }

      const captchaToken = getCaptchaToken()
      const { data, error } = await authRequestWithTimeout(supabase.auth.signInWithPassword({ email, password, options: { ...(captchaToken && { captchaToken }) } }))
      if (error) throw error

      if (data.user) {
        navigate('/', { replace: true })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in. Please try again.'
      showToast({ type: 'error', title: 'Login failed', body: message })
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider })
      if (error) {
        showToast({ type: 'error', title: `${provider} sign in failed`, body: error.message })
      }
    } catch {
      showToast({ type: 'error', title: `${provider} sign in failed`, body: 'An unexpected error occurred.' })
    }
  }

  return (
    <div className={styles.container}>
      <SEO title="Sign In to NaliGrid" description="Log in to your NaliGrid account to manage your 9-phase event workflow, track financials in Naira, and stay synced with your vendors." />
      <AuthTestimonials />

      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          <div className={styles.formHeader}>
            <h1>Welcome back</h1>
            <p className={styles.formSubtitle}>
              New to NaliGrid?{' '}
              <Link to="/register" className={styles.formLink}>
                Create an account
              </Link>
            </p>
          </div>

          <form onSubmit={handleLogin}>
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
                disabled={emailLocked}
                style={emailLocked ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              />
              {emailLocked && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={12} /> Email verified — just enter your password
                </div>
              )}
            </div>

            {!magicLinkMode && (
              <div className="input-wrapper" style={{ marginTop: 'var(--space-4)' }}>
                <label className="input-label" htmlFor="password" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={styles.inputField}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required={!magicLinkMode}
                    style={{ paddingRight: '36px' }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      opacity: 0.6,
                      transition: 'opacity var(--transition-fast)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: 'var(--space-1)', textAlign: 'right' }}>
              <Link to="/forgot-password" className={styles.formLink} style={{ fontSize: 'var(--text-xs)' }}>
                Forgot password?
              </Link>
            </div>

            <CaptchaField onToken={setCaptchaToken} />
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || (hasCaptcha && !captchaTokenValue)}
            >
              {loading ? 'Sending...' : magicLinkMode ? 'Send Magic Link' : 'Sign In'}
            </button>
          </form>

          <button
            type="button"
            className="btn btn-ghost"
            style={{ marginTop: 'var(--space-3)', width: '100%', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)' }}
            onClick={() => setMagicLinkMode(!magicLinkMode)}
          >
            {magicLinkMode ? <Key size={14} /> : <Mail size={14} />}
            {magicLinkMode ? 'Sign in with password instead' : 'Send magic link instead'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
              onClick={() => handleOAuth('google')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
              onClick={() => handleOAuth('facebook')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
          </div>

          <Link to="/" className={styles.backToLanding}>
            <ArrowLeft size={16} />
            Back to main site
          </Link>
        </div>
      </div>
    </div>
  )
}
